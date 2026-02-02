import type { VatRateType, BillingFrequency } from "@crm/shared";

export interface QuoteLineData {
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: VatRateType;
  billingFrequency: BillingFrequency;
}

export interface CostEntry {
  label: string;
  amount: number;
}

export interface VatBreakdownEntry {
  rate: string;
  base: number;
  amount: number;
}

export interface QuoteTotals {
  subtotal: number;
  vatAmount: number;
  total: number;
  vatBreakdown: VatBreakdownEntry[];
  mrr: number;
}

export interface ProfitabilityResult {
  totalCost: number;
  revenue: number;
  profit: number;
  perHour: number;
}

const MONTHLY_MULTIPLIER: Record<BillingFrequency, number> = {
  "one-time": 0,
  weekly: 4.33,
  monthly: 1,
  "half-year": 1 / 6,
};

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

export function calcLineMrr(
  quantity: number,
  unitPrice: number,
  billingFrequency: BillingFrequency
): number {
  return quantity * unitPrice * MONTHLY_MULTIPLIER[billingFrequency];
}

export function calcQuoteTotals(items: QuoteLineData[]): QuoteTotals {
  const vatMap = new Map<string, { base: number; amount: number }>();
  let subtotal = 0;
  let mrr = 0;

  for (const item of items) {
    const lineTotal = calcLineTotal(item.quantity, item.unitPrice);
    const lineVat = calcLineVat(item.quantity, item.unitPrice, item.vatRate);
    subtotal += lineTotal;
    mrr += calcLineMrr(item.quantity, item.unitPrice, item.billingFrequency);

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
    mrr: Math.round(mrr * 100) / 100,
  };
}

export function calcProfitability(
  subtotal: number,
  estimatedHours: number,
  costs: CostEntry[]
): ProfitabilityResult {
  const totalCost = costs.reduce((sum, c) => sum + c.amount, 0);
  const revenue = subtotal;
  const profit = revenue - totalCost;
  const perHour = estimatedHours > 0 ? profit / estimatedHours : 0;

  return {
    totalCost: Math.round(totalCost * 100) / 100,
    revenue: Math.round(revenue * 100) / 100,
    profit: Math.round(profit * 100) / 100,
    perHour: Math.round(perHour * 100) / 100,
  };
}
