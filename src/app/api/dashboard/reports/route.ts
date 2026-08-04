import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { successResponse, errorResponse } from "@/lib/auth/api-response";
import { requireAuth } from "@/lib/auth/api-guard";

export async function GET(request: NextRequest) {
  try {
    const { user, response } = await requireAuth();
    if (response) return response;

    const { searchParams } = new URL(request.url);
    const range = searchParams.get("range") ?? "30d";

    const now = new Date();
    const days = range === "7d" ? 7 : range === "90d" ? 90 : 30;
    const start = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    const [
      totalClients,
      clientsThisMonth,
      clientsLastMonth,
      totalAppointments,
      appointmentsThisMonth,
      appointmentsLastMonth,
      totalConversations,
      conversationsThisMonth,
      conversationsLastMonth,
      totalMessages,
      appointments,
      topServices,
      peakHours,
    ] = await Promise.all([
      prisma.client.count({ where: { companyId: user.companyId, deletedAt: null } }),
      prisma.client.count({
        where: { companyId: user.companyId, deletedAt: null, createdAt: { gte: monthStart } },
      }),
      prisma.client.count({
        where: { companyId: user.companyId, deletedAt: null, createdAt: { gte: lastMonthStart, lte: lastMonthEnd } },
      }),
      prisma.appointment.count({ where: { companyId: user.companyId, deletedAt: null } }),
      prisma.appointment.count({
        where: { companyId: user.companyId, deletedAt: null, createdAt: { gte: monthStart } },
      }),
      prisma.appointment.count({
        where: { companyId: user.companyId, deletedAt: null, createdAt: { gte: lastMonthStart, lte: lastMonthEnd } },
      }),
      prisma.conversation.count({ where: { companyId: user.companyId, deletedAt: null } }),
      prisma.conversation.count({
        where: { companyId: user.companyId, deletedAt: null, createdAt: { gte: monthStart } },
      }),
      prisma.conversation.count({
        where: { companyId: user.companyId, deletedAt: null, createdAt: { gte: lastMonthStart, lte: lastMonthEnd } },
      }),
      prisma.message.count({
        where: { conversation: { companyId: user.companyId, deletedAt: null } },
      }),
      prisma.appointment.findMany({
        where: { companyId: user.companyId, deletedAt: null, createdAt: { gte: start } },
        select: { service: true },
      }),
      prisma.appointment.groupBy({
        by: ["service"],
        where: { companyId: user.companyId, deletedAt: null, createdAt: { gte: start } },
        _count: { _all: true },
        orderBy: { _count: { service: "desc" } },
        take: 8,
      }),
      prisma.appointment.groupBy({
        by: ["time"],
        where: { companyId: user.companyId, deletedAt: null, createdAt: { gte: start } },
        _count: { _all: true },
      }),
    ]);

    const percentChange = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    const services = topServices.map((s) => ({
      service: s.service,
      count: s._count._all,
      percentage: appointments.length > 0 ? Math.round((s._count._all / appointments.length) * 100) : 0,
    }));

    const hourCounts = new Map<string, number>();
    for (const h of peakHours) {
      const hour = h.time.slice(0, 2);
      hourCounts.set(hour, (hourCounts.get(hour) ?? 0) + h._count._all);
    }
    const hours = [];
    for (let i = 0; i < 24; i++) {
      const hh = String(i).padStart(2, "0");
      hours.push({ hour: `${hh}:00`, count: hourCounts.get(hh) ?? 0 });
    }

    const statusCounts = await prisma.conversation.groupBy({
      by: ["status"],
      where: { companyId: user.companyId, deletedAt: null },
      _count: { _all: true },
    });

    return successResponse({
      range,
      totals: {
        clients: totalClients,
        clientsThisMonth,
        clientsChange: percentChange(clientsThisMonth, clientsLastMonth),
        appointments: totalAppointments,
        appointmentsThisMonth,
        appointmentsChange: percentChange(appointmentsThisMonth, appointmentsLastMonth),
        conversations: totalConversations,
        conversationsThisMonth,
        conversationsChange: percentChange(conversationsThisMonth, conversationsLastMonth),
        messages: totalMessages,
      },
      services,
      peakHours: hours,
      conversationStatus: Object.fromEntries(
        statusCounts.map((s) => [s.status, s._count._all])
      ),
    });
  } catch {
    return errorResponse("Erro interno do servidor", 500);
  }
}
