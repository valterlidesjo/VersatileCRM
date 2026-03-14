import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "./firebase";
import { useAuth } from "./auth";
import { DEFAULT_FEATURES, type FeatureKey, type PlatformRole, type UserRole } from "@crm/shared";

export interface PartnerContextValue {
  partnerId: string;
  role: UserRole;
  platformRole: PlatformRole | null;
  features: Record<FeatureKey, boolean>;
  isFeatureEnabled: (key: FeatureKey) => boolean;
}

const PartnerContext = createContext<PartnerContextValue | null>(null);

export function PartnerProvider({ children }: { children: ReactNode }) {
  const authState = useAuth();
  const [features, setFeatures] = useState<Record<FeatureKey, boolean>>(DEFAULT_FEATURES);

  const partnerId = authState.status === "authenticated" ? authState.partnerId : null;

  useEffect(() => {
    if (!partnerId) return;

    const docRef = doc(db, "partners", partnerId);
    const unsubscribe = onSnapshot(
      docRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (data.features) {
            setFeatures({ ...DEFAULT_FEATURES, ...(data.features as Record<FeatureKey, boolean>) });
          }
        }
      },
      (err) => {
        console.error("Failed to load partner features:", err.message);
      }
    );

    return () => unsubscribe();
  }, [partnerId]);

  const value: PartnerContextValue = {
    partnerId: authState.status === "authenticated" ? authState.partnerId : "",
    role: authState.status === "authenticated" ? authState.role : "user",
    platformRole: authState.status === "authenticated" ? authState.platformRole : null,
    features,
    isFeatureEnabled: (key) => features[key] ?? true,
  };

  return (
    <PartnerContext.Provider value={value}>{children}</PartnerContext.Provider>
  );
}

export function usePartner(): PartnerContextValue {
  const ctx = useContext(PartnerContext);
  if (!ctx) {
    throw new Error("usePartner must be used inside PartnerProvider");
  }
  return ctx;
}
