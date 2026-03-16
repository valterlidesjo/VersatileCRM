import { useState, useEffect, useCallback, useRef } from "react";
import {
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
  where,
} from "firebase/firestore";
import { partnerCol, partnerDocRef } from "@/lib/firebase-partner";
import { usePartner } from "@/lib/partner";
import type { JournalEntry } from "@crm/shared";
import type { DateRange } from "@/features/accounting/utils/period-range";

export function useJournalEntries(dateRange?: DateRange) {
  const { partnerId } = usePartner();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isSubscribedRef = useRef(false);

  useEffect(() => {
    // Prevent double-subscription in StrictMode
    if (isSubscribedRef.current) {
      return;
    }

    isSubscribedRef.current = true;

    // With a date range: scope query to the period and raise the safety limit.
    // Without: fall back to the global limit(200) for dashboard/summary use.
    const q = dateRange
      ? query(
          partnerCol(partnerId, "journalEntries"),
          where("date", ">=", dateRange.start),
          where("date", "<", dateRange.afterEnd),
          orderBy("date", "desc"),
          limit(500)
        )
      : query(
          partnerCol(partnerId, "journalEntries"),
          orderBy("date", "desc"),
          limit(500)
        );
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((d) => ({
          ...d.data(),
          id: d.id,
        })) as JournalEntry[];
        setEntries(data);
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
  }, [partnerId, dateRange?.start, dateRange?.afterEnd]);

  const addEntry = useCallback(
    async (entry: Omit<JournalEntry, "id" | "createdAt" | "updatedAt">) => {
      const now = new Date().toISOString();
      await addDoc(partnerCol(partnerId, "journalEntries"), {
        ...entry,
        createdAt: now,
        updatedAt: now,
      });
    },
    [partnerId]
  );

  const updateEntry = useCallback(
    async (
      id: string,
      entry: Omit<JournalEntry, "id" | "createdAt" | "updatedAt">
    ) => {
      const now = new Date().toISOString();
      await updateDoc(partnerDocRef(partnerId, "journalEntries", id), {
        ...entry,
        updatedAt: now,
      });
    },
    [partnerId]
  );

  const deleteEntry = useCallback(async (id: string) => {
    await deleteDoc(partnerDocRef(partnerId, "journalEntries", id));
  }, [partnerId]);

  return { entries, loading, error, addEntry, updateEntry, deleteEntry };
}
