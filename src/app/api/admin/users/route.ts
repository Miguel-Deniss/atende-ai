import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { successResponse, errorResponse, notFoundResponse } from "@/lib/auth/api-response";
import { requireRole } from "@/lib/auth/api-guard";
import { paginationSchema } from "@/lib/validators/auth";
import { createLog } from "@/lib/logger";

const ADMIN_MANAGEABLE_ROLES = ["ADMIN", "ATTENDANT", "EMPLOYEE", "FINANCIAL"] as const;

export async function GET(request: NextRequest) {
  try {
    const { response } = await requireRole(["SUPER_ADMIN"]);
    if (response) return response;

    const { searchParams } = new URL(request.url);
    const parsed = paginationSchema.safeParse({
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
      search: searchParams.get("search"),
      status: searchParams.get("status"),
    });

    const { page, limit, search, status } = parsed.data!;
    const role = searchParams.get("role");
    const companyId = searchParams.get("companyId");

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    if (status === "active") {
      where.isActive = true;
    } else if (status === "inactive") {
      where.isActive = false;
    }

    if (role) {
      where.role = role;
    }

    if (companyId) {
      where.companyId = companyId;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: where as any,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          phone: true,
          isActive: true,
          emailVerified: true,
          twoFactorEnabled: true,
          lastLoginAt: true,
          lastLoginIp: true,
          createdAt: true,
          updatedAt: true,
          company: {
            select: {
              id: true,
              name: true,
              slug: true,
              planType: true,
              status: true,
            },
          },
          _count: {
            select: {
              sessions: true,
              handledConversations: true,
            },
          },
        },
      }),
      prisma.user.count({ where: where as any }),
    ]);

    return successResponse({
      users,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch {
    return errorResponse("Erro interno do servidor", 500);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { user, response } = await requireRole(["SUPER_ADMIN"]);
    if (response) return response;

    const body = await request.json();
    const targetId = body.id;

    if (!targetId) {
      return errorResponse("ID do usuário é obrigatório", 400);
    }

    if (targetId === user.id) {
      return errorResponse("Você não pode modificar a si mesmo", 400);
    }

    const target = await prisma.user.findUnique({ where: { id: targetId } });
    if (!target) return notFoundResponse("Usuário não encontrado");

    if (target.role === "SUPER_ADMIN") {
      return errorResponse("Não é possível modificar um Super Admin", 400);
    }

    const updateData: Record<string, unknown> = {};

    if (body.role !== undefined) {
      if (!ADMIN_MANAGEABLE_ROLES.includes(body.role)) {
        return errorResponse("Papel inválido para esta operação", 400);
      }
      updateData.role = body.role;
    }

    if (body.isActive !== undefined) {
      updateData.isActive = !!body.isActive;
    }

    if (Object.keys(updateData).length === 0) {
      return errorResponse("Nenhum campo válido para atualização", 400);
    }

    if (updateData.isActive === false) {
      await prisma.session.updateMany({
        where: { userId: targetId, isRevoked: false },
        data: { isRevoked: true },
      });
    }

    const updated = await prisma.user.update({
      where: { id: targetId },
      data: updateData,
    });

    await createLog({
      action: "USER_UPDATE",
      entity: "user",
      entityId: targetId,
      description: `Usuário ${target.name} (${target.email}) atualizado por admin`,
      companyId: target.companyId,
      userId: user.id,
      oldValues: { role: target.role, isActive: target.isActive },
      newValues: updated,
    });

    return successResponse(updated);
  } catch {
    return errorResponse("Erro interno do servidor", 500);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { user, response } = await requireRole(["SUPER_ADMIN"]);
    if (response) return response;

    const body = await request.json();
    const targetId = body.id;

    if (!targetId) {
      return errorResponse("ID do usuário é obrigatório", 400);
    }

    if (targetId === user.id) {
      return errorResponse("Você não pode excluir a si mesmo", 400);
    }

    const target = await prisma.user.findUnique({ where: { id: targetId } });
    if (!target) return notFoundResponse("Usuário não encontrado");

    if (target.role === "SUPER_ADMIN") {
      return errorResponse("Não é possível excluir um Super Admin", 400);
    }

    await prisma.session.deleteMany({ where: { userId: targetId } });

    await prisma.user.update({
      where: { id: targetId },
      data: { deletedAt: new Date(), isActive: false },
    });

    await createLog({
      action: "USER_DELETE",
      entity: "user",
      entityId: targetId,
      description: `Usuário excluído por admin: ${target.name} (${target.email})`,
      companyId: target.companyId,
      userId: user.id,
    });

    return successResponse({ message: "Usuário excluído com sucesso" });
  } catch {
    return errorResponse("Erro interno do servidor", 500);
  }
}
