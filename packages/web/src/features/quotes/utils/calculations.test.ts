import { describe, it, expect } from "vitest";
import {
  calcLineTotal,
  calcLineVat,
  calcLineMrr,
  calcQuoteTotals,
  calcProfitability,
  type QuoteLineData,
} from "./calculations";

describe("calcLineTotal", () => {
  it("multiplies quantity by unit price", () => {
    expect(calcLineTotal(5, 200)).toBe(1000);
  });

  it("returns 0 when quantity is 0", () => {
    expect(calcLineTotal(0, 500)).toBe(0);
  });

  it("handles decimal prices", () => {
    expect(calcLineTotal(3, 99.5)).toBeCloseTo(298.5);
  });
});

describe("calcLineVat", () => {
  it("calculates 25% VAT", () => {
    expect(calcLineVat(2, 100, "25")).toBe(50);
  });

  it("calculates 12% VAT", () => {
    expect(calcLineVat(1, 1000, "12")).toBe(120);
  });

  it("calculates 6% VAT", () => {
    expect(calcLineVat(1, 1000, "6")).toBe(60);
  });

  it("calculates 0% VAT", () => {
    expect(calcLineVat(10, 500, "0")).toBe(0);
  });
});

describe("calcLineMrr", () => {
  it("returns 0 for one-time items", () => {
    expect(calcLineMrr(1, 5000, "one-time")).toBe(0);
  });

  it("calculates monthly MRR directly", () => {
    expect(calcLineMrr(1, 500, "monthly")).toBe(500);
  });

  it("converts weekly to monthly (×4.33)", () => {
    expect(calcLineMrr(1, 100, "weekly")).toBeCloseTo(433);
  });

  it("converts half-year to monthly (÷6)", () => {
    expect(calcLineMrr(1, 6000, "half-year")).toBeCloseTo(1000);
  });

  it("accounts for quantity", () => {
    expect(calcLineMrr(3, 500, "monthly")).toBe(1500);
  });
});

describe("calcQuoteTotals", () => {
  it("calculates totals for single item", () => {
    const items: QuoteLineData[] = [
      { description: "Service", quantity: 10, unitPrice: 1000, vatRate: "25", billingFrequency: "one-time" },
    ];
    const result = calcQuoteTotals(items);
    expect(result.subtotal).toBe(10000);
    expect(result.vatAmount).toBe(2500);
    expect(result.total).toBe(12500);
    expect(result.vatBreakdown).toHaveLength(1);
    expect(result.vatBreakdown[0].rate).toBe("25");
    expect(result.mrr).toBe(0);
  });

  it("calculates totals with mixed VAT rates", () => {
    const items: QuoteLineData[] = [
      { description: "Consulting", quantity: 5, unitPrice: 2000, vatRate: "25", billingFrequency: "one-time" },
      { description: "Books", quantity: 3, unitPrice: 300, vatRate: "6", billingFrequency: "one-time" },
    ];
    const result = calcQuoteTotals(items);
    expect(result.subtotal).toBe(10900);
    expect(result.vatBreakdown).toHaveLength(2);

    const vat25 = result.vatBreakdown.find((e) => e.rate === "25");
    const vat6 = result.vatBreakdown.find((e) => e.rate === "6");
    expect(vat25?.amount).toBe(2500);
    expect(vat6?.amount).toBe(54);
    expect(result.total).toBe(13454);
  });

  it("handles empty items array", () => {
    const result = calcQuoteTotals([]);
    expect(result.subtotal).toBe(0);
    expect(result.vatAmount).toBe(0);
    expect(result.total).toBe(0);
    expect(result.vatBreakdown).toHaveLength(0);
    expect(result.mrr).toBe(0);
  });

  it("sorts VAT breakdown by rate descending", () => {
    const items: QuoteLineData[] = [
      { description: "A", quantity: 1, unitPrice: 100, vatRate: "6", billingFrequency: "one-time" },
      { description: "B", quantity: 1, unitPrice: 100, vatRate: "25", billingFrequency: "one-time" },
      { description: "C", quantity: 1, unitPrice: 100, vatRate: "12", billingFrequency: "one-time" },
    ];
    const result = calcQuoteTotals(items);
    expect(result.vatBreakdown[0].rate).toBe("25");
    expect(result.vatBreakdown[1].rate).toBe("12");
    expect(result.vatBreakdown[2].rate).toBe("6");
  });

  it("calculates MRR for recurring items", () => {
    const items: QuoteLineData[] = [
      { description: "Hosting", quantity: 1, unitPrice: 500, vatRate: "25", billingFrequency: "monthly" },
      { description: "Setup", quantity: 1, unitPrice: 5000, vatRate: "25", billingFrequency: "one-time" },
    ];
    const result = calcQuoteTotals(items);
    expect(result.subtotal).toBe(5500);
    expect(result.mrr).toBe(500);
  });

  it("calculates MRR across mixed billing frequencies", () => {
    const items: QuoteLineData[] = [
      { description: "Monthly service", quantity: 1, unitPrice: 1000, vatRate: "25", billingFrequency: "monthly" },
      { description: "Weekly report", quantity: 1, unitPrice: 100, vatRate: "25", billingFrequency: "weekly" },
      { description: "Biannual license", quantity: 1, unitPrice: 6000, vatRate: "25", billingFrequency: "half-year" },
    ];
    const result = calcQuoteTotals(items);
    // 1000 + (100 * 4.33) + (6000 / 6) = 1000 + 433 + 1000 = 2433
    expect(result.mrr).toBeCloseTo(2433, 0);
  });
});

describe("calcProfitability", () => {
  it("calculates profit and per-hour rate with costs array", () => {
    const result = calcProfitability(10000, 20, [
      { label: "Hosting", amount: 2000 },
      { label: "Driving", amount: 1000 },
    ]);
    expect(result.totalCost).toBe(3000);
    expect(result.revenue).toBe(10000);
    expect(result.profit).toBe(7000);
    expect(result.perHour).toBe(350);
  });

  it("handles zero revenue", () => {
    const result = calcProfitability(0, 10, [
      { label: "Cost", amount: 5000 },
    ]);
    expect(result.profit).toBe(-5000);
    expect(result.perHour).toBe(-500);
  });

  it("handles zero hours", () => {
    const result = calcProfitability(5000, 0, []);
    expect(result.totalCost).toBe(0);
    expect(result.profit).toBe(5000);
    expect(result.perHour).toBe(0);
  });

  it("handles empty costs array", () => {
    const result = calcProfitability(5000, 10, []);
    expect(result.totalCost).toBe(0);
    expect(result.profit).toBe(5000);
    expect(result.perHour).toBe(500);
  });

  it("shows negative profit when costs exceed revenue", () => {
    const result = calcProfitability(1000, 10, [
      { label: "Materials", amount: 3000 },
      { label: "Travel", amount: 3000 },
    ]);
    expect(result.profit).toBe(-5000);
    expect(result.perHour).toBe(-500);
  });
});
