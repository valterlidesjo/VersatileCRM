import { Schema } from "effect";

export const QuoteItem = Schema.Struct({
  description: Schema.String,
  quantity: Schema.Number,
  unitPrice: Schema.Number,
});

export type QuoteItem = typeof QuoteItem.Type;

export const Quote = Schema.Struct({
  id: Schema.String,
  customerId: Schema.String,
  dealId: Schema.optional(Schema.String),
  quoteNumber: Schema.String,
  items: Schema.Array(QuoteItem),
  totalAmount: Schema.Number,
  currency: Schema.optionalWith(Schema.String, { default: () => "SEK" }),
  validUntil: Schema.String,
  status: Schema.Literal("draft", "sent", "accepted", "rejected"),
  createdAt: Schema.String,
  updatedAt: Schema.String,
});

export type Quote = typeof Quote.Type;
