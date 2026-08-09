import { prisma } from "@/lib/db/prisma";
import { getPlanPriceMap } from "@/lib/billing/plans";

export interface AdminBillingOverview {
  totals: {
    companies: number;
    activeSubscriptions: number;
  };
  counts: {
    active: number;
    trialing: number;
    canceled: number;
    pastDue: number;
    incomplete: number;
  };
  mrr: number;
  arr: number;
  revenue: number;
  planDistribution: Record<string, number>;
  statusDistribution: Record<string, number>;
  recentTransactions: Array<{
    id: string;
    companyName: string;
    action: string;
    amount: number;
    currency: string;
    status: string;
    description: string | null;
    createdAt: Date;
  }>;
  stripeLogs: Array<{
    id: string;
    event: string;
    status: string;
    error: string | null;
    createdAt: Date;
  }>;
}

export async function getAdminBillingOverview(): Promise<AdminBillingOverview> {
  const [
    companies,
    activeSubs,
    statusGroup,
    recentTransactions,
    stripeLogs,
    planRows,
    activePlanIds,
    revenueAgg,
  ] = await Promise.all([
    prisma.company.count({ where: { deletedAt: null } }),
    prisma.subscription.count({ where: { status: "ACTIVE" } }),
    prisma.subscription.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
    prisma.billingHistory.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { company: { select: { name: true } } },
    }),
    prisma.webhookEvent.findMany({
      where: { provider: "stripe" },
      orderBy: { createdAt: "desc" },
      take: 25,
    }),
    prisma.plan.findMany({ select: { id: true, code: true } }),
    prisma.subscription.findMany({
      where: { status: "ACTIVE" },
      select: { planId: true },
    }),
    prisma.billingHistory.aggregate({
      where: { action: "PAYMENT_SUCCESS" },
      _sum: { amount: true },
    }),
  ]);

  const planMap = new Map(planRows.map((p) => [p.id, p.code]));
  const PLAN_PRICES = getPlanPriceMap();

  let mrr = 0;
  for (const sub of activePlanIds) {
    const code = planMap.get(sub.planId) ?? "FREE";
    mrr += PLAN_PRICES[code] ?? 0;
  }

  const countByStatus = (status: string) =>
    statusGroup.find((g) => g.status === status)?._count._all ?? 0;

  return {
    totals: {
      companies,
      activeSubscriptions: activeSubs,
    },
    counts: {
      active: countByStatus("ACTIVE"),
      trialing: countByStatus("TRIALING"),
      canceled: countByStatus("CANCELED"),
      pastDue: countByStatus("PAST_DUE"),
      incomplete: countByStatus("INCOMPLETE"),
    },
    mrr,
    arr: mrr * 12,
    revenue: revenueAgg._sum.amount ?? 0,
    planDistribution: Object.fromEntries(
      (
        await prisma.subscription.groupBy({
          by: ["planId"],
          _count: { _all: true },
        })
      ).map((g) => [planMap.get(g.planId) ?? "?", g._count._all])
    ),
    statusDistribution: Object.fromEntries(statusGroup.map((g) => [g.status, g._count._all])),
    recentTransactions: recentTransactions.map((b) => ({
      id: b.id,
      companyName: b.company?.name ?? "Desconhecida",
      action: b.action,
      amount: b.amount,
      currency: b.currency,
      status: b.status,
      description: b.description,
      createdAt: b.createdAt,
    })),
    stripeLogs: stripeLogs.map((w) => ({
      id: w.id,
      event: w.event,
      status: w.status,
      error: w.error,
      createdAt: w.createdAt,
    })),
  };
}
