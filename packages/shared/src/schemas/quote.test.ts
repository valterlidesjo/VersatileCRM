import { describe, it, expect } from "vitest";
import { Schema } from "effect";
import { Quote, QuoteItem } from "./quote";

const validQuoteItem = {
  description: "Web Development",
  quantity: 10,
  unitPrice: 1500,
};

const validQuote = {
  id: "q_1",
  customerId: "cust_1",
  quoteNumber: "Q-20260201-001",
  items: [validQuoteItem],
  subtotal: 15000,
  vatAmount: 3750,
  totalAmount: 18750,
  validUntil: "2026-03-01",
  status: "draft" as const,
  createdAt: "2026-02-01T00:00:00.000Z",
  updatedAt: "2026-02-01T00:00:00.000Z",
};

describe("QuoteItem schema", () => {
  it("should accept a valid item with default vatRate", () => {
    const result = Schema.decodeUnknownEither(QuoteItem)(validQuoteItem);
    expect(result._tag).toBe("Right");
    if (result._tag === "Right") {
      expect(result.right.vatRate).toBe("25");
    }
  });

  it("should accept a valid item with explicit vatRate", () => {
    const result = Schema.decodeUnknownEither(QuoteItem)({
      ...validQuoteItem,
      vatRate: "12",
    });
    expect(result._tag).toBe("Right");
    if (result._tag === "Right") {
      expect(result.right.vatRate).toBe("12");
    }
  });

  it("should reject an invalid vatRate", () => {
    const result = Schema.decodeUnknownEither(QuoteItem)({
      ...validQuoteItem,
      vatRate: "15",
    });
    expect(result._tag).toBe("Left");
  });

  it("should reject a missing description", () => {
    const { description: _, ...missing } = validQuoteItem;
    const result = Schema.decodeUnknownEither(QuoteItem)(missing);
    expect(result._tag).toBe("Left");
  });
});

describe("Quote schema", () => {
  it("should accept a valid quote with required fields", () => {
    const result = Schema.decodeUnknownEither(Quote)(validQuote);
    expect(result._tag).toBe("Right");
  });

  it("should default currency to SEK", () => {
    const result = Schema.decodeUnknownEither(Quote)(validQuote);
    expect(result._tag).toBe("Right");
    if (result._tag === "Right") {
      expect(result.right.currency).toBe("SEK");
    }
  });

  it("should default language to sv", () => {
    const result = Schema.decodeUnknownEither(Quote)(validQuote);
    expect(result._tag).toBe("Right");
    if (result._tag === "Right") {
      expect(result.right.language).toBe("sv");
    }
  });

  it("should accept all optional fields", () => {
    const full = {
      ...validQuote,
      dealId: "deal_1",
      notes: "Special pricing",
      estimatedHours: 20,
      hourlyCostRate: 500,
      materialCosts: 2000,
      language: "en",
    };
    const result = Schema.decodeUnknownEither(Quote)(full);
    expect(result._tag).toBe("Right");
  });

  it("should accept all valid status values", () => {
    const statuses = ["draft", "sent", "accepted", "rejected"] as const;
    for (const status of statuses) {
      const result = Schema.decodeUnknownEither(Quote)({
        ...validQuote,
        status,
      });
      expect(result._tag).toBe("Right");
    }
  });

  it("should reject an invalid status", () => {
    const result = Schema.decodeUnknownEither(Quote)({
      ...validQuote,
      status: "expired",
    });
    expect(result._tag).toBe("Left");
  });

  it("should reject missing customerId", () => {
    const { customerId: _, ...missing } = validQuote;
    const result = Schema.decodeUnknownEither(Quote)(missing);
    expect(result._tag).toBe("Left");
  });

  it("should reject missing items", () => {
    const { items: _, ...missing } = validQuote;
    const result = Schema.decodeUnknownEither(Quote)(missing);
    expect(result._tag).toBe("Left");
  });
});
