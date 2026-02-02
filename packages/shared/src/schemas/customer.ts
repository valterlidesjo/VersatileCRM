import { Schema } from "effect";
import { CustomerStatus } from "../enums/customer-status";

export const Customer = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
  location: Schema.String,
  phone: Schema.String,
  email: Schema.String,
  status: CustomerStatus,
  categoryOfWork: Schema.String,
  description: Schema.optional(Schema.String),
  website: Schema.optional(Schema.String),
  orgNumber: Schema.optional(Schema.String),
  legalName: Schema.optional(Schema.String),
  createdAt: Schema.String,
  updatedAt: Schema.String,
});

export type Customer = typeof Customer.Type;
