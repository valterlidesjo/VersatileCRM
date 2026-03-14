import { Schema } from "effect";

export const InvoiceStatus = Schema.Literal(
  "draft",
  "created",
  "sent",
  "paid",
  "overdue",
  "cancelled"
);

export type InvoiceStatus = typeof InvoiceStatus.Type;

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  draft: "Draft",
  created: "Created",
  sent: "Sent",
  paid: "Paid",
  overdue: "Overdue",
  cancelled: "Cancelled",
};
