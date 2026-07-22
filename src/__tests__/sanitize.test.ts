import { describe, it, expect } from "vitest";
import {
  sanitizeForAI,
  sanitizeHtml,
  sanitizeFilename,
  sanitizeObject,
} from "@/lib/security/sanitize";

describe("sanitizeForAI", () => {
  it("should redact CPF", () => {
    const result = sanitizeForAI("Meu CPF é 123.456.789-00");
    expect(result).toContain("[REDACTED]");
    expect(result).not.toContain("123.456.789-00");
  });

  it("should redact credit card numbers", () => {
    const result = sanitizeForAI("Cartão: 4111 1111 1111 1111");
    expect(result).toContain("[REDACTED]");
  });

  it("should redact email addresses", () => {
    const result = sanitizeForAI("Email: user@example.com");
    expect(result).toContain("[REDACTED]");
  });

  it("should redact CNPJ", () => {
    const result = sanitizeForAI("CNPJ 12.345.678/0001-90");
    expect(result).toContain("[REDACTED]");
  });

  it("should redact phone numbers", () => {
    const result = sanitizeForAI("Tel: 11999998888");
    expect(result).toContain("[REDACTED]");
  });

  it("should redact API keys", () => {
    const result = sanitizeForAI("sk-abcdefghijklmnopqrstuvwxyz1234");
    expect(result).toContain("[REDACTED]");
  });

  it("should redact Bearer tokens", () => {
    const result = sanitizeForAI("Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.test");
    expect(result).toContain("[REDACTED]");
  });

  it("should pass through normal text", () => {
    const result = sanitizeForAI("Olá, como posso ajudar?");
    expect(result).toBe("Olá, como posso ajudar?");
  });
});

describe("sanitizeHtml", () => {
  it("should escape HTML tags", () => {
    const result = sanitizeHtml("<script>alert('xss')</script>");
    expect(result).not.toContain("<script>");
    expect(result).toContain("&lt;script&gt;");
  });

  it("should escape double quotes", () => {
    const result = sanitizeHtml('attr="value"');
    expect(result).toContain("&quot;");
  });

  it("should escape single quotes", () => {
    const result = sanitizeHtml("value='test'");
    expect(result).toContain("&#x27;");
  });

  it("should escape ampersands", () => {
    const result = sanitizeHtml("a & b");
    expect(result).toContain("&amp;");
  });

  it("should escape forward slashes", () => {
    const result = sanitizeHtml("http://evil.com");
    expect(result).toContain("&#x2F;");
  });
});

describe("sanitizeFilename", () => {
  it("should remove dangerous characters", () => {
    const result = sanitizeFilename("../../etc/passwd");
    expect(result).not.toContain("..");
    expect(result).not.toContain("/");
  });

  it("should allow safe filenames", () => {
    const result = sanitizeFilename("foto_perfil_2024.jpg");
    expect(result).toBe("foto_perfil_2024.jpg");
  });

  it("should replace special chars with underscore", () => {
    const result = sanitizeFilename("arquivo<teste>.txt");
    expect(result).toContain("_");
    expect(result).not.toContain("<");
    expect(result).not.toContain(">");
  });

  it("should handle backslashes", () => {
    const result = sanitizeFilename("C:\\Windows\\file.txt");
    expect(result).not.toContain("\\");
    expect(result).not.toContain(":");
  });
});

describe("sanitizeObject", () => {
  it("should redact password field", () => {
    const result = sanitizeObject({ name: "John", password: "secret123" });
    expect(result.password).toBe("[REDACTED]");
    expect(result.name).toBe("John");
  });

  it("should redact multiple sensitive fields", () => {
    const result = sanitizeObject({
      name: "John",
      password: "secret",
      token: "abc123",
      apiKey: "key-456",
      creditCard: "4111-1111-1111-1111",
    });
    expect(result.password).toBe("[REDACTED]");
    expect(result.token).toBe("[REDACTED]");
    expect(result.apiKey).toBe("[REDACTED]");
    expect(result.creditCard).toBe("[REDACTED]");
  });

  it("should not modify non-sensitive fields", () => {
    const input = {
      name: "John",
      email: "john@example.com",
      age: 30,
    };
    const result = sanitizeObject(input);
    expect(result).toEqual(input);
  });

  it("should handle empty object", () => {
    const result = sanitizeObject({});
    expect(result).toEqual({});
  });

  it("should redact twoFactorSecret", () => {
    const result = sanitizeObject({ twoFactorSecret: "JBSWY3DPEHPK3PXP" });
    expect(result.twoFactorSecret).toBe("[REDACTED]");
  });

  it("should redact password_hash variations", () => {
    const result = sanitizeObject({
      passwordHash: "$2a$10$hashvalue",
      password_hash: "$2a$10$otherhash",
    });
    expect(result.passwordHash).toBe("[REDACTED]");
    expect(result.password_hash).toBe("[REDACTED]");
  });
});
