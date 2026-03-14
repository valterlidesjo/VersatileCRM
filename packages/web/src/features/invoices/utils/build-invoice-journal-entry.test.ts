import { describe, it, expect } from "vitest";
import { buildInvoiceJournalEntry } from "./build-invoice-journal-entry";
import type { Invoice } from "@crm/shared";

function makeInvoice(overrides: Partial<Invoice> = {}): Invoice {
  return {
    id: "inv-1",
    customerId: "cust-1",
    invoiceNumber: "F-20260202-001",
    invoiceRef: "Ab1x",
    invoiceDate: "2026-01-15",
    status: "sent",
    items: [
      { description: "Consulting", quantity: 10, unitPrice: 1000, vatRate: "25" },
    ],
    subtotal: 10000,
    vatAmount: 2500,
    totalAmount: 12500,
    currency: "SEK",
    dueDate: "2026-02-15",
    isRecurring: false,
    isInternational: false,
    language: "sv",
    createdAt: "2026-01-15T10:00:00Z",
    updatedAt: "2026-01-15T10:00:00Z",
    ...overrides,
  };
}

describe("buildInvoiceJournalEntry", () => {
  it("creates correct entry for single item with 25% VAT", () => {
    const invoice = makeInvoice();
    const entry = buildInvoiceJournalEntry(invoice, "2026-02-02");

    expect(entry.date).toBe("2026-02-02");
    expect(entry.description).toBe("Faktura F-20260202-001");
    expect(entry.transactionType).toBe("income");
    expect(entry.category).toBe("service_sales_25");
    expect(entry.totalAmount).toBe(12500);
    expect(entry.vatRate).toBe("25");
    expect(entry.vatAmount).toBe(2500);

    // 3 lines: bank debit, revenue credit, VAT credit
    expect(entry.lines).toHaveLength(3);

    const bankLine = entry.lines.find((l) => l.accountNumber === "1930");
    expect(bankLine?.debit).toBe(12500);
    expect(bankLine?.credit).toBe(0);

    const revenueLine = entry.lines.find((l) => l.accountNumber === "3001");
    expect(revenueLine?.debit).toBe(0);
    expect(revenueLine?.credit).toBe(10000);

    const vatLine = entry.lines.find((l) => l.accountNumber === "2610");
    expect(vatLine?.debit).toBe(0);
    expect(vatLine?.credit).toBe(2500);
  });

  it("uses paid date, not invoice date", () => {
    const invoice = makeInvoice({ invoiceDate: "2026-01-01" });
    const entry = buildInvoiceJournalEntry(invoice, "2026-02-15");

    expect(entry.date).toBe("2026-02-15");
  });

  it("uses account 3040 for international invoices", () => {
    const invoice = makeInvoice({
      isInternational: true,
      items: [
        { description: "Export service", quantity: 1, unitPrice: 5000, vatRate: "0" },
      ],
      subtotal: 5000,
      vatAmount: 0,
      totalAmount: 5000,
    });
    const entry = buildInvoiceJournalEntry(invoice, "2026-02-02");

    expect(entry.category).toBe("service_sales_0");

    const revenueLine = entry.lines.find((l) => l.accountNumber === "3040");
    expect(revenueLine).toBeDefined();
    expect(revenueLine?.credit).toBe(5000);

    // No VAT line for 0% rate
    const vatLine = entry.lines.find((l) =>
      ["2610", "2620", "2630"].includes(l.accountNumber)
    );
    expect(vatLine).toBeUndefined();
  });

  it("handles mixed VAT rates with grouped lines", () => {
    const invoice = makeInvoice({
      items: [
        { description: "Consulting", quantity: 5, unitPrice: 2000, vatRate: "25" },
        { description: "Books", quantity: 3, unitPrice: 300, vatRate: "6" },
      ],
      subtotal: 10900,
      vatAmount: 2554,
      totalAmount: 13454,
    });
    const entry = buildInvoiceJournalEntry(invoice, "2026-02-02");

    // Bank debit
    const bankLine = entry.lines.find((l) => l.accountNumber === "1930");
    expect(bankLine?.debit).toBe(13454);

    // Two revenue lines (one per VAT group)
    const revenueLines = entry.lines.filter((l) => l.accountNumber === "3001");
    expect(revenueLines).toHaveLength(2);
    const revenueTotals = revenueLines.reduce((sum, l) => sum + l.credit, 0);
    expect(revenueTotals).toBe(10900);

    // VAT 25% line
    const vat25 = entry.lines.find((l) => l.accountNumber === "2610");
    expect(vat25?.credit).toBe(2500);

    // VAT 6% line
    const vat6 = entry.lines.find((l) => l.accountNumber === "2630");
    expect(vat6?.credit).toBe(54);
  });

  it("debits equal credits (balanced entry)", () => {
    const invoice = makeInvoice({
      items: [
        { description: "A", quantity: 2, unitPrice: 500, vatRate: "25" },
        { description: "B", quantity: 1, unitPrice: 1000, vatRate: "12" },
        { description: "C", quantity: 3, unitPrice: 200, vatRate: "0" },
      ],
      subtotal: 2600,
      vatAmount: 370,
      totalAmount: 2970,
    });
    const entry = buildInvoiceJournalEntry(invoice, "2026-02-02");

    const totalDebit = entry.lines.reduce((sum, l) => sum + l.debit, 0);
    const totalCredit = entry.lines.reduce((sum, l) => sum + l.credit, 0);
    expect(totalDebit).toBeCloseTo(totalCredit, 2);
  });

  it("maps VAT rates to correct accounts", () => {
    const invoice = makeInvoice({
      items: [
        { description: "A", quantity: 1, unitPrice: 100, vatRate: "25" },
        { description: "B", quantity: 1, unitPrice: 100, vatRate: "12" },
        { description: "C", quantity: 1, unitPrice: 100, vatRate: "6" },
      ],
      subtotal: 300,
      vatAmount: 43,
      totalAmount: 343,
    });
    const entry = buildInvoiceJournalEntry(invoice, "2026-02-02");

    expect(entry.lines.find((l) => l.accountNumber === "2610")).toBeDefined();
    expect(entry.lines.find((l) => l.accountNumber === "2620")).toBeDefined();
    expect(entry.lines.find((l) => l.accountNumber === "2630")).toBeDefined();
  });
});
