import { describe, it, expect, vi, beforeEach } from "vitest";

const { upsert, deleteMany } = vi.hoisted(() => ({
  upsert: vi.fn(),
  deleteMany: vi.fn(),
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    rateLimit: { upsert, deleteMany },
  },
}));

vi.mock("@/lib/logger/structured", () => ({
  logger: { warn: vi.fn(), info: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { checkApiRateLimit, checkLoginRateLimit, resetLoginAttempts } from "@/lib/rate-limit";

describe("rate limit distribuído (Postgres)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.RATE_LIMIT_STORE = "database";
  });

  it("incrementa de forma atômica via upsert em bucket por janela", async () => {
    upsert.mockResolvedValue({ key: "login:user-1:1234", count: 1, resetAt: new Date() });

    const result = await checkLoginRateLimit("user-1");

    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { key: expect.stringContaining("user-1") },
        create: expect.objectContaining({ count: 1 }),
        update: { count: { increment: 1 } },
      })
    );
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it("bloqueia quando a contagem do banco excede o limite", async () => {
    upsert.mockResolvedValue({ key: "api:key:1234", count: 61, resetAt: new Date() });

    const result = await checkApiRateLimit("key");
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("usa chave de bucket por janela para distribuição entre instâncias", async () => {
    upsert.mockResolvedValue({ key: "api:key:0", count: 2, resetAt: new Date(Date.now() + 60000) });

    await checkApiRateLimit("key");

    const call = upsert.mock.calls[0][0] as { where: { key: string } };
    expect(call.where.key).toMatch(/^key:\d+$/);
  });

  it("reset apaga buckets do prefixo da chave", async () => {
    deleteMany.mockResolvedValue({ count: 1 });

    await resetLoginAttempts("user-1");

    expect(deleteMany).toHaveBeenCalledWith({
      where: { key: { startsWith: expect.stringContaining("user-1") } },
    });
  });

  it("faz fallback para memória (fail-open) quando o banco falha", async () => {
    upsert.mockRejectedValue(new Error("connection refused"));

    const result = await checkApiRateLimit("fail-open-key");
    expect(result.allowed).toBe(true);
  });
});
