import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requirePermission } from "@/lib/auth/api-guard";
import {
  successResponse,
  errorResponse,
  notFoundResponse,
  forbiddenResponse,
} from "@/lib/auth/api-response";
import { createLog } from "@/lib/logger";
import { updateUserSchema } from "@/lib/validators/auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, response } = await requirePermission("company:manage_users");
    if (response) return response;

    const { id } = await params;

    const target = await prisma.user.findFirst({
      where: { id, companyId: user!.companyId, deletedAt: null },
    });
    if (!target) return notFoundResponse("Usuário não encontrado");

    if (target.role === "SUPER_ADMIN") {
      return forbiddenResponse("Não é possível alterar um super administrador");
    }

    if (id === user!.id) {
      return forbiddenResponse("Não é possível alterar a própria conta por aqui");
    }

    const body = await request.json();
    const parsed = updateUserSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse("Dados inválidos", 400, parsed.error.flatten().fieldErrors);
    }

    const previous = { role: target.role, isActive: target.isActive };

    const updated = await prisma.user.update({
      where: { id },
      data: parsed.data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        isActive: true,
      },
    });

    await createLog({
      action: "USER_UPDATE",
      entity: "user",
      entityId: updated.id,
      description: `Usuário atualizado: ${updated.name}`,
      companyId: user!.companyId,
      userId: user!.id,
      oldValues: previous,
      newValues: { role: updated.role, isActive: updated.isActive },
    });

    return successResponse(updated);
  } catch (error) {
    console.error(error);
    return errorResponse("Erro interno do servidor", 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, response } = await requirePermission("company:manage_users");
    if (response) return response;

    const { id } = await params;

    if (id === user!.id) {
      return forbiddenResponse("Não é possível excluir a própria conta");
    }

    const target = await prisma.user.findFirst({
      where: { id, companyId: user!.companyId, deletedAt: null },
    });
    if (!target) return notFoundResponse("Usuário não encontrado");

    if (target.role === "SUPER_ADMIN") {
      return forbiddenResponse("Não é possível excluir um super administrador");
    }

    await prisma.$transaction([
      prisma.session.updateMany({
        where: { userId: id, isRevoked: false },
        data: { isRevoked: true },
      }),
      prisma.user.update({
        where: { id },
        data: { deletedAt: new Date(), isActive: false },
      }),
    ]);

    await createLog({
      action: "USER_DELETE",
      entity: "user",
      entityId: id,
      description: `Usuário removido: ${target.name}`,
      companyId: user!.companyId,
      userId: user!.id,
    });

    return successResponse({ message: "Usuário removido" });
  } catch (error) {
    console.error(error);
    return errorResponse("Erro interno do servidor", 500);
  }
}
