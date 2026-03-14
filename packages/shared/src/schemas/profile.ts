import { Schema } from "effect";

export const CompanyProfile = Schema.Struct({
  id: Schema.String,
  orgNumber: Schema.String,
  legalName: Schema.String,
  bank: Schema.String,
  bankgiro: Schema.String,
  address: Schema.optional(Schema.String),
  phone: Schema.optional(Schema.String),
  email: Schema.optional(Schema.String),
  website: Schema.optional(Schema.String),
  incomeGoal: Schema.optional(Schema.Number),
  mrrGoal: Schema.optional(Schema.Number),
  goalDeadline: Schema.optional(Schema.String),
  goalDescription: Schema.optional(Schema.String),
  fSkatt: Schema.Boolean,
  createdAt: Schema.String,
  updatedAt: Schema.String,
});

export type CompanyProfile = typeof CompanyProfile.Type;
