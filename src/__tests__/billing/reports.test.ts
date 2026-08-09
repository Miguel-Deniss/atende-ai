import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    company: { count: vi.fn() },
    subscription: {
      count: vi.fn(),
      groupBy: vi.fn(),
      findMany: vi.fn(),
    },
    billingHistory: {
      findMany: vi.fn(),
      aggregate: vi.fn(),
    },
    webhookEvent: {
      findMany: vi.fn(),
    },
    plan: { findMany: vi.fn() },
  },
}));

vi.mock("@/lib/billing/plans", () => ({
  getPlanPriceMap: vi.fn(),
}));

import { prisma } from "@/lib/db/prisma";
import { getPlanPriceMap } from "@/lib/billing/plans";
import { getAdminBillingOverview } from "@/lib/billing/reports";

beforeEach(() => {
  vi.clearAllMocks();

  vi.mocked(prisma.company.count).mockResolvedValue(10);
  vi.mocked(prisma.subscription.count).mockResolvedValue(4);
  vi.mocked(getPlanPriceMap).mockReturnValue({
    FREE: 0,
    STARTER: 5900,
    PRO: 11900,
    BUSINESS: 24900,
    ENTERPRISE: 39900,
  });

  vi.mocked(prisma.subscription.groupBy)
    .mockResolvedValueOnce([
      { status: "ACTIVE", _count: { _all: 4 } },
      { status: "TRIALING", _count: { _all: 2 } },
      { status: "PAST_DUE", _count: { _all: 1 } },
    ] as never)
    .mockResolvedValueOnce([
      { planId: "p-starter", _count: { _all: 3 } },
      { planId: "p-pro", _count: { _all: 1 } },
    ] as never);

  vi.mocked(prisma.plan.findMany).mockResolvedValue([
    { id: "p-starter", code: "STARTER" },
    { id: "p-pro", code: "PRO" },
  ] as never);

  vi.mocked(prisma.subscription.findMany).mockResolvedValue([
    { planId: "p-starter" },
    { planId: "p-starter" },
    { planId: "p-starter" },
    { planId: "p-pro" },
  ] as never);

  vi.mocked(prisma.billingHistory.findMany).mockResolvedValue([
    {
      id: "b1",
      action: "PAYMENT_SUCCESS",
      amount: 11900,
      currency: "BRL",
      status: "paid",
      description: "Pagamento recebido",
      createdAt: new Date("2026-01-01"),
      company: { name: "Empresa A" },
    },
  ] as never);

  vi.mocked(prisma.billingHistory.aggregate).mockResolvedValue({
    _sum: { amount: 11900 },
  } as never);

  vi.mocked(prisma.webhookEvent.findMany).mockResolvedValue([
    {
      id: "w1",
      event: "invoice.paid",
      status: "processed",
      error: null,
      createdAt: new Date("2026-01-01"),
    },
  ] as never);
});

describe("getAdminBillingOverview", () => {
  it("calcula MRR e ARR com base nos planos ativos", async () => {
    const overview = await getAdminBillingOverview();
    expect(overview.mrr).toBe(3 * 5900 + 1 * 11900);
    expect(overview.arr).toBe(overview.mrr * 12);
  });

  it("expõe totais e contagens por status", async () => {
    const overview = await getAdminBillingOverview();
    expect(overview.totals).toEqual({ companies: 10, activeSubscriptions: 4 });
    expect(overview.counts.active).toBe(4);
    expect(overview.counts.trialing).toBe(2);
    expect(overview.counts.pastDue).toBe(1);
    expect(overview.counts.canceled).toBe(0);
    expect(overview.counts.incomplete).toBe(0);
  });

  it("soma receita recebida apenas de PAYMENT_SUCCESS", async () => {
    const overview = await getAdminBillingOverview();
    expect(overview.revenue).toBe(11900);
  });

  it("retorna distribuição por plano e status", async () => {
    const overview = await getAdminBillingOverview();
    expect(overview.planDistribution).toEqual({ STARTER: 3, PRO: 1 });
    expect(overview.statusDistribution).toEqual({
      ACTIVE: 4,
      TRIALING: 2,
      PAST_DUE: 1,
    });
  });

  it("retorna transações recentes e logs Stripe", async () => {
    const overview = await getAdminBillingOverview();
    expect(overview.recentTransactions[0]).toMatchObject({
      companyName: "Empresa A",
      action: "PAYMENT_SUCCESS",
    });
    expect(overview.stripeLogs[0]).toMatchObject({
      event: "invoice.paid",
      status: "processed",
    });
  });

  it("usa FREE como fallback de plano desconhecido no MRR", async () => {
    vi.mocked(prisma.subscription.findMany).mockResolvedValue([{ planId: "p-unknown" }] as never);
    const overview = await getAdminBillingOverview();
    expect(overview.mrr).toBe(0);
  });
});
