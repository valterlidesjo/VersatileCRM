import { useState, useEffect, useRef } from "react";
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
import { DEFAULT_FEATURES, type FeatureKey } from "@crm/shared";

export interface PartnerDoc {
  id: string;
  name: string;
  features: Record<FeatureKey, boolean>;
  createdAt: string;
  updatedAt: string;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[åä]/g, "a")
    .replace(/ö/g, "o")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function usePartners() {
  const [partners, setPartners] = useState<PartnerDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const isSubscribedRef = useRef(false);

  useEffect(() => {
    if (isSubscribedRef.current) return;
    isSubscribedRef.current = true;

    const q = query(collection(db, "partners"), orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((docSnap) => {
        const raw = docSnap.data();
        return {
          id: docSnap.id,
          name: raw.name ?? "",
          features: { ...DEFAULT_FEATURES, ...(raw.features ?? {}) } as Record<FeatureKey, boolean>,
          createdAt: raw.createdAt ?? "",
          updatedAt: raw.updatedAt ?? "",
        } satisfies PartnerDoc;
      });

      setPartners(data);
      setLoading(false);
    });

    return () => {
      unsubscribe();
      isSubscribedRef.current = false;
    };
  }, []);

  const createPartner = async (name: string): Promise<string> => {
    const id = slugify(name);
    const now = new Date().toISOString();
    await setDoc(doc(db, "partners", id), {
      name,
      features: DEFAULT_FEATURES,
      createdAt: now,
      updatedAt: now,
    });
    return id;
  };

  const updatePartnerName = async (id: string, name: string) => {
    await setDoc(doc(db, "partners", id), { name, updatedAt: new Date().toISOString() }, { merge: true });
  };

  const updatePartnerFeatures = async (id: string, features: Record<FeatureKey, boolean>) => {
    await setDoc(doc(db, "partners", id), { features, updatedAt: new Date().toISOString() }, { merge: true });
  };

  const deletePartner = async (id: string) => {
    await deleteDoc(doc(db, "partners", id));
  };

  return { partners, loading, createPartner, updatePartnerName, updatePartnerFeatures, deletePartner };
}
