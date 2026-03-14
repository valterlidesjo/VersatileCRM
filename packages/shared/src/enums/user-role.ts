import { Schema } from "effect";

export const UserRole = Schema.Literal("admin", "user");

export type UserRole = typeof UserRole.Type;

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  admin: "Administrator",
  user: "User",
};
