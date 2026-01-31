import { Schema } from "effect";
import { CustomerStatus } from "../enums/customer-status";

export const Customer = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
  orgNumber: Schema.optional(Schema.String),
  email: Schema.optional(Schema.String),
  phone: Schema.optional(Schema.String),
  address: Schema.optional(Schema.String),
  website: Schema.optional(Schema.String),
  status: CustomerStatus,
  notes: Schema.optional(Schema.String),
  createdAt: Schema.String,
  updatedAt: Schema.String,
});

export type Customer = typeof Customer.Type;
