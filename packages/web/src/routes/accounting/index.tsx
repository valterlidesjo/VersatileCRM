import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageContainer } from "@/components/layout/page-container";
import { TransactionForm } from "@/features/accounting/components/transaction-form";
import { JournalEntryTable } from "@/features/accounting/components/journal-entry-table";
import type { JournalEntry } from "@crm/shared";

export const Route = createFileRoute("/accounting/")({
  component: AccountingPage,
});

function AccountingPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);

  function handleAddEntry(
    entry: Omit<JournalEntry, "id" | "createdAt" | "updatedAt">
  ) {
    const now = new Date().toISOString();
    const fullEntry: JournalEntry = {
      ...entry,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };
    setEntries((prev) => [fullEntry, ...prev]);
  }

  return (
    <PageContainer
      title="Bokföring"
      description="Lägg till kostnader och intäkter — verifikationer skapas automatiskt"
    >
      <div className="space-y-6">
        <TransactionForm onSubmit={handleAddEntry} />
        <JournalEntryTable entries={entries} />
      </div>
    </PageContainer>
  );
}
