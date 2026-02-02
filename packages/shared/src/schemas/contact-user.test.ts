import { describe, it, expect } from "vitest";
import { Schema } from "effect";
import { ContactUser } from "./contact-user";

const validUser = {
  id: "usr_1",
  customerId: "cust_1",
  name: "John Doe",
  location: "Stockholm, Sweden",
  phone: "+46701234567",
  email: "john@acme.se",
  createdAt: "2025-01-01T00:00:00.000Z",
  updatedAt: "2025-01-01T00:00:00.000Z",
};

describe("ContactUser schema", () => {
  it("should accept a valid contact user", () => {
    const result = Schema.decodeUnknownEither(ContactUser)(validUser);
    expect(result._tag).toBe("Right");
  });

  it("should reject a user missing customerId", () => {
    const { customerId: _, ...missing } = validUser;
    const result = Schema.decodeUnknownEither(ContactUser)(missing);
    expect(result._tag).toBe("Left");
  });

  it("should reject a user missing name", () => {
    const { name: _, ...missing } = validUser;
    const result = Schema.decodeUnknownEither(ContactUser)(missing);
    expect(result._tag).toBe("Left");
  });

  it("should reject a user missing email", () => {
    const { email: _, ...missing } = validUser;
    const result = Schema.decodeUnknownEither(ContactUser)(missing);
    expect(result._tag).toBe("Left");
  });

  it("should reject a user missing phone", () => {
    const { phone: _, ...missing } = validUser;
    const result = Schema.decodeUnknownEither(ContactUser)(missing);
    expect(result._tag).toBe("Left");
  });
});
