import type { Invoice, Customer } from "@crm/shared";

function escapeCell(value: string | number | boolean | undefined | null): string {
  const str = value == null ? "" : String(value);
  // Wrap in quotes and escape internal quotes
  return `"${str.replace(/"/g, '""')}"`;
}

function toCsvRow(values: (string | number | boolean | undefined | null)[]): string {
  return values.map(escapeCell).join(",");
}

export function exportInvoicesToCsv(
  invoices: Invoice[],
  customers: Customer[],
  dateFrom?: string,
  dateTo?: string
): { count: number } {
  const customerName = (id: string) =>
    customers.find((c) => c.id === id)?.name ?? id;

  let filtered = invoices;
  if (dateFrom) {
    filtered = filtered.filter((inv) => inv.invoiceDate >= dateFrom);
  }
  if (dateTo) {
    filtered = filtered.filter((inv) => inv.invoiceDate <= dateTo);
  }

  // Sort by invoiceDate ascending
  filtered = [...filtered].sort((a, b) =>
    a.invoiceDate.localeCompare(b.invoiceDate)
  );

  const headers = [
    "invoiceNumber",
    "invoiceRef",
    "customerName",
    "invoiceDate",
    "dueDate",
    "paidDate",
    "status",
    "subtotal",
    "vatAmount",
    "totalAmount",
    "currency",
    "overdueInterestRate",
    "isInternational",
    "language",
    "notes",
    "createdAt",
  ];

  const rows = filtered.map((inv) =>
    toCsvRow([
      inv.invoiceNumber,
      inv.invoiceRef,
      customerName(inv.customerId),
      inv.invoiceDate,
      inv.dueDate,
      inv.paidDate ?? "",
      inv.status,
      inv.subtotal.toFixed(2),
      inv.vatAmount.toFixed(2),
      inv.totalAmount.toFixed(2),
      inv.currency,
      inv.overdueInterestRate ?? 8,
      inv.isInternational ? "true" : "false",
      inv.language ?? "sv",
      inv.notes ?? "",
      inv.createdAt.slice(0, 10),
    ])
  );

  // BOM for Excel UTF-8 compatibility
  const csvContent = "\uFEFF" + [toCsvRow(headers), ...rows].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;

  const fromPart = dateFrom ?? "start";
  const toPart = dateTo ?? new Date().toISOString().slice(0, 10);
  link.download = `invoices-${fromPart}-to-${toPart}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return { count: filtered.length };
}

export function countFilteredInvoices(
  invoices: Invoice[],
  dateFrom?: string,
  dateTo?: string
): number {
  let filtered = invoices;
  if (dateFrom) filtered = filtered.filter((inv) => inv.invoiceDate >= dateFrom);
  if (dateTo) filtered = filtered.filter((inv) => inv.invoiceDate <= dateTo);
  return filtered.length;
}
