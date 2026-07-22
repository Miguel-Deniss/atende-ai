import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { successResponse, errorResponse, unauthorizedResponse } from "@/lib/auth/api-response";
import { appointmentSchema, paginationSchema } from "@/lib/validators/auth";
import { createLog } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();

    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    const month = searchParams.get("month");
    const year = searchParams.get("year");

    const where: Record<string, unknown> = {
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
      where: where as any,
      orderBy: [{ date: "asc" }, { time: "asc" }],
    });

    return successResponse(appointments);
  } catch {
    return errorResponse("Erro interno do servidor", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();

    const body = await request.json();
    const parsed = appointmentSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse("Dados inválidos", 400, parsed.error.flatten().fieldErrors);
    }

    const appointment = await prisma.appointment.create({
      data: {
        ...parsed.data,
        date: new Date(parsed.data.date + "T12:00:00.000Z"),
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
  } catch {
    return errorResponse("Erro interno do servidor", 500);
  }
}
