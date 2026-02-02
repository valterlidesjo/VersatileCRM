import { Schema } from "effect";

export const QuoteStatus = Schema.Literal("draft", "created", "sent", "accepted", "rejected");

export type QuoteStatus = typeof QuoteStatus.Type;

export const QUOTE_STATUS_LABELS: Record<QuoteStatus, string> = {
  draft: "Draft",
  created: "Created",
  sent: "Sent",
  accepted: "Accepted",
  rejected: "Rejected",
};
