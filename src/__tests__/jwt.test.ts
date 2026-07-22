import { describe, it, expect } from "vitest";
import {
  signAccessToken,
  signRefreshToken,
  verifyToken,
  verifyRefreshToken,
} from "@/lib/auth/jwt";

describe("JWT", () => {
  const payload = {
    userId: "user-123",
    companyId: "company-456",
    role: "ADMIN",
  };

  it("should sign and verify access token", () => {
    const token = signAccessToken(payload);
    expect(token).toBeDefined();
    expect(typeof token).toBe("string");

    const decoded = verifyToken(token);
    expect(decoded.userId).toBe(payload.userId);
    expect(decoded.companyId).toBe(payload.companyId);
    expect(decoded.role).toBe(payload.role);
    expect(decoded.sessionToken).toBeDefined();
  });

  it("should include unique sessionToken in each access token", () => {
    const token1 = signAccessToken(payload);
    const token2 = signAccessToken(payload);

    const decoded1 = verifyToken(token1);
    const decoded2 = verifyToken(token2);

    expect(decoded1.sessionToken).not.toBe(decoded2.sessionToken);
  });

  it("should sign and verify refresh token", () => {
    const token = signRefreshToken(payload.userId, payload.companyId);
    expect(token).toBeDefined();

    const decoded = verifyRefreshToken(token);
    expect(decoded.userId).toBe(payload.userId);
    expect(decoded.companyId).toBe(payload.companyId);
    expect(decoded.type).toBe("refresh");
  });

  it("should reject invalid access token", () => {
    expect(() => verifyToken("invalid-token")).toThrow();
  });

  it("should reject invalid refresh token", () => {
    expect(() => verifyRefreshToken("invalid-token")).toThrow();
  });

  it("should reject tampered access token", () => {
    const token = signAccessToken(payload);
    const parts = token.split(".");
    const tamperedToken = `${parts[0]}.${parts[1]}.invalidsignature`;
    expect(() => verifyToken(tamperedToken)).toThrow();
  });

  it("should decode access token with refresh function", () => {
    const token = signAccessToken(payload);
    const decoded = verifyRefreshToken(token);
    expect(decoded.userId).toBe(payload.userId);
  });
});
