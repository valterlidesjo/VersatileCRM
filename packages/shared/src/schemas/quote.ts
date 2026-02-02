import { Schema } from "effect";
import { QuoteStatus } from "../enums/quote-status";
import { VatRate } from "../enums/vat-rate";

export const BillingFrequency = Schema.Literal("one-time", "weekly", "monthly", "half-year");

export type BillingFrequency = typeof BillingFrequency.Type;

export const QuoteItem = Schema.Struct({
  description: Schema.String,
  quantity: Schema.Number,
  unitPrice: Schema.Number,
  vatRate: Schema.optionalWith(VatRate, { default: () => "25" as const }),
  billingFrequency: Schema.optionalWith(BillingFrequency, { default: () => "one-time" as const }),
});

export type QuoteItem = typeof QuoteItem.Type;

export const QuoteCost = Schema.Struct({
  label: Schema.String,
  amount: Schema.Number,
});

export type QuoteCost = typeof QuoteCost.Type;

export const Quote = Schema.Struct({
  id: Schema.String,
  customerId: Schema.String,
  dealId: Schema.optional(Schema.String),
  quoteNumber: Schema.String,
  items: Schema.Array(QuoteItem),
  subtotal: Schema.Number,
  vatAmount: Schema.Number,
  totalAmount: Schema.Number,
  currency: Schema.optionalWith(Schema.String, { default: () => "SEK" }),
  validUntil: Schema.String,
  status: QuoteStatus,
  notes: Schema.optional(Schema.String),
  estimatedHours: Schema.optional(Schema.Number),
  costs: Schema.optional(Schema.Array(QuoteCost)),
  language: Schema.optionalWith(Schema.Literal("sv", "en"), {
    default: () => "sv" as const,
  }),
  createdAt: Schema.String,
  updatedAt: Schema.String,
});

export type Quote = typeof Quote.Type;
