import type { Invoice, JournalEntry, JournalEntryLine, VatRate } from "@crm/shared";
import { BAS_ACCOUNTS } from "@crm/shared";
import { calcLineTotal, calcLineVat } from "./calculations";

const VAT_ACCOUNT_MAP: Record<string, string> = {
  "25": "2610",
  "12": "2620",
  "6": "2630",
};

function getAccountName(accountNumber: string): string {
  const account = BAS_ACCOUNTS.find((a) => a.number === accountNumber);
  return account?.name ?? accountNumber;
}

/**
 * Build a journal entry for a paid invoice.
 * Groups items by VAT rate and creates proper double-entry lines.
 * The date is set to paidDate (when payment was received).
 */
export function buildInvoiceJournalEntry(
  invoice: Invoice,
  paidDate: string
): Omit<JournalEntry, "id" | "createdAt" | "updatedAt"> {
  const revenueAccount = invoice.isInternational ? "3040" : "3001";

  // Group items by VAT rate
  const groups = new Map<string, { netAmount: number; vatAmount: number }>();
  for (const item of invoice.items) {
    const rate = item.vatRate ?? "25";
    const existing = groups.get(rate) ?? { netAmount: 0, vatAmount: 0 };
    existing.netAmount += calcLineTotal(item.quantity, item.unitPrice);
    existing.vatAmount += calcLineVat(item.quantity, item.unitPrice, rate);
    groups.set(rate, existing);
  }

  const lines: JournalEntryLine[] = [];

  // Debit bank account for total amount
  lines.push({
    accountNumber: "1930",
    accountName: getAccountName("1930"),
    debit: Math.round(invoice.totalAmount * 100) / 100,
    credit: 0,
  });

  // Credit revenue + VAT per rate group
  for (const [rate, group] of groups) {
    const netAmount = Math.round(group.netAmount * 100) / 100;
    const vatAmount = Math.round(group.vatAmount * 100) / 100;

    // Credit revenue account
    lines.push({
      accountNumber: revenueAccount,
      accountName: getAccountName(revenueAccount),
      debit: 0,
      credit: netAmount,
    });

    // Credit VAT account (skip if 0% VAT)
    const vatAccount = VAT_ACCOUNT_MAP[rate];
    if (vatAccount && vatAmount > 0) {
      lines.push({
        accountNumber: vatAccount,
        accountName: getAccountName(vatAccount),
        debit: 0,
        credit: vatAmount,
      });
    }
  }

  // Determine dominant VAT rate for the entry-level field
  let dominantRate: VatRate = "25";
  let maxNet = 0;
  for (const [rate, group] of groups) {
    if (group.netAmount > maxNet) {
      maxNet = group.netAmount;
      dominantRate = rate as VatRate;
    }
  }

  return {
    date: paidDate,
    description: `Faktura ${invoice.invoiceNumber}`,
    transactionType: "income",
    category: invoice.isInternational ? "service_sales_0" : "service_sales_25",
    totalAmount: invoice.totalAmount,
    vatRate: dominantRate,
    vatAmount: invoice.vatAmount,
    lines,
  };
}
