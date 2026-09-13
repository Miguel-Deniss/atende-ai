import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requirePermission } from "@/lib/auth/api-guard";
import { successResponse, errorResponse } from "@/lib/auth/api-response";
import { appointmentSchema } from "@/lib/validators/auth";
import { createLog } from "@/lib/logger";
import { Prisma } from "@prisma/client";
import { getPlanLimits } from "@/lib/tenant/plan-limits";

export async function GET(request: NextRequest) {
  try {
    const { user, response } = await requirePermission("company:view_schedule");
    if (response) return response;

    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    const month = searchParams.get("month");
    const year = searchParams.get("year");

    const where: Prisma.AppointmentWhereInput = {
      companyId: user.companyId,
      deletedAt: null,
    };

    if (date) {
      const start = new Date(date + "T00:00:00.000Z");
      const end = new Date(date + "T23:59:59.999Z");
      where.date = { gte: start, lte: end };
    } else if (month && year) {
      const start = new Date(Number(year), Number(month) - 1, 1);
      const end = new Date(Number(year), Number(month), 0, 23, 59, 59);
      where.date = { gte: start, lte: end };
    }

    const appointments = await prisma.appointment.findMany({
      where,
      orderBy: [{ date: "asc" }, { time: "asc" }],
    });

    return successResponse(appointments);
  } catch {
    return errorResponse("Erro interno do servidor", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, response } = await requirePermission("company:manage_schedule");
    if (response) return response;

    const body = await request.json();
    const parsed = appointmentSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse("Dados inválidos", 400, parsed.error.flatten().fieldErrors);
    }

    const [appointmentCount, service, client] = await Promise.all([
      prisma.appointment.count({ where: { companyId: user.companyId, deletedAt: null } }),
      prisma.service.findFirst({
        where: { name: parsed.data.service, aiConfig: { companyId: user.companyId } },
        select: { name: true },
      }),
      parsed.data.clientId
        ? prisma.client.findFirst({
            where: { id: parsed.data.clientId, companyId: user.companyId, deletedAt: null },
            select: { id: true },
          })
        : Promise.resolve(null),
    ]);

    if (appointmentCount >= getPlanLimits(user.company.planType).maxAppointments) {
      return errorResponse("Limite de agendamentos do plano atingido", 403);
    }

    if (!service) return errorResponse("Servico invalido para esta empresa", 400);
    if (parsed.data.clientId && !client) return errorResponse("Cliente nao encontrado", 404);

    const appointment = await prisma.appointment.create({
      data: {
        time: parsed.data.time,
        date: new Date(parsed.data.date + "T12:00:00.000Z"),
        name: parsed.data.name,
        service: service.name,
        clientId: client?.id,
        status: parsed.data.status,
        companyId: user.companyId,
      },
    });

    await createLog({
      action: "USER_CREATE",
      entity: "appointment",
      entityId: appointment.id,
      description: `Agendamento criado: ${appointment.name} - ${appointment.service}`,
      companyId: user.companyId,
      userId: user.id,
    });

    return successResponse(appointment, 201);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return errorResponse("Este horario ja esta ocupado", 409);
    }
    return errorResponse("Erro interno do servidor", 500);
  }
}
