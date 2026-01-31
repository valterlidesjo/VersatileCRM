import { Schema } from "effect";
import { DealStage } from "../enums/deal-stage";

export const Deal = Schema.Struct({
  id: Schema.String,
  customerId: Schema.String,
  title: Schema.String,
  description: Schema.optional(Schema.String),
  value: Schema.Number,
  currency: Schema.optionalWith(Schema.String, { default: () => "SEK" }),
  stage: DealStage,
  probability: Schema.optional(Schema.Number),
  expectedCloseDate: Schema.optional(Schema.String),
  createdAt: Schema.String,
  updatedAt: Schema.String,
});

export type Deal = typeof Deal.Type;
