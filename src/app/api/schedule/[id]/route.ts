import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requirePermission } from "@/lib/auth/api-guard";
import { successResponse, errorResponse, notFoundResponse } from "@/lib/auth/api-response";
import { createLog } from "@/lib/logger";

const STATUSES = ["pending", "confirmed", "cancelled", "completed"] as const;

async function getAppointmentForCompany(appointmentId: string, companyId: string) {
  return prisma.appointment.findFirst({
    where: { id: appointmentId, companyId, deletedAt: null },
  });
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user, response } = await requirePermission("company:view_schedule");
    if (response) return response;
    const { id } = await params;

    const appointment = await getAppointmentForCompany(id, user.companyId);
    if (!appointment) return notFoundResponse("Agendamento não encontrado");

    return successResponse(appointment);
  } catch {
    return errorResponse("Erro interno do servidor", 500);
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user, response } = await requirePermission("company:manage_schedule");
    if (response) return response;
    const { id } = await params;

    const existing = await getAppointmentForCompany(id, user.companyId);
    if (!existing) return notFoundResponse("Agendamento não encontrado");

    const body = await request.json();
    const status = body.status as string;

    if (!status || !STATUSES.includes(status as (typeof STATUSES)[number])) {
      return errorResponse("Status inválido. Use pending, confirmed, cancelled ou completed", 400);
    }

    const appointment = await prisma.appointment.update({
      where: { id },
      data: { status },
    });

    await createLog({
      action: "USER_UPDATE",
      entity: "appointment",
      entityId: appointment.id,
      description: `Agendamento ${appointment.name} ${status === "confirmed" ? "confirmado" : `atualizado para ${status}`}`,
      companyId: user.companyId,
      userId: user.id,
      oldValues: { status: existing.status },
      newValues: { status: appointment.status },
    });

    return successResponse(appointment);
  } catch {
    return errorResponse("Erro interno do servidor", 500);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user, response } = await requirePermission("company:manage_schedule");
    if (response) return response;
    const { id } = await params;

    const existing = await getAppointmentForCompany(id, user.companyId);
    if (!existing) return notFoundResponse("Agendamento não encontrado");

    await prisma.appointment.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await createLog({
      action: "DATA_DELETE",
      entity: "appointment",
      entityId: id,
      description: `Agendamento removido: ${existing.name} - ${existing.service}`,
      companyId: user.companyId,
      userId: user.id,
    });

    return successResponse({ message: "Agendamento removido com sucesso" });
  } catch {
    return errorResponse("Erro interno do servidor", 500);
  }
}
