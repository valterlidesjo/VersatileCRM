import { useState, useEffect, useCallback } from "react";
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { JournalEntry } from "@crm/shared";

export function useJournalEntries() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, "journalEntries"),
      orderBy("date", "desc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((d) => ({
        ...d.data(),
        id: d.id,
      })) as JournalEntry[];
      setEntries(data);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const addEntry = useCallback(
    async (entry: Omit<JournalEntry, "id" | "createdAt" | "updatedAt">) => {
      const now = new Date().toISOString();
      await addDoc(collection(db, "journalEntries"), {
        ...entry,
        createdAt: now,
        updatedAt: now,
      });
    },
    []
  );

  const updateEntry = useCallback(
    async (
      id: string,
      entry: Omit<JournalEntry, "id" | "createdAt" | "updatedAt">
    ) => {
      const now = new Date().toISOString();
      await updateDoc(doc(db, "journalEntries", id), {
        ...entry,
        updatedAt: now,
      });
    },
    []
  );

  const deleteEntry = useCallback(async (id: string) => {
    await deleteDoc(doc(db, "journalEntries", id));
  }, []);

  return { entries, loading, addEntry, updateEntry, deleteEntry };
}
