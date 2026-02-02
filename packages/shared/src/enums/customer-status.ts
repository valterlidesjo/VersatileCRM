import { Schema } from "effect";

export const CustomerStatus = Schema.Literal(
  "not_contacted",
  "contacted",
  "in_progress",
  "warm",
  "mrr",
  "completed",
  "lost"
);

export type CustomerStatus = typeof CustomerStatus.Type;

export const CUSTOMER_STATUS_LABELS: Record<CustomerStatus, string> = {
  not_contacted: "Not Contacted",
  contacted: "Contacted",
  in_progress: "In Progress",
  warm: "Warm",
  mrr: "MRR",
  completed: "Completed",
  lost: "Lost",
};
