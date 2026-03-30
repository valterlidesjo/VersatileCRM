import { useState, useEffect, useCallback } from "react";
import { addDoc, deleteDoc, onSnapshot, query, orderBy } from "firebase/firestore";
import { ACCOUNT_CATEGORIES } from "@crm/shared";
import type { AccountCategory } from "@crm/shared";
import { partnerCol, partnerDocRef } from "@/lib/firebase-partner";
import { usePartner } from "@/lib/partner";

export type CategoryWithMeta = AccountCategory & { isCustom: boolean };

export function useAccountCategories() {
  const { partnerId } = usePartner();
  const [customCategories, setCustomCategories] = useState<AccountCategory[]>([]);

  useEffect(() => {
    const q = query(partnerCol(partnerId, "accountCategories"), orderBy("name"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((d) => ({
        ...d.data(),
        id: d.id,
      })) as AccountCategory[];
      setCustomCategories(data);
    });
    return unsubscribe;
  }, [partnerId]);

  const categories: CategoryWithMeta[] = [
    ...ACCOUNT_CATEGORIES.map((c) => ({ ...c, isCustom: false })),
    ...customCategories.map((c) => ({ ...c, isCustom: true })),
  ];

  const addCategory = useCallback(
    async (cat: Omit<AccountCategory, "id">) => {
      await addDoc(partnerCol(partnerId, "accountCategories"), cat);
    },
    [partnerId]
  );

  const deleteCategory = useCallback(
    async (id: string) => {
      await deleteDoc(partnerDocRef(partnerId, "accountCategories", id));
    },
    [partnerId]
  );

  return { categories, addCategory, deleteCategory };
}
