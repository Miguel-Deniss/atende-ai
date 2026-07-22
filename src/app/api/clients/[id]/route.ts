import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse } from "@/lib/auth/api-response";
import { clientSchema } from "@/lib/validators/auth";
import { createLog } from "@/lib/logger";

async function getClientForCompany(clientId: string, companyId: string) {
  return prisma.client.findFirst({
    where: { id: clientId, companyId, deletedAt: null },
  });
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();
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
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();
    const { id } = await params;

    const existing = await getClientForCompany(id, user.companyId);
    if (!existing) return notFoundResponse("Cliente não encontrado");

    const body = await request.json();
    const parsed = clientSchema.partial().safeParse(body);

    if (!parsed.success) {
      return errorResponse("Dados inválidos", 400, parsed.error.flatten().fieldErrors);
    }

    const client = await prisma.client.update({
      where: { id },
      data: parsed.data,
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
  } catch {
    return errorResponse("Erro interno do servidor", 500);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();
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
