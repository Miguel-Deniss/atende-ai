import { describe, it, expect } from "vitest";
import { signAccessToken, signRefreshToken, verifyToken, verifyRefreshToken } from "@/lib/auth/jwt";

describe("JWT", () => {
  const payload = {
    userId: "user-123",
    companyId: "company-456",
    role: "ADMIN",
    sessionToken: "session-789",
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

  it("should bind the access token to the persisted session", () => {
    const decoded = verifyToken(signAccessToken(payload));
    expect(decoded.sessionToken).toBe(payload.sessionToken);
    expect(decoded.type).toBe("access");
  });

  it("should sign and verify refresh token", () => {
    const token = signRefreshToken(payload.userId, payload.companyId, payload.sessionToken);
    expect(token).toBeDefined();

    const decoded = verifyRefreshToken(token);
    expect(decoded.userId).toBe(payload.userId);
    expect(decoded.companyId).toBe(payload.companyId);
    expect(decoded.sessionToken).toBe(payload.sessionToken);
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

  it("should reject an access token as a refresh token", () => {
    const token = signAccessToken(payload);
    expect(() => verifyRefreshToken(token)).toThrow(/refresh token/i);
  });
});
