import { Schema } from "effect";

export const Meeting = Schema.Struct({
  id: Schema.String,
  customerId: Schema.optional(Schema.String),
  dealId: Schema.optional(Schema.String),
  contactId: Schema.optional(Schema.String),
  title: Schema.String,
  description: Schema.optional(Schema.String),
  date: Schema.String,
  location: Schema.optional(Schema.String),
  createdAt: Schema.String,
  updatedAt: Schema.String,
});

export type Meeting = typeof Meeting.Type;
