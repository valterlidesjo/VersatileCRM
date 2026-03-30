import { describe, it, expect } from "vitest";
import { Schema } from "effect";
import {
  PurchaseOrder,
  PurchaseOrderItem,
  calculateItemCostSEK,
  calculatePOTotalSEK,
} from "./purchase-order";

// ---------------------------------------------------------------------------
// calculateItemCostSEK
// ---------------------------------------------------------------------------

describe("calculateItemCostSEK", () => {
  it("SEK order: rate=1, no markup → price passes through unchanged", () => {
    expect(calculateItemCostSEK(10, 50, 1)).toBe(500);
  });

  it("CNY → SEK conversion without markup", () => {
    // 100 units × 10 CNY × 0.145 SEK/CNY = 145 SEK
    expect(calculateItemCostSEK(100, 10, 0.145)).toBe(145);
  });

  it("EUR → SEK with 10% markup", () => {
    // 5 units × 200 EUR × 11.5 SEK/EUR × 1.10 = 12 650 SEK
    expect(calculateItemCostSEK(5, 200, 11.5, 10)).toBe(12650);
  });

  it("markupPercent = 0 → same as no markup", () => {
    expect(calculateItemCostSEK(10, 50, 1, 0)).toBe(
      calculateItemCostSEK(10, 50, 1)
    );
  });

  it("markupPercent = undefined → treated as 0", () => {
    expect(calculateItemCostSEK(10, 50, 1, undefined)).toBe(500);
  });

  it("rounds to 2 decimal places to avoid floating-point drift", () => {
    // 1 × 0.1 × 3 = 0.30000000000000004 raw → should be 0.30
    const result = calculateItemCostSEK(1, 0.1, 3);
    expect(result).toBe(0.3);
    // Verify it's not the raw float
    expect(result.toString()).not.toContain("000000000000");
  });

  it("large CNY order rounds correctly", () => {
    // 500 × 45 × 0.147 × 1.15 = 3803.625 raw
    // JS float: 3803.625 * 100 = 380362.4999... → Math.round → 380362 → 3803.62
    const result = calculateItemCostSEK(500, 45, 0.147, 15);
    expect(result).toBe(3803.62);
  });
});

// ---------------------------------------------------------------------------
// calculatePOTotalSEK
// ---------------------------------------------------------------------------

describe("calculatePOTotalSEK", () => {
  it("sums multiple items with shared markup", () => {
    const items = [
      { quantity: 10, unitPriceInCurrency: 100, rateToSEK: 1 }, // 1000 SEK
      { quantity: 5, unitPriceInCurrency: 200, rateToSEK: 1 },  // 1000 SEK
    ];
    // No markup: total = 2000
    expect(calculatePOTotalSEK(items)).toBe(2000);
    // 10% markup: total = 2200
    expect(calculatePOTotalSEK(items, 10)).toBe(2200);
  });

  it("empty items list → 0", () => {
    expect(calculatePOTotalSEK([])).toBe(0);
  });

  it("single item result matches calculateItemCostSEK", () => {
    const items = [{ quantity: 3, unitPriceInCurrency: 50, rateToSEK: 1.5 }];
    expect(calculatePOTotalSEK(items, 5)).toBe(
      calculateItemCostSEK(3, 50, 1.5, 5)
    );
  });
});

// ---------------------------------------------------------------------------
// PurchaseOrderItem schema
// ---------------------------------------------------------------------------

const validItem: PurchaseOrderItem = {
  productId: "prod_1",
  variantId: "var_1",
  productTitle: "Rund spegel",
  variantTitle: "50cm",
  quantity: 10,
  unitPriceInCurrency: 80,
  currency: "CNY",
  rateToSEK: 0.145,
  totalCostSEK: 116,
};

describe("PurchaseOrderItem schema", () => {
  it("accepts valid item", () => {
    expect(Schema.decodeUnknownEither(PurchaseOrderItem)(validItem)._tag).toBe(
      "Right"
    );
  });

  it("rejects invalid currency", () => {
    const bad = { ...validItem, currency: "GBP" };
    expect(Schema.decodeUnknownEither(PurchaseOrderItem)(bad)._tag).toBe(
      "Left"
    );
  });

  it("rejects missing productId", () => {
    const { productId: _, ...bad } = validItem;
    expect(Schema.decodeUnknownEither(PurchaseOrderItem)(bad)._tag).toBe(
      "Left"
    );
  });
});

// ---------------------------------------------------------------------------
// PurchaseOrder schema
// ---------------------------------------------------------------------------

const validPO: PurchaseOrder = {
  id: "po_1",
  supplierName: "Guangzhou Mirrors Co.",
  orderDate: "2026-03-01",
  status: "pending",
  accountingCategoryId: "goods_purchase_non_eu",
  markupPercent: 15,
  items: [validItem],
  totalCostSEK: 116,
  createdAt: "2026-03-01T10:00:00.000Z",
  updatedAt: "2026-03-01T10:00:00.000Z",
};

describe("PurchaseOrder schema", () => {
  it("accepts valid pending PO", () => {
    expect(Schema.decodeUnknownEither(PurchaseOrder)(validPO)._tag).toBe(
      "Right"
    );
  });

  it("accepts received PO with receivedAt and journalEntryId", () => {
    const received = {
      ...validPO,
      status: "received",
      receivedAt: "2026-03-15T12:00:00.000Z",
      journalEntryId: "je_abc123",
    };
    expect(Schema.decodeUnknownEither(PurchaseOrder)(received)._tag).toBe(
      "Right"
    );
  });

  it("accepts cancelled PO", () => {
    const cancelled = { ...validPO, status: "cancelled" };
    expect(Schema.decodeUnknownEither(PurchaseOrder)(cancelled)._tag).toBe(
      "Right"
    );
  });

  it("rejects invalid status", () => {
    const bad = { ...validPO, status: "shipped" };
    expect(Schema.decodeUnknownEither(PurchaseOrder)(bad)._tag).toBe("Left");
  });

  it("rejects missing supplierName", () => {
    const { supplierName: _, ...bad } = validPO;
    expect(Schema.decodeUnknownEither(PurchaseOrder)(bad)._tag).toBe("Left");
  });

  it("markupPercent is optional", () => {
    const { markupPercent: _, ...noMarkup } = validPO;
    expect(Schema.decodeUnknownEither(PurchaseOrder)(noMarkup)._tag).toBe(
      "Right"
    );
  });

  it("expectedDeliveryDate is optional", () => {
    const { expectedDeliveryDate: _, ...withoutDate } = {
      ...validPO,
      expectedDeliveryDate: undefined,
    };
    expect(Schema.decodeUnknownEither(PurchaseOrder)(withoutDate)._tag).toBe(
      "Right"
    );
  });
});
