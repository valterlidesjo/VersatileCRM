import { Schema } from "effect";
import { PartnerRole } from "../enums/partner-role";

export const Partner = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
  features: Schema.optional(Schema.Record({ key: Schema.String, value: Schema.Boolean })),
  /** Ordered list of enabled KPI IDs for the dashboard. Undefined = use frontend defaults. */
  dashboardKpis: Schema.optional(Schema.Array(Schema.String)),
  createdAt: Schema.String,
  updatedAt: Schema.String,
});

export type Partner = typeof Partner.Type;

export const PartnerMember = Schema.Struct({
  uid: Schema.optional(Schema.String),
  email: Schema.String,
  role: PartnerRole,
  addedBy: Schema.optional(Schema.String),
  createdAt: Schema.String,
  updatedAt: Schema.String,
});

export type PartnerMember = typeof PartnerMember.Type;
