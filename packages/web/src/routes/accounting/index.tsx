import { useState, useCallback } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Upload, FileDown } from "lucide-react";
import { PageContainer } from "@/components/layout/page-container";
import { TransactionForm } from "@/features/accounting/components/transaction-form";
import { JournalEntryTable } from "@/features/accounting/components/journal-entry-table";
import { EditEntryDialog } from "@/features/accounting/components/edit-entry-dialog";
import { ExportEntriesDialog } from "@/features/accounting/components/export-entries-dialog";
import { ImportEntriesDialog } from "@/features/accounting/components/import-entries-dialog";
import { useJournalEntries } from "@/features/accounting/hooks/use-journal-entries";
import {
  derivePeriodRange,
  type Period,
} from "@/features/accounting/utils/period-range";
import { formatAmount } from "@/features/accounting/utils/format";
import { requireAdmin } from "@/lib/route-guards";
import type { JournalEntry } from "@crm/shared";
import type { ParsedImportEntry } from "@/features/accounting/utils/csv-import";

const PERIOD_STORAGE_KEY = "accounting-period";

const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: "this-month", label: "This month" },
  { value: "last-month", label: "Last month" },
  { value: "this-quarter", label: "This quarter" },
  { value: "last-quarter", label: "Last quarter" },
  { value: "all-time", label: "Since start" },
];

function savedPeriod(): Period {
  const saved = localStorage.getItem(PERIOD_STORAGE_KEY);
  return PERIOD_OPTIONS.some((o) => o.value === saved)
    ? (saved as Period)
    : "this-month";
}

export const Route = createFileRoute("/accounting/")({
  beforeLoad: ({ context }) => requireAdmin(context.auth),
  component: AccountingPage,
});

function AccountingPage() {
  const [period, setPeriod] = useState<Period>(savedPeriod);

  const handlePeriodChange = useCallback((next: Period) => {
    setPeriod(next);
    localStorage.setItem(PERIOD_STORAGE_KEY, next);
  }, []);

  const dateRange = derivePeriodRange(period);
  const { entries, loading, addEntry, updateEntry, deleteEntry } =
    useJournalEntries(dateRange);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [showExport, setShowExport] = useState(false);
  const [showImport, setShowImport] = useState(false);

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

  async function handleImport(
    parsedEntries: ParsedImportEntry[]
  ): Promise<{ successCount: number; errors: string[] }> {
    const errors: string[] = [];
    let successCount = 0;

    for (let i = 0; i < parsedEntries.length; i++) {
      const { ...entry } = parsedEntries[i];
      try {
        await addEntry(entry);
        successCount++;
      } catch (err) {
        errors.push(
          `Rad ${i + 1} (${entry.date} – ${entry.description}): ${
            err instanceof Error ? err.message : "Unknown error"
          }`
        );
      }
    }

    return { successCount, errors };
  }

  return (
    <PageContainer
      title="Accounting"
      description="Add costs and income — verifications are created automatically"
    >
      <div className="space-y-6">
        {/* Action bar */}
        <div className="flex items-center gap-2 justify-end">
          <select
            value={period}
            onChange={(e) => handlePeriodChange(e.target.value as Period)}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm font-medium hover:bg-muted transition-colors"
          >
            {PERIOD_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setShowImport(true)}
            className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm font-medium hover:bg-muted transition-colors"
          >
            <Upload className="h-4 w-4" />
            Import CSV
          </button>
          <button
            type="button"
            onClick={() => setShowExport(true)}
            className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm font-medium hover:bg-muted transition-colors"
          >
            <FileDown className="h-4 w-4" />
            Export CSV
          </button>
        </div>

        {entries.length === 500 && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Showing max 500 entries — narrow the period to see all.
          </div>
        )}

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
          key={editingEntry?.id}
          open={editingEntry !== null}
          onOpenChange={(open) => {
            if (!open) setEditingEntry(null);
          }}
          entry={editingEntry}
          onSave={updateEntry}
        />
      </div>

      {showExport && (
        <ExportEntriesDialog
          entries={entries}
          onClose={() => setShowExport(false)}
        />
      )}

      {showImport && (
        <ImportEntriesDialog
          onClose={() => setShowImport(false)}
          onImport={handleImport}
        />
      )}
    </PageContainer>
  );
}
