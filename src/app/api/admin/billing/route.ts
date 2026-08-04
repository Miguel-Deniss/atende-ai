import { getCurrentUser } from "@/lib/auth/session";
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  forbiddenResponse,
} from "@/lib/auth/api-response";
import { prisma } from "@/lib/db/prisma";
import { getPlanPriceMap } from "@/lib/billing/plans";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();
    if (user.role !== "SUPER_ADMIN") {
      return forbiddenResponse("Apenas super administradores podem acessar esta área");
    }

    const [companies, activeSubs, billingHistory, planDistribution] =
      await Promise.all([
        prisma.company.count({ where: { deletedAt: null } }),
        prisma.subscription.count({ where: { status: "ACTIVE" } }),
        prisma.billingHistory.findMany({
          orderBy: { createdAt: "desc" },
          take: 50,
          include: {
            company: { select: { name: true } },
          },
        }),
        prisma.subscription.groupBy({
          by: ["status"],
          _count: { _all: true },
        }),
      ]);

    const groupByPlan = await prisma.subscription.groupBy({
      by: ["planId"],
      _count: { _all: true },
    });

    const planMap = new Map(
      (
        await prisma.plan.findMany({ select: { id: true, code: true } })
      ).map((p) => [p.id, p.code])
    );

    const activeByPlan = await prisma.subscription.findMany({
      where: { status: "ACTIVE" },
      select: { planId: true },
    });

    let mrr = 0;
    const PLAN_PRICES = getPlanPriceMap();
    for (const sub of activeByPlan) {
      const code = planMap.get(sub.planId) ?? "FREE";
      mrr += PLAN_PRICES[code] ?? 0;
    }

    return successResponse({
      totals: {
        companies,
        activeSubscriptions: activeSubs,
      },
      mrr,
      planDistribution: Object.fromEntries(
        groupByPlan.map((g) => [planMap.get(g.planId) ?? "?", g._count._all])
      ),
      statusDistribution: Object.fromEntries(
        planDistribution.map((g) => [g.status, g._count._all])
      ),
      recentTransactions: billingHistory.map((b) => ({
        id: b.id,
        companyName: b.company?.name ?? "Desconhecida",
        action: b.action,
        amount: b.amount,
        currency: b.currency,
        status: b.status,
        description: b.description,
        createdAt: b.createdAt,
      })),
    });
  } catch (error) {
    console.error(error);
    return errorResponse("Erro interno do servidor", 500);
  }
}
