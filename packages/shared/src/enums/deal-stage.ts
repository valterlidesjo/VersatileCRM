import { Schema } from "effect";

export const DealStage = Schema.Literal(
  "prospecting",
  "qualification",
  "proposal",
  "negotiation",
  "closed_won",
  "closed_lost"
);

export type DealStage = typeof DealStage.Type;
