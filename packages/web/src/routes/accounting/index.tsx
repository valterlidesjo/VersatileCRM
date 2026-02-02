import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageContainer } from "@/components/layout/page-container";
import { TransactionForm } from "@/features/accounting/components/transaction-form";
import { JournalEntryTable } from "@/features/accounting/components/journal-entry-table";
import { EditEntryDialog } from "@/features/accounting/components/edit-entry-dialog";
import { useJournalEntries } from "@/features/accounting/hooks/use-journal-entries";
import { formatAmount } from "@/features/accounting/utils/format";
import type { JournalEntry } from "@crm/shared";

export const Route = createFileRoute("/accounting/")({
  component: AccountingPage,
});

function AccountingPage() {
  const { entries, loading, addEntry, updateEntry, deleteEntry } =
    useJournalEntries();
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);

  const totalCosts = entries
    .filter((e) => e.transactionType === "cost")
    .reduce((sum, e) => sum + e.totalAmount, 0);

  const totalIncome = entries
    .filter((e) => e.transactionType === "income")
    .reduce((sum, e) => sum + e.totalAmount, 0);

  const totalVat = entries.reduce((sum, e) => {
    if (e.transactionType === "cost") return sum - e.vatAmount;
    return sum + e.vatAmount;
  }, 0);

  const costCount = entries.filter((e) => e.transactionType === "cost").length;
  const incomeCount = entries.filter(
    (e) => e.transactionType === "income"
  ).length;

  return (
    <PageContainer
      title="Accounting"
      description="Add costs and income — verifications are created automatically"
    >
      <div className="space-y-6">
        <TransactionForm onSubmit={addEntry} />

        {/* Summary counters */}
        {entries.length > 0 && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-lg border border-border bg-background p-4">
              <p className="text-sm text-muted-foreground">
                Verifications
              </p>
              <p className="text-2xl font-semibold">{entries.length}</p>
              <p className="text-xs text-muted-foreground">
                {costCount} costs, {incomeCount} income
              </p>
            </div>
            <div className="rounded-lg border border-border bg-background p-4">
              <p className="text-sm text-muted-foreground">Total Costs</p>
              <p className="text-2xl font-semibold text-red-600">
                {formatAmount(totalCosts)} kr
              </p>
            </div>
            <div className="rounded-lg border border-border bg-background p-4">
              <p className="text-sm text-muted-foreground">Total Income</p>
              <p className="text-2xl font-semibold text-green-600">
                {formatAmount(totalIncome)} kr
              </p>
            </div>
            <div className="rounded-lg border border-border bg-background p-4">
              <p className="text-sm text-muted-foreground">Net VAT</p>
              <p className="text-2xl font-semibold">
                {formatAmount(totalVat)} kr
              </p>
              <p className="text-xs text-muted-foreground">
                Output VAT - Input VAT
              </p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="rounded-lg border border-border p-8 text-center text-muted-foreground">
            Loading verifications...
          </div>
        ) : (
          <JournalEntryTable
            entries={entries}
            onEdit={setEditingEntry}
            onDelete={deleteEntry}
          />
        )}

        <EditEntryDialog
          open={editingEntry !== null}
          onOpenChange={(open) => {
            if (!open) setEditingEntry(null);
          }}
          entry={editingEntry}
          onSave={updateEntry}
        />
      </div>
    </PageContainer>
  );
}
