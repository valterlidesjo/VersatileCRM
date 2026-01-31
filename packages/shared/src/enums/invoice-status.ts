import { Schema } from "effect";

export const InvoiceStatus = Schema.Literal(
  "draft",
  "sent",
  "paid",
  "overdue",
  "cancelled"
);

export type InvoiceStatus = typeof InvoiceStatus.Type;
