import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/auth/password";

describe("Password hashing", () => {
  it("should hash a password", async () => {
    const hash = await hashPassword("Test@123");
    expect(hash).toBeDefined();
    expect(hash).not.toBe("Test@123");
    expect(hash.startsWith("$2")).toBe(true);
  });

  it("should verify correct password", async () => {
    const password = "SecureP@ss1";
    const hash = await hashPassword(password);
    const valid = await verifyPassword(password, hash);
    expect(valid).toBe(true);
  });

  it("should reject wrong password", async () => {
    const hash = await hashPassword("CorrectP@ss1");
    const valid = await verifyPassword("WrongP@ss1", hash);
    expect(valid).toBe(false);
  });
});
