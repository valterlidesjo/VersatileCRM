import type { VatRateType } from "@crm/shared";

export interface InvoiceLineData {
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: VatRateType;
}

export interface VatBreakdownEntry {
  rate: string;
  base: number;
  amount: number;
}

export interface InvoiceTotals {
  subtotal: number;
  vatAmount: number;
  total: number;
  vatBreakdown: VatBreakdownEntry[];
}

export function calcLineTotal(quantity: number, unitPrice: number): number {
  return quantity * unitPrice;
}

export function calcLineVat(
  quantity: number,
  unitPrice: number,
  vatRate: string
): number {
  return quantity * unitPrice * (parseFloat(vatRate) / 100);
}

export function calcInvoiceTotals(items: InvoiceLineData[]): InvoiceTotals {
  const vatMap = new Map<string, { base: number; amount: number }>();
  let subtotal = 0;

  for (const item of items) {
    const lineTotal = calcLineTotal(item.quantity, item.unitPrice);
    const lineVat = calcLineVat(item.quantity, item.unitPrice, item.vatRate);
    subtotal += lineTotal;

    const existing = vatMap.get(item.vatRate) ?? { base: 0, amount: 0 };
    vatMap.set(item.vatRate, {
      base: existing.base + lineTotal,
      amount: existing.amount + lineVat,
    });
  }

  const vatBreakdown: VatBreakdownEntry[] = Array.from(vatMap.entries())
    .sort((a, b) => parseFloat(b[0]) - parseFloat(a[0]))
    .map(([rate, { base, amount }]) => ({ rate, base, amount }));

  const vatAmount = vatBreakdown.reduce((sum, e) => sum + e.amount, 0);

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    vatAmount: Math.round(vatAmount * 100) / 100,
    total: Math.round((subtotal + vatAmount) * 100) / 100,
    vatBreakdown,
  };
}

export function formatVatNumber(
  orgNumber: string,
  isInternational: boolean
): string {
  if (isInternational) {
    const digits = orgNumber.replace(/\D/g, "");
    return `SE${digits}01`;
  }
  return orgNumber;
}
