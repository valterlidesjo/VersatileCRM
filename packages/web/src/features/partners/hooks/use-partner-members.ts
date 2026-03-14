import { useState, useEffect } from "react";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  setDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth";
import type { PartnerRole } from "@crm/shared";

export interface PartnerMemberDoc {
  id: string; // email
  email: string;
  role: PartnerRole;
  addedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export function usePartnerMembers(partnerId: string) {
  const [members, setMembers] = useState<PartnerMemberDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const auth = useAuth();

  useEffect(() => {
    if (!partnerId) return;

    const q = query(
      collection(db, "partners", partnerId, "members"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      })) as PartnerMemberDoc[];

      setMembers(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [partnerId]);

  const addMember = async (email: string, role: PartnerRole) => {
    const addedBy = auth.status === "authenticated" ? auth.email : undefined;
    const now = new Date().toISOString();

    // Write to /partners/{partnerId}/members/{email}
    await setDoc(doc(db, "partners", partnerId, "members", email), {
      email,
      role,
      addedBy,
      createdAt: now,
      updatedAt: now,
    });

    // Write to /allowedEmails/{email} for backwards-compatible auth
    await setDoc(doc(db, "allowedEmails", email), {
      email,
      role,
      partnerId,
      addedBy,
      createdAt: now,
      updatedAt: now,
    });
  };

  const removeMember = async (email: string) => {
    await deleteDoc(doc(db, "partners", partnerId, "members", email));
    await deleteDoc(doc(db, "allowedEmails", email));
  };

  const updateMemberRole = async (email: string, role: PartnerRole) => {
    const now = new Date().toISOString();

    await setDoc(
      doc(db, "partners", partnerId, "members", email),
      { role, updatedAt: now },
      { merge: true }
    );

    await setDoc(
      doc(db, "allowedEmails", email),
      { role, updatedAt: now },
      { merge: true }
    );
  };

  return { members, loading, addMember, removeMember, updateMemberRole };
}
