import { prisma } from "@/lib/db/prisma";
import { successResponse, errorResponse } from "@/lib/auth/api-response";
import { requireAuth } from "@/lib/auth/api-guard";

export async function GET() {
  try {
    const { user, response } = await requireAuth();
    if (response) return response;

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const yesterdayStart = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000);

    const whereCompany = { companyId: user.companyId, deletedAt: null };

    const [
      totalClients,
      clientsThisMonth,
      totalConversations,
      conversationsToday,
      messagesToday,
      incomingToday,
      outgoingToday,
      totalAppointments,
      appointmentsToday,
      appointmentsWeek,
      unreadConversations,
      openConversations,
    ] = await Promise.all([
      prisma.client.count({ where: whereCompany }),
      prisma.client.count({ where: { ...whereCompany, createdAt: { gte: monthStart } } }),
      prisma.conversation.count({ where: whereCompany }),
      prisma.conversation.count({ where: { ...whereCompany, createdAt: { gte: todayStart } } }),
      prisma.message.count({
        where: {
          conversation: { companyId: user.companyId, deletedAt: null },
          createdAt: { gte: todayStart },
        },
      }),
      prisma.message.count({
        where: {
          role: "user",
          conversation: { companyId: user.companyId, deletedAt: null },
          createdAt: { gte: todayStart },
        },
      }),
      prisma.message.count({
        where: {
          role: { in: ["assistant", "system"] },
          conversation: { companyId: user.companyId, deletedAt: null },
          createdAt: { gte: todayStart },
        },
      }),
      prisma.appointment.count({ where: whereCompany }),
      prisma.appointment.count({
        where: { companyId: user.companyId, deletedAt: null, date: { gte: todayStart, lte: todayEnd } },
      }),
      prisma.appointment.count({
        where: {
          companyId: user.companyId,
          deletedAt: null,
          date: { gte: yesterdayStart, lte: todayEnd },
        },
      }),
      prisma.conversation.count({ where: { ...whereCompany, unread: true } }),
      prisma.conversation.count({ where: { ...whereCompany, status: "OPEN" } }),
    ]);

    const sevenDaysAgo = new Date(todayStart.getTime() - 6 * 24 * 60 * 60 * 1000);

    const [appointmentsByDay, conversationsByDay] = await Promise.all([
      prisma.appointment.groupBy({
        by: ["date"],
        where: {
          companyId: user.companyId,
          deletedAt: null,
          date: { gte: sevenDaysAgo, lte: todayEnd },
        },
        _count: { _all: true },
      }),
      prisma.conversation.groupBy({
        by: ["createdAt"],
        where: { companyId: user.companyId, deletedAt: null, createdAt: { gte: sevenDaysAgo } },
        _count: { _all: true },
      }),
    ]);

    const appointmentsMap = new Map(
      appointmentsByDay.map((a) => [a.date.toISOString().slice(0, 10), a._count._all])
    );
    const conversationsMap = new Map(
      conversationsByDay.map((c) => [c.createdAt.toISOString().slice(0, 10), c._count._all])
    );

    const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    const chart = [];
    for (let i = 6; i >= 0; i--) {
      const day = new Date(todayStart.getTime() - i * 24 * 60 * 60 * 1000);
      const key = day.toISOString().slice(0, 10);
      chart.push({
        day: weekDays[day.getDay()],
        date: key,
        appointments: appointmentsMap.get(key) ?? 0,
        conversations: conversationsMap.get(key) ?? 0,
      });
    }

    const [recentConversations, todayAppointments] = await Promise.all([
      prisma.conversation.findMany({
        where: whereCompany,
        orderBy: { updatedAt: "desc" },
        take: 5,
        include: {
          messages: { orderBy: { createdAt: "desc" }, take: 1 },
          client: { select: { name: true } },
        },
      }),
      prisma.appointment.findMany({
        where: {
          companyId: user.companyId,
          deletedAt: null,
          date: { gte: todayStart, lte: todayEnd },
        },
        orderBy: [{ date: "asc" }, { time: "asc" }],
        take: 6,
      }),
    ]);

    const responseRate =
      incomingToday + outgoingToday > 0
        ? Math.round((outgoingToday / (incomingToday + outgoingToday)) * 100)
        : 0;

    return successResponse({
      cards: {
        totalClients,
        clientsThisMonth,
        totalConversations,
        conversationsToday,
        messagesToday,
        totalAppointments,
        appointmentsToday,
        unreadConversations,
        openConversations,
        responseRate,
      },
      chart,
      recentConversations: recentConversations.map((c) => ({
        id: c.id,
        name: c.name ?? c.client?.name ?? c.phone,
        phone: c.phone,
        lastMessage: c.messages[0]?.content ?? c.lastMessage ?? "",
        lastMessageAt: c.messages[0]?.createdAt ?? c.lastMessageAt ?? c.updatedAt,
        status: c.status,
        unread: c.unread,
      })),
      todayAppointments: todayAppointments.map((a) => ({
        id: a.id,
        time: a.time,
        name: a.name,
        service: a.service,
        status: a.status,
      })),
    });
  } catch {
    return errorResponse("Erro interno do servidor", 500);
  }
}
