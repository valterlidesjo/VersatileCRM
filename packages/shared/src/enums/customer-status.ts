import { Schema } from "effect";

export const CustomerStatus = Schema.Literal(
  "lead",
  "prospect",
  "active",
  "churned",
  "inactive"
);

export type CustomerStatus = typeof CustomerStatus.Type;
