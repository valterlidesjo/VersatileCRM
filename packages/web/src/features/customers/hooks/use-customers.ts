import { useState, useEffect, useCallback } from "react";
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  where,
  getDocs,
  limit,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Customer, ContactUser } from "@crm/shared";
import type { CustomerFormData, UserFormData } from "../components/form-fields";

export function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "customers"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Customer[];
      setCustomers(data);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const addCustomer = useCallback(
    async (data: { customer: CustomerFormData; user: UserFormData }) => {
      const now = new Date().toISOString();

      const customerDoc = await addDoc(collection(db, "customers"), {
        name: data.customer.name,
        location: data.customer.location,
        phone: data.customer.phone,
        email: data.customer.email,
        status: data.customer.status,
        categoryOfWork: data.customer.categoryOfWork,
        ...(data.customer.description && { description: data.customer.description }),
        ...(data.customer.website && { website: data.customer.website }),
        ...(data.customer.orgNumber && { orgNumber: data.customer.orgNumber }),
        ...(data.customer.legalName && { legalName: data.customer.legalName }),
        createdAt: now,
        updatedAt: now,
      });

      await addDoc(collection(db, "users"), {
        customerId: customerDoc.id,
        name: data.user.name,
        location: data.user.location,
        phone: data.user.phone,
        email: data.user.email,
        createdAt: now,
        updatedAt: now,
      });
    },
    []
  );

  const updateCustomer = useCallback(
    async (id: string, data: CustomerFormData) => {
      const now = new Date().toISOString();
      await updateDoc(doc(db, "customers", id), {
        name: data.name,
        location: data.location,
        phone: data.phone,
        email: data.email,
        status: data.status,
        categoryOfWork: data.categoryOfWork,
        description: data.description || null,
        website: data.website || null,
        orgNumber: data.orgNumber || null,
        legalName: data.legalName || null,
        updatedAt: now,
      });
    },
    []
  );

  const updateUser = useCallback(
    async (id: string, data: UserFormData) => {
      const now = new Date().toISOString();
      await updateDoc(doc(db, "users", id), {
        name: data.name,
        location: data.location,
        phone: data.phone,
        email: data.email,
        updatedAt: now,
      });
    },
    []
  );

  const fetchContactUser = useCallback(
    async (customerId: string): Promise<ContactUser | null> => {
      const q = query(
        collection(db, "users"),
        where("customerId", "==", customerId),
        limit(1)
      );
      const snap = await getDocs(q);
      if (snap.empty) return null;
      const d = snap.docs[0];
      return { id: d.id, ...d.data() } as ContactUser;
    },
    []
  );

  return { customers, loading, addCustomer, updateCustomer, updateUser, fetchContactUser };
}
