import { Schema } from "effect";

export const Contact = Schema.Struct({
  id: Schema.String,
  customerId: Schema.String,
  firstName: Schema.String,
  lastName: Schema.String,
  email: Schema.optional(Schema.String),
  phone: Schema.optional(Schema.String),
  role: Schema.optional(Schema.String),
  isPrimary: Schema.Boolean,
  createdAt: Schema.String,
  updatedAt: Schema.String,
});

export type Contact = typeof Contact.Type;
