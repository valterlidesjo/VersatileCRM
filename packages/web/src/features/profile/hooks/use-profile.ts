import { useState, useEffect, useCallback, useRef } from "react";
import { setDoc, onSnapshot } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { partnerSingleDoc } from "@/lib/firebase-partner";
import { usePartner } from "@/lib/partner";
import { storage } from "@/lib/firebase";
import type { CompanyProfile } from "@crm/shared";

export interface CompanyProfileFormData {
  orgNumber: string;
  legalName: string;
  bank: string;
  bankgiro: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  incomeGoal: number | "";
  mrrGoal: number | "";
  goalDeadline: string;
  goalDescription: string;
  fSkatt: boolean;
}

export function useCompanyProfile() {
  const { partnerId } = usePartner();
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const isSubscribedRef = useRef(false);

  useEffect(() => {
    // Prevent double-subscription in StrictMode
    if (isSubscribedRef.current) {
      return;
    }

    isSubscribedRef.current = true;

    const profileRef = partnerSingleDoc(partnerId, "companyProfile", "main");
    const unsubscribe = onSnapshot(profileRef, (snapshot) => {
      if (!snapshot.exists()) {
        setProfile(null);
      } else {
        setProfile({ id: snapshot.id, ...snapshot.data() } as CompanyProfile);
      }
      setLoading(false);
    });

    return () => {
      unsubscribe();
      isSubscribedRef.current = false;
    };
  }, [partnerId]);

  const saveProfile = useCallback(
    async (data: CompanyProfileFormData) => {
      const now = new Date().toISOString();

      const payload = {
        orgNumber: data.orgNumber,
        legalName: data.legalName,
        bank: data.bank,
        bankgiro: data.bankgiro,
        fSkatt: data.fSkatt,
        ...(data.address && { address: data.address }),
        ...(data.phone && { phone: data.phone }),
        ...(data.email && { email: data.email }),
        ...(data.website && { website: data.website }),
        ...(data.incomeGoal !== "" && { incomeGoal: data.incomeGoal }),
        ...(data.mrrGoal !== "" && { mrrGoal: data.mrrGoal }),
        ...(data.goalDeadline && { goalDeadline: data.goalDeadline }),
        ...(data.goalDescription && {
          goalDescription: data.goalDescription,
        }),
        updatedAt: now,
        ...(!profile && { createdAt: now }),
      };

      await setDoc(
        partnerSingleDoc(partnerId, "companyProfile", "main"),
        payload,
        { merge: true }
      );
    },
    [partnerId, profile]
  );

  const uploadLogo = useCallback(
    async (file: File): Promise<string> => {
      const storageRef = ref(storage, `partners/${partnerId}/logo`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      await setDoc(
        partnerSingleDoc(partnerId, "companyProfile", "main"),
        { logoUrl: url, updatedAt: new Date().toISOString() },
        { merge: true }
      );
      return url;
    },
    [partnerId]
  );

  return { profile, loading, saveProfile, uploadLogo };
}
