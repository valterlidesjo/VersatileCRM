import { useState, useEffect, useCallback, useRef } from "react";
import {
  addDoc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  where,
  getDocs,
  limit,
} from "firebase/firestore";
import { partnerCol, partnerDocRef } from "@/lib/firebase-partner";
import { usePartner } from "@/lib/partner";
import type { Customer, ContactUser, CustomerStatusType } from "@crm/shared";
import type { CustomerFormData, UserFormData } from "../components/form-fields";

export function useCustomers() {
  const { partnerId } = usePartner();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isSubscribedRef = useRef(false);

  useEffect(() => {
    // Prevent double-subscription in StrictMode
    if (isSubscribedRef.current) {
      return;
    }

    isSubscribedRef.current = true;

    const q = query(partnerCol(partnerId, "customers"), orderBy("createdAt", "desc"), limit(200));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as Customer[];
        setCustomers(data);
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

  const addCustomer = useCallback(
    async (data: { customer: CustomerFormData; user: UserFormData }): Promise<string> => {
      const now = new Date().toISOString();
      const isPrivate = data.customer.customerType === "private";

      const customerDoc = await addDoc(partnerCol(partnerId, "customers"), {
        customerType: data.customer.customerType,
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
        ...(data.customer.mrr !== "" && { mrr: data.customer.mrr }),
        ...(isPrivate && data.customer.firstName && { firstName: data.customer.firstName }),
        ...(isPrivate && data.customer.lastName && { lastName: data.customer.lastName }),
        ...(isPrivate && data.customer.personalNumber && { personalNumber: data.customer.personalNumber }),
        createdAt: now,
        updatedAt: now,
      });

      await addDoc(partnerCol(partnerId, "contactUsers"), {
        customerId: customerDoc.id,
        name: data.user.name,
        location: data.user.location,
        phone: data.user.phone,
        email: data.user.email,
        createdAt: now,
        updatedAt: now,
      });

      return customerDoc.id;
    },
    [partnerId]
  );

  const updateCustomer = useCallback(
    async (id: string, data: CustomerFormData) => {
      const now = new Date().toISOString();
      const isPrivate = data.customerType === "private";
      await updateDoc(partnerDocRef(partnerId, "customers", id), {
        customerType: data.customerType,
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
        mrr: data.mrr !== "" ? data.mrr : null,
        firstName: isPrivate ? (data.firstName || null) : null,
        lastName: isPrivate ? (data.lastName || null) : null,
        personalNumber: isPrivate ? (data.personalNumber || null) : null,
        updatedAt: now,
      });
    },
    [partnerId]
  );

  const updateUser = useCallback(
    async (id: string, data: UserFormData) => {
      const now = new Date().toISOString();
      await updateDoc(partnerDocRef(partnerId, "contactUsers", id), {
        name: data.name,
        location: data.location,
        phone: data.phone,
        email: data.email,
        updatedAt: now,
      });
    },
    [partnerId]
  );

  const fetchContactUser = useCallback(
    async (customerId: string): Promise<ContactUser | null> => {
      const q = query(
        partnerCol(partnerId, "contactUsers"),
        where("customerId", "==", customerId),
        limit(1)
      );
      const snap = await getDocs(q);
      if (snap.empty) return null;
      const d = snap.docs[0];
      return { id: d.id, ...d.data() } as ContactUser;
    },
    [partnerId]
  );

  const updateCustomerStatus = useCallback(
    async (id: string, status: CustomerStatusType) => {
      await updateDoc(partnerDocRef(partnerId, "customers", id), {
        status,
        updatedAt: new Date().toISOString(),
      });
    },
    [partnerId]
  );

  return { customers, loading, error, addCustomer, updateCustomer, updateCustomerStatus, updateUser, fetchContactUser };
}
