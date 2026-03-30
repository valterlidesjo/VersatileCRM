import type { Quote } from "@crm/shared";
import type { InvoiceFormData } from "../hooks/use-invoices";

/**
 * Maps a Quote to InvoiceFormData, calculating invoice/due dates and applying
 * invoice defaults. Pure function — no side effects.
 *
 * invoiceNumber is intentionally left empty so addInvoice() auto-generates it.
 * invoiceRef must be provided by the caller (requires randomness).
 */
export function quoteToInvoiceFormData(
  quote: Quote,
  invoiceRef: string,
  today: Date = new Date()
): Omit<InvoiceFormData, "invoiceNumber"> & { invoiceNumber: "" } {
  const invoiceDate = today.toISOString().slice(0, 10);
  const due = new Date(today);
  due.setDate(due.getDate() + 30);
  const dueDate = due.toISOString().slice(0, 10);

  return {
    customerId: quote.customerId,
    invoiceNumber: "",
    invoiceRef,
    invoiceDate,
    items: quote.items.map((i) => ({
      description: i.description,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      vatRate: i.vatRate ?? "25",
    })),
    subtotal: quote.subtotal,
    vatAmount: quote.vatAmount,
    totalAmount: quote.totalAmount,
    currency: quote.currency ?? "SEK",
    dueDate,
    overdueInterestRate: 8,
    status: "draft",
    isRecurring: false,
    isInternational: false,
    language: quote.language ?? "sv",
    ...(quote.notes && { notes: quote.notes }),
  };
}
