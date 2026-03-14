import { useState, useEffect, useCallback, useRef } from "react";
import {
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";
import { partnerCol, partnerDocRef } from "@/lib/firebase-partner";
import { usePartner } from "@/lib/partner";
import { removeUndefined } from "@/lib/firestore";
import type { Product, ProductVariant } from "@crm/shared";

export interface ProductFormData {
  title: string;
  description?: string;
  imageUrl?: string;
  vendor?: string;
  status: "active" | "archived";
  variants: Omit<ProductVariant, "id">[];
}

export function useProducts() {
  const { partnerId } = usePartner();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const isSubscribedRef = useRef(false);

  useEffect(() => {
    if (isSubscribedRef.current) return;
    isSubscribedRef.current = true;

    const q = query(
      partnerCol(partnerId, "products"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Product[];
      setProducts(data);
      setLoading(false);
    });

    return () => {
      unsubscribe();
      isSubscribedRef.current = false;
    };
  }, [partnerId]);

  const addProduct = useCallback(
    async (data: ProductFormData) => {
      const now = new Date().toISOString();
      const variants = data.variants.map((v) => ({
        ...v,
        id: crypto.randomUUID(),
      }));
      const ref = await addDoc(partnerCol(partnerId, "products"), {
        title: data.title,
        status: data.status,
        variants,
        ...(data.description && { description: data.description }),
        ...(data.imageUrl && { imageUrl: data.imageUrl }),
        ...(data.vendor && { vendor: data.vendor }),
        createdAt: now,
        updatedAt: now,
      });
      return ref.id;
    },
    [partnerId]
  );

  const updateProduct = useCallback(
    async (id: string, data: Partial<ProductFormData>) => {
      const now = new Date().toISOString();
      await updateDoc(partnerDocRef(partnerId, "products", id), {
        ...removeUndefined(data),
        updatedAt: now,
      });
    },
    [partnerId]
  );

  const deleteProduct = useCallback(
    async (id: string) => {
      await deleteDoc(partnerDocRef(partnerId, "products", id));
    },
    [partnerId]
  );

  // Update stock for a specific variant (source of truth update)
  const updateVariantStock = useCallback(
    async (productId: string, variantId: string, newStock: number) => {
      const product = products.find((p) => p.id === productId);
      if (!product) return;
      const updatedVariants = product.variants.map((v) =>
        v.id === variantId ? { ...v, stock: newStock } : v
      );
      const now = new Date().toISOString();
      await updateDoc(partnerDocRef(partnerId, "products", productId), {
        variants: removeUndefined(updatedVariants),
        updatedAt: now,
      });
    },
    [partnerId, products]
  );

  // Decrement stock for a specific variant (used when recording a private sale)
  const decrementVariantStock = useCallback(
    async (productId: string, variantId: string, quantity: number) => {
      const product = products.find((p) => p.id === productId);
      if (!product) return;
      const variant = product.variants.find((v) => v.id === variantId);
      if (!variant) return;
      const newStock = Math.max(0, variant.stock - quantity);
      await updateVariantStock(productId, variantId, newStock);
      return newStock;
    },
    [products, updateVariantStock]
  );

  return {
    products,
    loading,
    addProduct,
    updateProduct,
    deleteProduct,
    updateVariantStock,
    decrementVariantStock,
  };
}
