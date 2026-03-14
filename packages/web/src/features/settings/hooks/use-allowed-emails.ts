import { useState, useEffect, useRef } from "react";
import {
  collection,
  deleteDoc,
  doc,
  setDoc,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth";
import type { AllowedEmail, UserRole } from "@crm/shared";

export function useAllowedEmails() {
  const [emails, setEmails] = useState<AllowedEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const auth = useAuth();
  const isSubscribedRef = useRef(false);

  useEffect(() => {
    // Prevent double-subscription in StrictMode
    if (isSubscribedRef.current) {
      return;
    }

    isSubscribedRef.current = true;

    const q = query(
      collection(db, "allowedEmails"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      })) as AllowedEmail[];

      setEmails(data);
      setLoading(false);
    });

    return () => {
      unsubscribe();
      isSubscribedRef.current = false;
    };
  }, []);

  const addEmail = async (email: string, role: UserRole) => {
    const currentUserEmail = auth.status === "authenticated" ? auth.email : null;
    const partnerId = auth.status === "authenticated" ? auth.partnerId : undefined;
    const now = new Date().toISOString();

    await setDoc(doc(db, "allowedEmails", email), {
      email,
      role,
      ...(partnerId && { partnerId }),
      addedBy: currentUserEmail,
      createdAt: now,
      updatedAt: now,
    });
  };

  const removeEmail = async (id: string) => {
    await deleteDoc(doc(db, "allowedEmails", id));
  };

  const updateEmail = async (email: string, role: UserRole) => {
    const now = new Date().toISOString();

    await setDoc(doc(db, "allowedEmails", email), {
      role,
      updatedAt: now,
    }, { merge: true });
  };

  return { emails, loading, addEmail, removeEmail, updateEmail };
}
