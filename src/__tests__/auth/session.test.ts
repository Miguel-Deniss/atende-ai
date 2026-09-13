import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({ cookies: vi.fn() }));
vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    session: { findUnique: vi.fn(), updateMany: vi.fn(), create: vi.fn() },
  },
}));

import { prisma } from "@/lib/db/prisma";
import { validateSession } from "@/lib/auth/session";

const findSession = vi.mocked(prisma.session.findUnique);

function validSession() {
  return {
    id: "session-1",
    sessionToken: "token-1",
    expiresAt: new Date(Date.now() + 60_000),
    isRevoked: false,
    user: {
      id: "user-1",
      email: "user@example.com",
      name: "User",
      role: "ADMIN",
      companyId: "company-1",
      isActive: true,
      deletedAt: null,
      twoFactorEnabled: false,
      emailVerified: true,
      company: {
        name: "Company",
        status: "ACTIVE",
        planType: "STARTER",
        subscriptionStatus: "ACTIVE",
        deletedAt: null,
      },
    },
  };
}

describe("validateSession", () => {
  beforeEach(() => findSession.mockReset());

  it("aceita uma sessao ativa vinculada a usuario e empresa ativos", async () => {
    findSession.mockResolvedValue(validSession() as never);
    expect((await validateSession("token-1")).valid).toBe(true);
  });

  it.each([
    ["revogada", { isRevoked: true }],
    ["expirada", { expiresAt: new Date(Date.now() - 1) }],
  ])("rejeita sessao %s", async (_label, override) => {
    findSession.mockResolvedValue({ ...validSession(), ...override } as never);
    expect((await validateSession("token-1")).valid).toBe(false);
  });

  it("rejeita usuario inativo", async () => {
    const session = validSession();
    session.user.isActive = false;
    findSession.mockResolvedValue(session as never);
    expect((await validateSession("token-1")).valid).toBe(false);
  });

  it("rejeita empresa suspensa", async () => {
    const session = validSession();
    session.user.company.status = "SUSPENDED";
    findSession.mockResolvedValue(session as never);
    expect((await validateSession("token-1")).valid).toBe(false);
  });
});
