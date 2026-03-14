import { describe, it, expect } from "vitest";
import { requireAdmin, requireRole } from "./route-guards";
import type { AuthState } from "./auth";
import type { User } from "firebase/auth";

describe("Route Guards", () => {
  const mockUser = { email: "test@test.com" } as User;

  describe("requireAdmin", () => {
    it("should allow admin users", () => {
      const authState: AuthState = {
        status: "authenticated",
        user: mockUser,
        role: "admin",
        email: "admin@test.com",
        partnerId: "valter",
        platformRole: null,
      };

      expect(() => requireAdmin(authState)).not.toThrow();
    });

    it("should redirect non-admin users", () => {
      const authState: AuthState = {
        status: "authenticated",
        user: mockUser,
        role: "user",
        email: "user@test.com",
        partnerId: "valter",
        platformRole: null,
      };

      expect(() => requireAdmin(authState)).toThrow();
    });

    it("should redirect unauthenticated users", () => {
      const authState: AuthState = { status: "unauthenticated" };

      expect(() => requireAdmin(authState)).toThrow();
    });

    it("should redirect denied users", () => {
      const authState: AuthState = { status: "denied", email: "denied@test.com" };

      expect(() => requireAdmin(authState)).toThrow();
    });

    it("should redirect loading state", () => {
      const authState: AuthState = { status: "loading" };

      expect(() => requireAdmin(authState)).toThrow();
    });
  });

  describe("requireRole", () => {
    it("should allow users with matching role", () => {
      const authState: AuthState = {
        status: "authenticated",
        user: mockUser,
        role: "user",
        email: "user@test.com",
        partnerId: "valter",
        platformRole: null,
      };

      expect(() => requireRole(authState, ["user", "admin"])).not.toThrow();
    });

    it("should allow admins when admin role is required", () => {
      const authState: AuthState = {
        status: "authenticated",
        user: mockUser,
        role: "admin",
        email: "admin@test.com",
        partnerId: "valter",
        platformRole: null,
      };

      expect(() => requireRole(authState, ["admin"])).not.toThrow();
    });

    it("should redirect users without matching role", () => {
      const authState: AuthState = {
        status: "authenticated",
        user: mockUser,
        role: "user",
        email: "user@test.com",
        partnerId: "valter",
        platformRole: null,
      };

      expect(() => requireRole(authState, ["admin"])).toThrow();
    });

    it("should redirect unauthenticated users", () => {
      const authState: AuthState = { status: "unauthenticated" };

      expect(() => requireRole(authState, ["user"])).toThrow();
    });
  });
});
