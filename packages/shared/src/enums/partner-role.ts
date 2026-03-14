import { Schema } from "effect";

export const PartnerRole = Schema.Literal("admin", "user");

export type PartnerRole = typeof PartnerRole.Type;

export const PARTNER_ROLE_LABELS: Record<PartnerRole, string> = {
  admin: "Administrator",
  user: "User",
};
