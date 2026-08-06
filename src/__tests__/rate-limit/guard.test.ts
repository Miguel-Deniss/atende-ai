import { describe, it, expect } from "vitest";
import { guardRateLimit, clientIp } from "@/lib/rate-limit/with-rate-limit";

function makeRequest(headers: Record<string, string> = {}): any {
  return { headers: new Headers(headers) };
}

describe("guardRateLimit", () => {
  it("permite dentro do limite (api)", async () => {
    for (let i = 0; i < 60; i++) {
      expect(await guardRateLimit(makeRequest(), "test:api")).toBeNull();
    }
  });

  it("bloqueia após estourar o limite de api", async () => {
    for (let i = 0; i < 60; i++) await guardRateLimit(makeRequest(), "test:api2");
    const blocked = await guardRateLimit(makeRequest(), "test:api2");
    expect(blocked).not.toBeNull();
    expect(blocked!.status).toBe(429);
  });

  it("usa limite maior para webhook", async () => {
    for (let i = 0; i < 300; i++) {
      expect(await guardRateLimit(makeRequest(), "test:webhook", "webhook")).toBeNull();
    }
    const blocked = await guardRateLimit(makeRequest(), "test:webhook", "webhook");
    expect(blocked).not.toBeNull();
  });

  it("resposta bloqueada carrega headers de rate limit", async () => {
    for (let i = 0; i < 60; i++) await guardRateLimit(makeRequest(), "test:hdrs");
    const blocked = await guardRateLimit(makeRequest(), "test:hdrs");
    expect(blocked!.headers.get("X-RateLimit-Remaining")).toBe("0");
  });
});

describe("clientIp", () => {
  it("usa x-forwarded-for", () => {
    expect(
      clientIp(makeRequest({ "x-forwarded-for": "1.2.3.4, 5.6.7.8" }))
    ).toBe("1.2.3.4");
  });

  it("usa x-real-ip quando não há forwarded", () => {
    expect(clientIp(makeRequest({ "x-real-ip": "9.9.9.9" }))).toBe("9.9.9.9");
  });

  it("cai para unknown sem headers", () => {
    expect(clientIp(makeRequest())).toBe("unknown");
  });
});
