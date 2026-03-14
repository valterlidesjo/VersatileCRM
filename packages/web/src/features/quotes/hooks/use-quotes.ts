import { useState, useEffect, useCallback, useRef } from "react";
import {
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  getDocs,
  where,
} from "firebase/firestore";
import { partnerCol, partnerDocRef } from "@/lib/firebase-partner";
import { usePartner } from "@/lib/partner";
import type { Quote } from "@crm/shared";

export interface QuoteFormData {
  customerId: string;
  quoteNumber: string;
  items: {
    description: string;
    quantity: number;
    unitPrice: number;
    vatRate: string;
    billingFrequency: string;
  }[];
  subtotal: number;
  vatAmount: number;
  totalAmount: number;
  currency: string;
  validUntil: string;
  status: "draft" | "created" | "sent" | "accepted" | "rejected";
  notes?: string;
  estimatedHours?: number;
  costs?: { label: string; amount: number }[];
  language: "sv" | "en";
}

export async function generateQuoteNumber(partnerId: string): Promise<string> {
  const now = new Date();
  const dateStr =
    now.getFullYear().toString() +
    (now.getMonth() + 1).toString().padStart(2, "0") +
    now.getDate().toString().padStart(2, "0");
  const prefix = `Q-${dateStr}`;

  const q = query(
    partnerCol(partnerId, "quotes"),
    where("quoteNumber", ">=", prefix),
    where("quoteNumber", "<=", prefix + "\uf8ff"),
    orderBy("quoteNumber", "desc")
  );
  const snap = await getDocs(q);

  if (snap.empty) return `${prefix}-001`;

  const last = snap.docs[0].data().quoteNumber as string;
  const lastNum = parseInt(last.split("-").pop() ?? "0", 10);
  return `${prefix}-${(lastNum + 1).toString().padStart(3, "0")}`;
}

export function useQuotes() {
  const { partnerId } = usePartner();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const isSubscribedRef = useRef(false);

  useEffect(() => {
    // Prevent double-subscription in StrictMode
    if (isSubscribedRef.current) {
      return;
    }

    isSubscribedRef.current = true;

    const q = query(
      partnerCol(partnerId, "quotes"),
      orderBy("createdAt", "desc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Quote[];
      setQuotes(data);
      setLoading(false);
    });

    return () => {
      unsubscribe();
      isSubscribedRef.current = false;
    };
  }, [partnerId]);

  const addQuote = useCallback(async (data: QuoteFormData) => {
    const now = new Date().toISOString();
    const quoteNumber =
      data.quoteNumber || (await generateQuoteNumber(partnerId));

    const payload = {
      customerId: data.customerId,
      quoteNumber,
      items: data.items,
      subtotal: data.subtotal,
      vatAmount: data.vatAmount,
      totalAmount: data.totalAmount,
      currency: data.currency,
      validUntil: data.validUntil,
      status: data.status,
      language: data.language,
      ...(data.notes && { notes: data.notes }),
      ...(data.estimatedHours != null && {
        estimatedHours: data.estimatedHours,
      }),
      ...(data.costs && data.costs.length > 0 && { costs: data.costs }),
      createdAt: now,
      updatedAt: now,
    };

    const ref = await addDoc(partnerCol(partnerId, "quotes"), payload);
    return { id: ref.id, quoteNumber };
  }, [partnerId]);

  const updateQuote = useCallback(
    async (id: string, data: Partial<QuoteFormData>) => {
      const now = new Date().toISOString();
      await updateDoc(partnerDocRef(partnerId, "quotes", id), {
        ...data,
        updatedAt: now,
      });
    },
    [partnerId]
  );

  const deleteQuote = useCallback(async (id: string) => {
    await deleteDoc(partnerDocRef(partnerId, "quotes", id));
  }, [partnerId]);

  return {
    quotes,
    loading,
    addQuote,
    updateQuote,
    deleteQuote,
    generateQuoteNumber: (pid?: string) => generateQuoteNumber(pid ?? partnerId),
  };
}
