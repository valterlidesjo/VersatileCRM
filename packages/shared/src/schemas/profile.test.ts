import { describe, it, expect } from "vitest";
import { Schema } from "effect";
import { Profile } from "./profile";

const validProfile = {
  id: "prof_1",
  userId: "user_abc123",
  orgNumber: "556677-8899",
  legalName: "Acme Aktiebolag",
  bank: "Swedbank",
  bankgiro: "123-4567",
  fSkatt: true,
  createdAt: "2025-01-01T00:00:00.000Z",
  updatedAt: "2025-01-01T00:00:00.000Z",
};

describe("Profile schema", () => {
  it("should accept a valid profile with required fields", () => {
    const result = Schema.decodeUnknownEither(Profile)(validProfile);
    expect(result._tag).toBe("Right");
  });

  it("should accept a profile with all optional fields", () => {
    const full = {
      ...validProfile,
      website: "https://acme.se",
      goal: "Become the leading consulting firm in Sweden",
    };
    const result = Schema.decodeUnknownEither(Profile)(full);
    expect(result._tag).toBe("Right");
  });

  it("should reject a profile missing required orgNumber", () => {
    const { orgNumber: _, ...missing } = validProfile;
    const result = Schema.decodeUnknownEither(Profile)(missing);
    expect(result._tag).toBe("Left");
  });

  it("should reject a profile missing required legalName", () => {
    const { legalName: _, ...missing } = validProfile;
    const result = Schema.decodeUnknownEither(Profile)(missing);
    expect(result._tag).toBe("Left");
  });

  it("should reject a profile missing required bank", () => {
    const { bank: _, ...missing } = validProfile;
    const result = Schema.decodeUnknownEither(Profile)(missing);
    expect(result._tag).toBe("Left");
  });

  it("should reject a profile missing required bankgiro", () => {
    const { bankgiro: _, ...missing } = validProfile;
    const result = Schema.decodeUnknownEither(Profile)(missing);
    expect(result._tag).toBe("Left");
  });

  it("should reject a profile missing required userId", () => {
    const { userId: _, ...missing } = validProfile;
    const result = Schema.decodeUnknownEither(Profile)(missing);
    expect(result._tag).toBe("Left");
  });

  it("should reject a non-boolean fSkatt value", () => {
    const invalid = { ...validProfile, fSkatt: "yes" };
    const result = Schema.decodeUnknownEither(Profile)(invalid);
    expect(result._tag).toBe("Left");
  });

  it("should accept fSkatt as false", () => {
    const result = Schema.decodeUnknownEither(Profile)({
      ...validProfile,
      fSkatt: false,
    });
    expect(result._tag).toBe("Right");
  });
});
