import { redirect } from "@tanstack/react-router";
import type { UserRole } from "@crm/shared";
import type { AuthState } from "./auth";

export function requireRole(authState: AuthState, allowedRoles: UserRole[]): void {
  if (authState.status !== "authenticated") {
    throw redirect({ to: "/" });
  }

  if (!allowedRoles.includes(authState.role)) {
    throw redirect({ to: "/" });
  }
}

export function requireAdmin(authState: AuthState): void {
  requireRole(authState, ["admin"]);
}

export function requireSuperAdmin(authState: AuthState): void {
  if (authState.status !== "authenticated") {
    throw redirect({ to: "/" });
  }

  if (authState.platformRole !== "superAdmin") {
    throw redirect({ to: "/" });
  }
}
