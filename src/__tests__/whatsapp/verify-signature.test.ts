import { describe, it, expect, vi, afterEach } from "vitest";
import {
  verifyMetaSignature,
  verifyWebhookToken,
} from "@/lib/whatsapp/verify-signature";
import crypto from "crypto";

function sign(body: string, secret: string): string {
  return (
    "sha256=" + crypto.createHmac("sha256", secret).update(body).digest("hex")
  );
}

describe("verifyMetaSignature", () => {
  const body = '{"object":"whatsapp_business_account"}';

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("deve aceitar assinatura válida com META_APP_SECRET", () => {
    vi.stubEnv("META_APP_SECRET", "app-secret");
    const sig = sign(body, "app-secret");
    expect(verifyMetaSignature(body, sig)).toBe(true);
  });

  it("deve rejeitar assinatura inválida", () => {
    vi.stubEnv("META_APP_SECRET", "app-secret");
    const sig = "sha256=" + "a".repeat(64);
    expect(verifyMetaSignature(body, sig)).toBe(false);
  });

  it("deve rejeitar quando a assinatura está ausente", () => {
    vi.stubEnv("META_APP_SECRET", "app-secret");
    expect(verifyMetaSignature(body, null)).toBe(false);
  });

  it("deve rejeitar assinatura sem prefixo sha256=", () => {
    vi.stubEnv("META_APP_SECRET", "app-secret");
    const sig = crypto.createHmac("sha256", "app-secret").update(body).digest("hex");
    expect(verifyMetaSignature(body, sig)).toBe(false);
  });

  it("deve rejeitar assinatura de outro secret", () => {
    vi.stubEnv("META_APP_SECRET", "app-secret");
    const sig = sign(body, "outro-secret");
    expect(verifyMetaSignature(body, sig)).toBe(false);
  });

  it("deve aceitar sem validação quando META_APP_SECRET não está configurado", () => {
    vi.stubEnv("META_APP_SECRET", "");
    expect(verifyMetaSignature(body, null)).toBe(true);
  });
});

describe("verifyWebhookToken", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("deve aceitar token correto", () => {
    vi.stubEnv("META_WEBHOOK_VERIFY_TOKEN", "verify-123");
    expect(verifyWebhookToken("verify-123")).toBe(true);
  });

  it("deve rejeitar token incorreto", () => {
    vi.stubEnv("META_WEBHOOK_VERIFY_TOKEN", "verify-123");
    expect(verifyWebhookToken("errado")).toBe(false);
  });

  it("deve rejeitar token nulo", () => {
    vi.stubEnv("META_WEBHOOK_VERIFY_TOKEN", "verify-123");
    expect(verifyWebhookToken(null)).toBe(false);
  });

  it("deve rejeitar quando o token esperado não está configurado", () => {
    vi.stubEnv("META_WEBHOOK_VERIFY_TOKEN", "");
    expect(verifyWebhookToken("qualquer")).toBe(false);
  });
});
