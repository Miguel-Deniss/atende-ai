import { prisma } from "@/lib/db/prisma";
import { successResponse, errorResponse } from "@/lib/auth/api-response";
import { requireRole } from "@/lib/auth/api-guard";
import { getPlanPriceMap } from "@/lib/billing/plans";

export async function GET() {
  try {
    const { response } = await requireRole(["SUPER_ADMIN"]);
    if (response) return response;

    const now = new Date();
    const firstDayMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalCompanies,
      activeCompanies,
      suspendedCompanies,
      totalUsers,
      totalClients,
      totalAppointments,
      newCompaniesThisMonth,
      revenueData,
    ] = await Promise.all([
      prisma.company.count({ where: { deletedAt: null } }),
      prisma.company.count({ where: { status: "ACTIVE", deletedAt: null } }),
      prisma.company.count({ where: { status: "SUSPENDED", deletedAt: null } }),
      prisma.user.count({ where: { isActive: true } }),
      prisma.client.count({ where: { deletedAt: null } }),
      prisma.appointment.count({ where: { deletedAt: null } }),
      prisma.company.count({
        where: { createdAt: { gte: firstDayMonth }, deletedAt: null },
      }),
      prisma.company.groupBy({
        by: ["planType"],
        where: { deletedAt: null },
        _count: true,
      }),
    ]);

    const planDistribution = revenueData.reduce(
      (acc: Record<string, number>, curr) => {
        acc[curr.planType] = curr._count;
        return acc;
      },
      {}
    );

    const planPrices = getPlanPriceMap();

    const estimatedMRR = Object.entries(planDistribution).reduce(
      (total, [plan, count]) => total + (planPrices[plan] || 0) * count,
      0
    );

    return successResponse({
      companies: {
        total: totalCompanies,
        active: activeCompanies,
        suspended: suspendedCompanies,
      },
      users: totalUsers,
      clients: totalClients,
      appointments: totalAppointments,
      newCompaniesThisMonth,
      planDistribution,
      estimatedMRR: Math.round(estimatedMRR / 100),
    });
  } catch {
    return errorResponse("Erro interno do servidor", 500);
  }
}
