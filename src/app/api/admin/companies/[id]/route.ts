import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse, notFoundResponse } from "@/lib/auth/api-response";
import { createLog } from "@/lib/logger";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();
    if (user.role !== "SUPER_ADMIN") return forbiddenResponse("Apenas administradores podem acessar esta área");
    const { id } = await params;

    const company = await prisma.company.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true,
            lastLoginAt: true,
            createdAt: true,
          },
        },
        settings: true,
        aiConfig: {
          include: { services: true, faq: true },
        },
        _count: {
          select: {
            users: true,
            clients: true,
            appointments: true,
            conversations: true,
            uploads: true,
            auditLogs: true,
          },
        },
      },
    });

    if (!company) return notFoundResponse("Empresa não encontrada");
    return successResponse(company);
  } catch {
    return errorResponse("Erro interno do servidor", 500);
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();
    if (user.role !== "SUPER_ADMIN") return forbiddenResponse("Apenas administradores podem modificar empresas");
    const { id } = await params;

    const body = await request.json();
    const allowedFields = ["status", "planType", "name", "subscriptionStatus"];
    const updateData: Record<string, unknown> = {};

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return errorResponse("Nenhum campo válido para atualização", 400);
    }

    const previous = await prisma.company.findUnique({ where: { id } });
    if (!previous) return notFoundResponse("Empresa não encontrada");

    const company = await prisma.company.update({
      where: { id },
      data: updateData,
    });

    await createLog({
      action: "USER_UPDATE",
      entity: "company",
      entityId: id,
      description: `Empresa atualizada por admin: ${company.name}`,
      companyId: id,
      userId: user.id,
      oldValues: previous,
      newValues: company,
    });

    if (updateData.status === "SUSPENDED") {
      await prisma.user.updateMany({
        where: { companyId: id, isActive: true },
        data: { isActive: false },
      });

      await prisma.session.updateMany({
        where: { user: { companyId: id }, isRevoked: false },
        data: { isRevoked: true },
      });
    }

    if (updateData.status === "ACTIVE") {
      await prisma.user.updateMany({
        where: { companyId: id },
        data: { isActive: true },
      });
    }

    return successResponse(company);
  } catch {
    return errorResponse("Erro interno do servidor", 500);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();
    if (user.role !== "SUPER_ADMIN") return forbiddenResponse("Apenas administradores podem excluir empresas");
    const { id } = await params;

    const company = await prisma.company.findUnique({ where: { id } });
    if (!company) return notFoundResponse("Empresa não encontrada");

    await prisma.session.deleteMany({
      where: { user: { companyId: id } },
    });

    await prisma.company.update({
      where: { id },
      data: { deletedAt: new Date(), status: "CANCELLED" },
    });

    await createLog({
      action: "DATA_DELETE",
      entity: "company",
      entityId: id,
      description: `Empresa excluída por admin: ${company.name}`,
      companyId: id,
      userId: user.id,
    });

    return successResponse({ message: "Empresa excluída com sucesso" });
  } catch {
    return errorResponse("Erro interno do servidor", 500);
  }
}
