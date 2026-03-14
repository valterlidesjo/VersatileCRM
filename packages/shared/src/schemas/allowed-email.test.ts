import { describe, it, expect } from "vitest";
import { Schema } from "effect";
import { AllowedEmail } from "./allowed-email";

const validEmail = {
  id: "email_1",
  email: "test@example.com",
  role: "user" as const,
  createdAt: "2026-02-11T00:00:00.000Z",
  updatedAt: "2026-02-11T00:00:00.000Z",
};

describe("AllowedEmail schema", () => {
  it("should accept valid allowed email with user role", () => {
    const result = Schema.decodeUnknownEither(AllowedEmail)(validEmail);
    expect(result._tag).toBe("Right");
  });

  it("should accept valid allowed email with admin role", () => {
    const admin = { ...validEmail, role: "admin" as const };
    const result = Schema.decodeUnknownEither(AllowedEmail)(admin);
    expect(result._tag).toBe("Right");
  });

  it("should reject invalid role", () => {
    const invalid = { ...validEmail, role: "superuser" };
    const result = Schema.decodeUnknownEither(AllowedEmail)(invalid);
    expect(result._tag).toBe("Left");
  });

  it("should accept optional addedBy field", () => {
    const withAddedBy = { ...validEmail, addedBy: "admin@example.com" };
    const result = Schema.decodeUnknownEither(AllowedEmail)(withAddedBy);
    expect(result._tag).toBe("Right");
  });

  it("should reject missing required email field", () => {
    const { email: _, ...missing } = validEmail;
    const result = Schema.decodeUnknownEither(AllowedEmail)(missing);
    expect(result._tag).toBe("Left");
  });

  it("should reject missing required role field", () => {
    const { role: _, ...missing } = validEmail;
    const result = Schema.decodeUnknownEither(AllowedEmail)(missing);
    expect(result._tag).toBe("Left");
  });

  it("should reject missing required id field", () => {
    const { id: _, ...missing } = validEmail;
    const result = Schema.decodeUnknownEither(AllowedEmail)(missing);
    expect(result._tag).toBe("Left");
  });

  it("should reject missing required createdAt field", () => {
    const { createdAt: _, ...missing } = validEmail;
    const result = Schema.decodeUnknownEither(AllowedEmail)(missing);
    expect(result._tag).toBe("Left");
  });

  it("should reject missing required updatedAt field", () => {
    const { updatedAt: _, ...missing } = validEmail;
    const result = Schema.decodeUnknownEither(AllowedEmail)(missing);
    expect(result._tag).toBe("Left");
  });
});
