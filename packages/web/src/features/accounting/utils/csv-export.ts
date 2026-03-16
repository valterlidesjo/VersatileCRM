import type { JournalEntry } from "@crm/shared";
import { ACCOUNT_CATEGORIES } from "@crm/shared";

function escapeCsv(value: string | number | undefined | null): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function getCategoryName(categoryId: string): string {
  return ACCOUNT_CATEGORIES.find((c) => c.id === categoryId)?.name ?? categoryId;
}

export interface ExportEntriesOptions {
  dateFrom?: string;
  dateTo?: string;
}

export function exportEntriesToCsv(
  entries: JournalEntry[],
  options: ExportEntriesOptions = {}
): { count: number; filename: string } {
  const { dateFrom, dateTo } = options;

  let filtered = entries;
  if (dateFrom) filtered = filtered.filter((e) => e.date >= dateFrom);
  if (dateTo) filtered = filtered.filter((e) => e.date <= dateTo);

  const headers = [
    "date",
    "description",
    "transactionType",
    "category",
    "categoryName",
    "totalAmount",
    "vatRate",
    "vatAmount",
    "createdAt",
  ];

  const rows = filtered.map((e) => [
    escapeCsv(e.date),
    escapeCsv(e.description),
    escapeCsv(e.transactionType),
    escapeCsv(e.category),
    escapeCsv(getCategoryName(e.category)),
    escapeCsv(e.totalAmount),
    escapeCsv(e.vatRate),
    escapeCsv(e.vatAmount),
    escapeCsv(e.createdAt),
  ]);

  const csvContent = [
    "\uFEFF", // BOM for Excel UTF-8
    headers.join(","),
    ...rows.map((r) => r.join(",")),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const from = dateFrom ?? "all";
  const to = dateTo ?? "all";
  const filename = `journal-entries-${from}-to-${to}.csv`;
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);

  return { count: filtered.length, filename };
}

// ---------------------------------------------------------------------------
// Verifikationsjournal export
// ---------------------------------------------------------------------------

/**
 * Formats a number as a Swedish bookkeeping amount string.
 * Uses English number formatting (comma = thousands, period = decimal) + " kr".
 * Matches the format produced by Visma/Fortnox exports.
 *
 * Examples: 25000 → "25,000.00 kr"  |  3367.2 → "3,367.20 kr"
 */
function formatVerifikationAmount(amount: number): string {
  return (
    amount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + " kr"
  );
}

export interface ExportVerifikationOptions {
  dateFrom?: string;
  dateTo?: string;
  /** Verification number to assign to the first entry. Defaults to 1. */
  startVerifNumber?: number;
}

/**
 * Exports journal entries in the verifikationsjournal format used by Swedish
 * bookkeeping software (Visma, Fortnox, etc.).
 *
 * Each JournalEntry becomes multiple rows (one per accounting line).
 * The first row of each entry carries the date; continuation rows have blank Datum.
 */
export function exportToVerifikationCsv(
  entries: JournalEntry[],
  options: ExportVerifikationOptions = {}
): { count: number; filename: string } {
  const { dateFrom, dateTo, startVerifNumber = 1 } = options;

  let filtered = entries;
  if (dateFrom) filtered = filtered.filter((e) => e.date >= dateFrom);
  if (dateTo) filtered = filtered.filter((e) => e.date <= dateTo);
  filtered = [...filtered].sort((a, b) => a.date.localeCompare(b.date));

  const headers = [
    "Datum",
    "Verifikationsnummer",
    "Eventuell hänvisning",
    "Konto",
    "Officelt kontonamn",
    "Debet",
    "Kredit",
  ];

  const rows: string[] = [];
  filtered.forEach((entry, idx) => {
    const verifNum = String(startVerifNumber + idx);
    entry.lines.forEach((line, lineIdx) => {
      const datum = lineIdx === 0 ? entry.date : "";
      const debet =
        line.debit > 0 ? formatVerifikationAmount(line.debit) : "";
      const kredit =
        line.credit > 0 ? formatVerifikationAmount(line.credit) : "";
      rows.push(
        [
          datum,
          verifNum,
          lineIdx === 0 ? entry.description : "",
          line.accountNumber,
          line.accountName,
          debet,
          kredit,
        ]
          .map(escapeCsv)
          .join(",")
      );
    });
  });

  const csvContent = [
    "\uFEFF", // BOM for Excel UTF-8
    headers.map(escapeCsv).join(","),
    ...rows,
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const from = dateFrom ?? "all";
  const to = dateTo ?? "all";
  const filename = `verifikationer-${from}-to-${to}.csv`;
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);

  return { count: filtered.length, filename };
}

export function countFilteredEntries(
  entries: JournalEntry[],
  options: ExportEntriesOptions = {}
): number {
  const { dateFrom, dateTo } = options;
  let filtered = entries;
  if (dateFrom) filtered = filtered.filter((e) => e.date >= dateFrom);
  if (dateTo) filtered = filtered.filter((e) => e.date <= dateTo);
  return filtered.length;
}
