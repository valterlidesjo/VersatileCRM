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
