import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    company: { findUnique: vi.fn() },
    subscription: { findUnique: vi.fn() },
  },
}));

vi.mock("@/lib/logger", () => ({
  createLog: vi.fn(async () => {}),
}));

import { prisma } from "@/lib/db/prisma";
import { enforceBilling } from "@/lib/billing/subscription";

function mockCompany(overrides: Record<string, unknown> = {}) {
  vi.mocked(prisma.company.findUnique).mockResolvedValue({
    planType: "FREE",
    subscriptionStatus: "TRIALING",
    trialEndsAt: null,
    ...overrides,
  } as never);
}

function mockNoSubscription() {
  vi.mocked(prisma.subscription.findUnique).mockResolvedValue(null as never);
}

describe("enforceBilling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("permite quando assinatura está ACTIVE", async () => {
    mockNoSubscription();
    mockCompany({ subscriptionStatus: "ACTIVE" });
    const result = await enforceBilling("company-1");
    expect(result.allowed).toBe(true);
  });

  it("permite quando subscription ACTIVE tem precedência sobre company", async () => {
    mockCompany({ subscriptionStatus: "PAST_DUE" });
    vi.mocked(prisma.subscription.findUnique).mockResolvedValue({
      status: "ACTIVE",
      plan: { code: "PRO", name: "Pro", price: 11900 },
    } as never);
    const result = await enforceBilling("company-1");
    expect(result.allowed).toBe(true);
  });

  it("permite trial dentro do prazo", async () => {
    mockNoSubscription();
    mockCompany({
      subscriptionStatus: "TRIALING",
      trialEndsAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
    });
    const result = await enforceBilling("company-1");
    expect(result.allowed).toBe(true);
  });

  it("bloqueia trial expirado", async () => {
    mockNoSubscription();
    mockCompany({
      subscriptionStatus: "TRIALING",
      trialEndsAt: new Date(Date.now() - 1000),
    });
    const result = await enforceBilling("company-1");
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("teste");
  });

  it("bloqueia PAST_DUE", async () => {
    mockNoSubscription();
    mockCompany({ subscriptionStatus: "PAST_DUE" });
    const result = await enforceBilling("company-1");
    expect(result.allowed).toBe(false);
  });

  it("bloqueia CANCELED", async () => {
    mockNoSubscription();
    mockCompany({ subscriptionStatus: "CANCELED" });
    const result = await enforceBilling("company-1");
    expect(result.allowed).toBe(false);
  });

  it("cai para FREE quando nada cadastrado", async () => {
    mockNoSubscription();
    mockCompany();
    const result = await enforceBilling("company-1");
    expect(result.allowed).toBe(true);
    expect(result.status).toBe("TRIALING");
  });
});
