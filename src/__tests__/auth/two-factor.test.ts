import { describe, it, expect } from "vitest";
import speakeasy from "speakeasy";
import {
  generateSecret,
  verifyTotp,
  generateRecoveryCodes,
  hashRecoveryCodes,
  hashRecoveryCode,
  verifyRecoveryCode,
} from "@/lib/auth/two-factor";

describe("two-factor", () => {
  describe("verifyTotp", () => {
    it("valida código TOTP gerado com o mesmo segredo", () => {
      const secret = generateSecret("test@atendeai.com");
      expect(secret.base32).toBeTruthy();

      const generated = speakeasy.totp({
        secret: secret.base32,
        encoding: "base32",
      });

      expect(verifyTotp(secret.base32!, generated)).toBe(true);
    });

    it("rejeita código inválido", () => {
      const secret = generateSecret("test@atendeai.com");
      expect(verifyTotp(secret.base32!, "000000")).toBe(false);
    });

    it("gera otpauth_url com o nome da empresa", () => {
      const secret = generateSecret("admin@barbearia.com");
      expect(decodeURIComponent(secret.otpauth_url!)).toContain(
        "AtendeAI:admin@barbearia.com"
      );
    });
  });

  describe("recovery codes", () => {
    it("gera 10 códigos no formato XXXXXX-XXXXXX-XXXXXX", () => {
      const codes = generateRecoveryCodes(10);
      expect(codes).toHaveLength(10);
      for (const code of codes) {
        expect(code).toMatch(/^[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}$/);
      }
    });

    it("códigos gerados são únicos", () => {
      const codes = generateRecoveryCodes(50);
      expect(new Set(codes).size).toBe(codes.length);
    });

    it("hash é sha256 hex e irreversível", () => {
      const hash = hashRecoveryCode("ABC1-DEF2-3456");
      expect(hash).toMatch(/^[0-9a-f]{64}$/);
      expect(hash).not.toContain("ABC1");
    });

    it("verifica código válido e consome (uso único)", () => {
      const codes = generateRecoveryCodes(3);
      const hashed = hashRecoveryCodes(codes);

      const first = verifyRecoveryCode(codes[0], hashed);
      expect(first.valid).toBe(true);
      expect(first.remaining).toHaveLength(2);
      expect(first.remaining).not.toContain(hashed[0]);

      const replay = verifyRecoveryCode(codes[0], first.remaining);
      expect(replay.valid).toBe(false);

      const second = verifyRecoveryCode(codes[1], first.remaining);
      expect(second.valid).toBe(true);
      expect(second.remaining).toHaveLength(1);
    });

    it("código desconhecido é inválido e não consome", () => {
      const codes = generateRecoveryCodes(2);
      const hashed = hashRecoveryCodes(codes);
      const result = verifyRecoveryCode("ZZZZ-0000-0000", hashed);
      expect(result.valid).toBe(false);
      expect(result.remaining).toHaveLength(2);
    });

    it("normaliza código (maiúsculas e espaços)", () => {
      const codes = generateRecoveryCodes(1);
      const hashed = hashRecoveryCodes(codes);
      const result = verifyRecoveryCode(`  ${codes[0].toLowerCase()}  `, hashed);
      expect(result.valid).toBe(true);
    });

    it("aceita storedHashes não-array", () => {
      expect(verifyRecoveryCode("ABC1-DEF2-3456", null).valid).toBe(false);
      expect(verifyRecoveryCode("ABC1-DEF2-3456", "not-an-array").valid).toBe(false);
    });
  });
});
