import { Schema } from "effect";

export const Profile = Schema.Struct({
  id: Schema.String,
  userId: Schema.String,
  orgNumber: Schema.String,
  legalName: Schema.String,
  bank: Schema.String,
  bankgiro: Schema.String,
  address: Schema.optional(Schema.String),
  phone: Schema.optional(Schema.String),
  email: Schema.optional(Schema.String),
  website: Schema.optional(Schema.String),
  goal: Schema.optional(Schema.String),
  fSkatt: Schema.Boolean,
  createdAt: Schema.String,
  updatedAt: Schema.String,
});

export type Profile = typeof Profile.Type;
