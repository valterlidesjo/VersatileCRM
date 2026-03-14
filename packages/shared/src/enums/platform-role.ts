import { Schema } from "effect";

export const PlatformRole = Schema.Literal("superAdmin");

export type PlatformRole = typeof PlatformRole.Type;

export const PLATFORM_ROLE_LABELS: Record<PlatformRole, string> = {
  superAdmin: "Super Admin",
};
