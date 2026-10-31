import { describe, it, expect } from "vitest";
import { signupSchema } from "../auth";

describe("Authentication Validation (Zod)", () => {
  it("accepts a valid signup payload matching Brightloop password requirements", () => {
    const validData = {
      name: "Alice Smith",
      email: "alice@brightloop.local",
      password: "Password123!", // > 8 chars, uppercase, lowercase, special char
    };

    const result = signupSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("rejects passwords with 8 or fewer characters", () => {
    const shortData = {
      name: "Alice Smith",
      email: "alice@brightloop.local",
      password: "Pass12!", // 7 chars
    };

    const result = signupSchema.safeParse(shortData);
    expect(result.success).toBe(false);
  });

  it("rejects passwords missing an uppercase letter", () => {
    const noUpper = {
      name: "Alice Smith",
      email: "alice@brightloop.local",
      password: "password123!",
    };

    const result = signupSchema.safeParse(noUpper);
    expect(result.success).toBe(false);
  });

  it("rejects passwords missing a special character", () => {
    const noSpecial = {
      name: "Alice Smith",
      email: "alice@brightloop.local",
      password: "Password1234",
    };

    const result = signupSchema.safeParse(noSpecial);
    expect(result.success).toBe(false);
  });

  it("rejects invalid emails", () => {
    const invalidEmail = {
      name: "Alice Smith",
      email: "not-an-email",
      password: "Password123!",
    };

    const result = signupSchema.safeParse(invalidEmail);
    expect(result.success).toBe(false);
  });
});

