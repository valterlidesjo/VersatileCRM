import { useState } from "react";
import type { JournalEntry } from "@crm/shared";
import { ACCOUNT_CATEGORIES } from "@crm/shared";
import { ChevronDown, ChevronRight, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatAmount } from "../utils/format";

interface JournalEntryTableProps {
  entries: JournalEntry[];
  onEdit: (entry: JournalEntry) => void;
  onDelete: (id: string) => void;
}

function getCategoryName(categoryId: string): string {
  return ACCOUNT_CATEGORIES.find((c) => c.id === categoryId)?.name ?? categoryId;
}

function EntryRow({
  entry,
  index,
  onEdit,
  onDelete,
}: {
  entry: JournalEntry;
  index: number;
  onEdit: (entry: JournalEntry) => void;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <tr
        className="cursor-pointer border-b border-border hover:bg-muted/50"
        onClick={() => setExpanded(!expanded)}
      >
        <td className="px-3 py-2 text-sm text-muted-foreground font-mono">
          #{index}
        </td>
        <td className="px-3 py-2 text-sm">
          {expanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </td>
        <td className="px-3 py-2 text-sm">{entry.date}</td>
        <td className="px-3 py-2 text-sm">{entry.description || "\u2014"}</td>
        <td className="px-3 py-2 text-sm">{getCategoryName(entry.category)}</td>
        <td className={cn(
          "px-3 py-2 text-sm font-medium",
          entry.transactionType === "cost" ? "text-red-600" : "text-green-600"
        )}>
          {entry.transactionType === "cost" ? "\u2212" : "+"}{formatAmount(entry.totalAmount)} kr
        </td>
        <td className="px-3 py-2 text-sm text-muted-foreground">
          {entry.vatRate}% ({formatAmount(entry.vatAmount)} kr)
        </td>
        <td className="px-3 py-2 text-sm">
          <div className="flex gap-1">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onEdit(entry); }}
              className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              title="Edit"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onDelete(entry.id); }}
              className="rounded p-1 text-muted-foreground hover:bg-red-100 hover:text-red-600 transition-colors"
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </td>
      </tr>
      {expanded && (
        <tr className="border-b border-border bg-muted/30">
          <td colSpan={8} className="px-3 py-2">
            <table className="w-full">
              <thead>
                <tr className="text-xs text-muted-foreground">
                  <th className="px-2 py-1 text-left">Account</th>
                  <th className="px-2 py-1 text-left">Account Name</th>
                  <th className="px-2 py-1 text-right">Debit</th>
                  <th className="px-2 py-1 text-right">Credit</th>
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
                <tr className="text-sm font-medium border-t border-border">
                  <td colSpan={2} className="px-2 py-1">Total</td>
                  <td className="px-2 py-1 text-right">
                    {formatAmount(entry.lines.reduce((sum, l) => sum + l.debit, 0))}
                  </td>
                  <td className="px-2 py-1 text-right">
                    {formatAmount(entry.lines.reduce((sum, l) => sum + l.credit, 0))}
                  </td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
      )}
    </>
  );
}

export function JournalEntryTable({ entries, onEdit, onDelete }: JournalEntryTableProps) {
  if (entries.length === 0) {
    return (
      <div className="rounded-lg border border-border p-8 text-center text-muted-foreground">
        No verifications yet. Add a transaction above.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full">
        <thead className="bg-muted">
          <tr className="text-sm font-medium">
            <th className="w-12 px-3 py-2 text-left">#</th>
            <th className="w-8 px-3 py-2" />
            <th className="px-3 py-2 text-left">Date</th>
            <th className="px-3 py-2 text-left">Description</th>
            <th className="px-3 py-2 text-left">Category</th>
            <th className="px-3 py-2 text-left">Amount</th>
            <th className="px-3 py-2 text-left">VAT</th>
            <th className="w-20 px-3 py-2" />
          </tr>
        </thead>
        <tbody>
          {entries.map((entry, i) => (
            <EntryRow
              key={entry.id}
              entry={entry}
              index={entries.length - i}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
