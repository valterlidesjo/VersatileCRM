import { useState } from "react";
import type { JournalEntry } from "@crm/shared";
import { ACCOUNT_CATEGORIES } from "@crm/shared";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface JournalEntryTableProps {
  entries: JournalEntry[];
}

function getCategoryName(categoryId: string): string {
  return ACCOUNT_CATEGORIES.find((c) => c.id === categoryId)?.name ?? categoryId;
}

function formatAmount(amount: number): string {
  return amount.toLocaleString("sv-SE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function EntryRow({ entry }: { entry: JournalEntry }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <tr
        className="cursor-pointer border-b border-border hover:bg-muted/50"
        onClick={() => setExpanded(!expanded)}
      >
        <td className="px-3 py-2 text-sm">
          {expanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </td>
        <td className="px-3 py-2 text-sm">{entry.date}</td>
        <td className="px-3 py-2 text-sm">{entry.description || "—"}</td>
        <td className="px-3 py-2 text-sm">{getCategoryName(entry.category)}</td>
        <td className={cn(
          "px-3 py-2 text-sm font-medium",
          entry.transactionType === "cost" ? "text-red-600" : "text-green-600"
        )}>
          {entry.transactionType === "cost" ? "−" : "+"}{formatAmount(entry.totalAmount)} kr
        </td>
        <td className="px-3 py-2 text-sm text-muted-foreground">
          {entry.vatRate}% ({formatAmount(entry.vatAmount)} kr)
        </td>
      </tr>
      {expanded && (
        <tr className="border-b border-border bg-muted/30">
          <td colSpan={6} className="px-3 py-2">
            <table className="w-full">
              <thead>
                <tr className="text-xs text-muted-foreground">
                  <th className="px-2 py-1 text-left">Konto</th>
                  <th className="px-2 py-1 text-left">Kontonamn</th>
                  <th className="px-2 py-1 text-right">Debet</th>
                  <th className="px-2 py-1 text-right">Kredit</th>
                </tr>
              </thead>
              <tbody>
                {entry.lines.map((line, i) => (
                  <tr key={i} className="text-sm">
                    <td className="px-2 py-1 font-mono">{line.accountNumber}</td>
                    <td className="px-2 py-1">{line.accountName}</td>
                    <td className="px-2 py-1 text-right">
                      {line.debit > 0 ? formatAmount(line.debit) : ""}
                    </td>
                    <td className="px-2 py-1 text-right">
                      {line.credit > 0 ? formatAmount(line.credit) : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </td>
        </tr>
      )}
    </>
  );
}

export function JournalEntryTable({ entries }: JournalEntryTableProps) {
  if (entries.length === 0) {
    return (
      <div className="rounded-lg border border-border p-8 text-center text-muted-foreground">
        Inga verifikationer ännu. Lägg till en transaktion ovan.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full">
        <thead className="bg-muted">
          <tr className="text-sm font-medium">
            <th className="w-8 px-3 py-2" />
            <th className="px-3 py-2 text-left">Datum</th>
            <th className="px-3 py-2 text-left">Beskrivning</th>
            <th className="px-3 py-2 text-left">Kategori</th>
            <th className="px-3 py-2 text-left">Belopp</th>
            <th className="px-3 py-2 text-left">Moms</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <EntryRow key={entry.id} entry={entry} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
