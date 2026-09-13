import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requirePermission } from "@/lib/auth/api-guard";
import { successResponse, errorResponse, notFoundResponse } from "@/lib/auth/api-response";
import { clientSchema } from "@/lib/validators/auth";
import { createLog } from "@/lib/logger";
import { normalizeBrazilianPhone } from "@/lib/clients/phone";
import { Prisma } from "@prisma/client";

async function getClientForCompany(clientId: string, companyId: string) {
  return prisma.client.findFirst({
    where: { id: clientId, companyId, deletedAt: null },
  });
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user, response } = await requirePermission("company:view_clients");
    if (response) return response;
    const { id } = await params;

    const client = await getClientForCompany(id, user.companyId);
    if (!client) return notFoundResponse("Cliente não encontrado");

    return successResponse(client);
  } catch {
    return errorResponse("Erro interno do servidor", 500);
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user, response } = await requirePermission("company:manage_clients");
    if (response) return response;
    const { id } = await params;

    const existing = await getClientForCompany(id, user.companyId);
    if (!existing) return notFoundResponse("Cliente não encontrado");

    const body = await request.json();
    const parsed = clientSchema.partial().safeParse(body);

    if (!parsed.success) {
      return errorResponse("Dados inválidos", 400, parsed.error.flatten().fieldErrors);
    }

    const data = parsed.data.phone
      ? { ...parsed.data, phone: normalizeBrazilianPhone(parsed.data.phone) }
      : parsed.data;

    const client = await prisma.client.update({
      where: { id },
      data,
    });

    await createLog({
      action: "USER_UPDATE",
      entity: "client",
      entityId: client.id,
      description: `Cliente atualizado: ${client.name}`,
      companyId: user.companyId,
      userId: user.id,
      oldValues: existing,
      newValues: client,
    });

    return successResponse(client);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return errorResponse("Ja existe um cliente com este telefone", 409);
    }
    if (error instanceof Error && error.message === "Telefone invalido") {
      return errorResponse("Telefone invalido", 400);
    }
    return errorResponse("Erro interno do servidor", 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, response } = await requirePermission("company:manage_clients");
    if (response) return response;
    const { id } = await params;

    const existing = await getClientForCompany(id, user.companyId);
    if (!existing) return notFoundResponse("Cliente não encontrado");

    await prisma.client.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await createLog({
      action: "DATA_DELETE",
      entity: "client",
      entityId: id,
      description: `Cliente removido: ${existing.name}`,
      companyId: user.companyId,
      userId: user.id,
    });

    return successResponse({ message: "Cliente removido com sucesso" });
  } catch {
    return errorResponse("Erro interno do servidor", 500);
  }
}
