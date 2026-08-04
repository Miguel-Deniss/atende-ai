import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  getResendClient,
  hasResendConfigured,
  getEmailFrom,
  getAppUrl,
} from "@/lib/email/client";

vi.mock("resend", () => {
  return {
    Resend: vi.fn().mockImplementation(function (this: any, apiKey: string) {
      this.apiKey = apiKey;
      this.emails = { send: vi.fn() };
    }),
  };
});

describe("email client", () => {
  const originalKey = process.env.RESEND_API_KEY;
  const originalFrom = process.env.EMAIL_FROM;
  const originalUrl = process.env.APP_URL;

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    process.env.RESEND_API_KEY = originalKey;
    process.env.EMAIL_FROM = originalFrom;
    process.env.APP_URL = originalUrl;
  });

  it("lança erro claro quando RESEND_API_KEY está ausente", async () => {
    delete process.env.RESEND_API_KEY;

    const { getResendClient: getClient } = await import("@/lib/email/client");

    expect(() => getClient()).toThrow(/RESEND_API_KEY/);
  });

  it("cria uma instância quando a API key existe", async () => {
    process.env.RESEND_API_KEY = "re_test_123";

    const { getResendClient: getClient } = await import("@/lib/email/client");

    const client = getClient();
    expect(client).toBeDefined();
    expect(client.apiKey).toBe("re_test_123");
  });

  it("reutiliza a mesma instância (singleton)", async () => {
    process.env.RESEND_API_KEY = "re_test_123";

    const { getResendClient: getClient } = await import("@/lib/email/client");

    const a = getClient();
    const b = getClient();
    expect(a).toBe(b);
  });

  it("hasResendConfigured reflete a presença da chave", async () => {
    delete process.env.RESEND_API_KEY;
    vi.resetModules();
    const { hasResendConfigured: hasKey } = await import("@/lib/email/client");
    expect(hasKey()).toBe(false);

    process.env.RESEND_API_KEY = "re_test_123";
    vi.resetModules();
    const { hasResendConfigured: hasKey2 } = await import("@/lib/email/client");
    expect(hasKey2()).toBe(true);
  });

  it("usa EMAIL_FROM configurado ou fallback", async () => {
    const { getEmailFrom: getFrom } = await import("@/lib/email/client");

    process.env.EMAIL_FROM = "AtendeAI <contato@atendeai.com>";
    expect(getFrom()).toBe("AtendeAI <contato@atendeai.com>");

    delete process.env.EMAIL_FROM;
    expect(getFrom()).toContain("nao-responda@atendeai.com");
  });

  it("usa APP_URL configurado ou fallback", async () => {
    const { getAppUrl: getUrl } = await import("@/lib/email/client");

    process.env.APP_URL = "https://app.atendeai.com";
    expect(getUrl()).toBe("https://app.atendeai.com");

    delete process.env.APP_URL;
    expect(getUrl()).toBe("http://localhost:3000");
  });
});
