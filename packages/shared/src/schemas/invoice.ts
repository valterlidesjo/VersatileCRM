import { Schema } from "effect";
import { InvoiceStatus } from "../enums/invoice-status";

export const InvoiceItem = Schema.Struct({
  description: Schema.String,
  quantity: Schema.Number,
  unitPrice: Schema.Number,
});

export type InvoiceItem = typeof InvoiceItem.Type;

export const Invoice = Schema.Struct({
  id: Schema.String,
  customerId: Schema.String,
  dealId: Schema.optional(Schema.String),
  invoiceNumber: Schema.String,
  status: InvoiceStatus,
  items: Schema.Array(InvoiceItem),
  totalAmount: Schema.Number,
  currency: Schema.optionalWith(Schema.String, { default: () => "SEK" }),
  dueDate: Schema.String,
  paidDate: Schema.optional(Schema.String),
  isRecurring: Schema.Boolean,
  recurringInterval: Schema.optional(
    Schema.Literal("monthly", "quarterly", "yearly")
  ),
  createdAt: Schema.String,
  updatedAt: Schema.String,
});

export type Invoice = typeof Invoice.Type;
