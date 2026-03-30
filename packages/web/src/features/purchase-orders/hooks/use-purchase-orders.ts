import { useState, useEffect, useCallback, useRef } from "react";
import {
  addDoc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  runTransaction,
  doc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { partnerCol, partnerDocRef } from "@/lib/firebase-partner";
import { usePartner } from "@/lib/partner";
import { ACCOUNT_CATEGORIES } from "@crm/shared";
import { buildJournalEntry } from "@/features/accounting/utils/journal-entry-builder";
import { calculateItemCostSEK } from "@crm/shared";
import type { PurchaseOrder, PurchaseOrderItem } from "@crm/shared";

export interface PurchaseOrderFormData {
  supplierName: string;
  orderDate: string;
  expectedDeliveryDate?: string;
  markupPercent?: number;
  accountingCategoryId: string;
  notes?: string;
  items: Array<{
    productId: string;
    variantId: string;
    productTitle: string;
    variantTitle: string;
    quantity: number;
    unitPriceInCurrency: number;
    currency: PurchaseOrderItem["currency"];
    rateToSEK: number;
  }>;
}

export function usePurchaseOrders() {
  const { partnerId } = usePartner();
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isSubscribedRef = useRef(false);

  useEffect(() => {
    if (isSubscribedRef.current) return;
    isSubscribedRef.current = true;

    const q = query(
      partnerCol(partnerId, "purchaseOrders"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as PurchaseOrder[];
        setPurchaseOrders(data);
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return () => {
      unsubscribe();
      isSubscribedRef.current = false;
    };
  }, [partnerId]);

  const addPurchaseOrder = useCallback(
    async (data: PurchaseOrderFormData) => {
      const now = new Date().toISOString();
      const { markupPercent } = data;

      const items: PurchaseOrderItem[] = data.items.map((item) => ({
        ...item,
        totalCostSEK: calculateItemCostSEK(
          item.quantity,
          item.unitPriceInCurrency,
          item.rateToSEK,
          markupPercent
        ),
      }));

      const totalCostSEK = items.reduce((sum, i) => sum + i.totalCostSEK, 0);

      await addDoc(partnerCol(partnerId, "purchaseOrders"), {
        supplierName: data.supplierName,
        orderDate: data.orderDate,
        ...(data.expectedDeliveryDate && {
          expectedDeliveryDate: data.expectedDeliveryDate,
        }),
        ...(data.notes && { notes: data.notes }),
        ...(markupPercent !== undefined && { markupPercent }),
        accountingCategoryId: data.accountingCategoryId,
        status: "pending",
        items,
        totalCostSEK: Math.round(totalCostSEK * 100) / 100,
        createdAt: now,
        updatedAt: now,
      });
    },
    [partnerId]
  );

  const ordersRef = useRef(purchaseOrders);
  ordersRef.current = purchaseOrders;

  const cancelPurchaseOrder = useCallback(
    async (id: string) => {
      const po = ordersRef.current.find((p) => p.id === id);
      if (!po || po.status !== "pending") return;
      const now = new Date().toISOString();
      await updateDoc(partnerDocRef(partnerId, "purchaseOrders", id), {
        status: "cancelled",
        updatedAt: now,
      });
    },
    [partnerId]
  );

  /**
   * Receives a purchase order atomically:
   *   1. Increments stock on all relevant product variants
   *   2. Creates a journal entry for the total cost
   *   3. Updates PO status → "received" with journalEntryId
   *
   * Uses runTransaction so all writes succeed or all roll back.
   * Throws on error — callers must catch and show user feedback.
   */
  const receivePurchaseOrder = useCallback(
    async (id: string) => {
      const po = ordersRef.current.find((p) => p.id === id);
      if (!po) throw new Error("Purchase order not found");
      if (po.status !== "pending")
        throw new Error("Cannot receive order — invalid status");

      const category = ACCOUNT_CATEGORIES.find(
        (c) => c.id === po.accountingCategoryId
      );
      if (!category)
        throw new Error(
          `Accounting category "${po.accountingCategoryId}" not found`
        );

      const today = new Date().toISOString().slice(0, 10);
      const now = new Date().toISOString();

      await runTransaction(db, async (transaction) => {
        // --- 1. Read all unique product docs ---
        const uniqueProductIds = [...new Set(po.items.map((i) => i.productId))];
        const productRefs = uniqueProductIds.map((pid) =>
          partnerDocRef(partnerId, "products", pid)
        );
        const productSnaps = await Promise.all(
          productRefs.map((r) => transaction.get(r))
        );

        // Build a map: productId → current variants array
        const productVariantsMap = new Map<
          string,
          Array<{ id: string; stock: number; [key: string]: unknown }>
        >();
        for (const snap of productSnaps) {
          if (!snap.exists()) {
            throw new Error(
              `Product ${snap.id} no longer exists — remove the line and try again`
            );
          }
          const data = snap.data();
          productVariantsMap.set(snap.id, data.variants ?? []);
        }

        // --- 2. Compute updated variant arrays ---
        for (const item of po.items) {
          const variants = productVariantsMap.get(item.productId);
          if (!variants) {
            throw new Error(`Product ${item.productId} missing from transaction`);
          }
          const variantIndex = variants.findIndex(
            (v) => v.id === item.variantId
          );
          if (variantIndex === -1) {
            throw new Error(
              `Variant "${item.variantTitle}" on "${item.productTitle}" not found — the product may have changed`
            );
          }
          variants[variantIndex] = {
            ...variants[variantIndex],
            stock: (variants[variantIndex].stock as number) + item.quantity,
          };
        }

        // --- 3. Write updated product docs ---
        for (const [productId, variants] of productVariantsMap) {
          transaction.update(partnerDocRef(partnerId, "products", productId), {
            variants,
            updatedAt: now,
          });
        }

        // --- 4. Create journal entry ---
        const journalData = buildJournalEntry({
          category,
          totalAmount: po.totalCostSEK,
          date: today,
          description: `Purchase order: ${po.supplierName}`,
          vatRate: category.defaultVatRate,
        });

        const journalRef = doc(partnerCol(partnerId, "journalEntries"));
        transaction.set(journalRef, {
          ...journalData,
          createdAt: now,
          updatedAt: now,
        });

        // --- 5. Update PO to received ---
        transaction.update(partnerDocRef(partnerId, "purchaseOrders", id), {
          status: "received",
          receivedAt: now,
          journalEntryId: journalRef.id,
          updatedAt: now,
        });
      });
    },
    [partnerId]
  );

  return {
    purchaseOrders,
    loading,
    error,
    addPurchaseOrder,
    cancelPurchaseOrder,
    receivePurchaseOrder,
  };
}
