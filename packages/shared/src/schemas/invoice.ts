import { Schema } from "effect";
import { InvoiceStatus } from "../enums/invoice-status";
import { VatRate } from "../enums/vat-rate";

export const InvoiceItem = Schema.Struct({
  description: Schema.String,
  quantity: Schema.Number,
  unitPrice: Schema.Number,
  vatRate: Schema.optionalWith(VatRate, { default: () => "25" as const }),
});

export type InvoiceItem = typeof InvoiceItem.Type;

export const Invoice = Schema.Struct({
  id: Schema.String,
  customerId: Schema.String,
  dealId: Schema.optional(Schema.String),
  invoiceNumber: Schema.String,
  invoiceRef: Schema.String,
  invoiceDate: Schema.String,
  status: InvoiceStatus,
  items: Schema.Array(InvoiceItem),
  subtotal: Schema.Number,
  vatAmount: Schema.Number,
  totalAmount: Schema.Number,
  currency: Schema.optionalWith(Schema.String, { default: () => "SEK" }),
  dueDate: Schema.String,
  paidDate: Schema.optional(Schema.String),
  overdueInterestRate: Schema.optionalWith(Schema.Number, {
    default: () => 8,
  }),
  isRecurring: Schema.Boolean,
  recurringInterval: Schema.optional(
    Schema.Literal("monthly", "quarterly", "yearly")
  ),
  isInternational: Schema.optionalWith(Schema.Boolean, {
    default: () => false,
  }),
  notes: Schema.optional(Schema.String),
  cancellationReason: Schema.optional(Schema.String),
  language: Schema.optionalWith(Schema.Literal("sv", "en"), {
    default: () => "sv" as const,
  }),
  createdAt: Schema.String,
  updatedAt: Schema.String,
});

export type Invoice = typeof Invoice.Type;
