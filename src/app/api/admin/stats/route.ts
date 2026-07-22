import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse } from "@/lib/auth/api-response";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();
    if (user.role !== "ADMIN") return forbiddenResponse("Apenas administradores podem acessar esta área");

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

    const planPrices: Record<string, number> = {
      STARTER: 59,
      PRO: 119,
      BUSINESS: 249,
    };

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
      estimatedMRR,
    });
  } catch {
    return errorResponse("Erro interno do servidor", 500);
  }
}
