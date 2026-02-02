import { useState, useEffect, useCallback } from "react";
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  onSnapshot,
  query,
  where,
  limit,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth";
import type { Profile } from "@crm/shared";

export interface ProfileFormData {
  orgNumber: string;
  legalName: string;
  bank: string;
  bankgiro: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  goal: string;
  fSkatt: boolean;
}

export function useProfile() {
  const authState = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const userId =
    authState.status === "authenticated" ? authState.user.uid : null;

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "profiles"),
      where("userId", "==", userId),
      limit(1)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        setProfile(null);
      } else {
        const d = snapshot.docs[0];
        setProfile({ id: d.id, ...d.data() } as Profile);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, [userId]);

  const saveProfile = useCallback(
    async (data: ProfileFormData) => {
      if (!userId) return;
      const now = new Date().toISOString();

      const payload = {
        userId,
        orgNumber: data.orgNumber,
        legalName: data.legalName,
        bank: data.bank,
        bankgiro: data.bankgiro,
        fSkatt: data.fSkatt,
        ...(data.address && { address: data.address }),
        ...(data.phone && { phone: data.phone }),
        ...(data.email && { email: data.email }),
        ...(data.website && { website: data.website }),
        ...(data.goal && { goal: data.goal }),
        updatedAt: now,
      };

      if (profile) {
        await updateDoc(doc(db, "profiles", profile.id), payload);
      } else {
        await addDoc(collection(db, "profiles"), {
          ...payload,
          createdAt: now,
        });
      }
    },
    [userId, profile]
  );

  return { profile, loading, saveProfile };
}
