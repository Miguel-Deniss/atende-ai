import { describe, it, expect } from "vitest";
import {
  encrypt,
  decrypt,
  hashToken,
  generateToken,
} from "@/lib/security/encryption";

describe("Encryption", () => {
  it("should encrypt and decrypt text", () => {
    const original = "sensitive-data-123";
    const encrypted = encrypt(original);
    expect(encrypted).not.toBe(original);

    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(original);
  });

  it("should produce different ciphertexts for same input", () => {
    const input = "same-value";
    const result1 = encrypt(input);
    const result2 = encrypt(input);
    expect(result1).not.toBe(result2);
  });

  it("should handle special characters", () => {
    const input = "dados com acentos e símbolos: ç~!@#$%¨&*()";
    const encrypted = encrypt(input);
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(input);
  });

  it("should handle empty string", () => {
    const input = "";
    const encrypted = encrypt(input);
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(input);
  });

  it("should throw on invalid encrypted format", () => {
    expect(() => decrypt("invalid-format")).toThrow("Invalid encrypted text format");
  });

  it("should throw on tampered ciphertext", () => {
    const encrypted = encrypt("secret");
    const parts = encrypted.split(":");
    const tampered = `00000000000000000000000000000000:${parts[1]}:${parts[2]}`;
    expect(() => decrypt(tampered)).toThrow();
  });

  it("hashToken should produce SHA-256 hash", () => {
    const token = "my-session-token";
    const hash = hashToken(token);
    expect(hash).toHaveLength(64);
    expect(/^[a-f0-9]{64}$/.test(hash)).toBe(true);
    expect(hashToken(token)).toBe(hashToken(token));
  });

  it("hashToken should produce different hashes for different inputs", () => {
    const hash1 = hashToken("token-a");
    const hash2 = hashToken("token-b");
    expect(hash1).not.toBe(hash2);
  });

  it("generateToken should produce hex string of expected length", () => {
    const token = generateToken();
    expect(token).toHaveLength(64);

    const short = generateToken(16);
    expect(short).toHaveLength(32);
  });

  it("generateToken should produce unique tokens", () => {
    const token1 = generateToken();
    const token2 = generateToken();
    expect(token1).not.toBe(token2);
  });
});
