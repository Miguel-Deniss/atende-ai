import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { successResponse, errorResponse, unauthorizedResponse } from "@/lib/auth/api-response";
import { profileUpdateSchema, passwordChangeSchema } from "@/lib/validators/auth";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createLog } from "@/lib/logger";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();

    const profile = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        avatarUrl: true,
        twoFactorEnabled: true,
      },
    });

    return successResponse(profile);
  } catch {
    return errorResponse("Erro interno do servidor", 500);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();

    const body = await request.json();
    const parsed = profileUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse("Dados inválidos", 400, parsed.error.flatten().fieldErrors);
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: parsed.data,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        avatarUrl: true,
      },
    });

    return successResponse(updated);
  } catch {
    return errorResponse("Erro interno do servidor", 500);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();

    const body = await request.json();

    if (body.password) {
      const parsed = passwordChangeSchema.safeParse(body);
      if (!parsed.success) {
        return errorResponse("Dados inválidos", 400, parsed.error.flatten().fieldErrors);
      }

      const currentUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { passwordHash: true },
      });

      if (!currentUser?.passwordHash) {
        return errorResponse("Usuário sem senha configurada", 400);
      }

      const valid = await verifyPassword(parsed.data.currentPassword, currentUser.passwordHash);
      if (!valid) {
        return errorResponse("Senha atual inválida", 400);
      }

      const passwordHash = await hashPassword(parsed.data.newPassword);
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash },
      });

      await createLog({
        action: "PASSWORD_CHANGE",
        entity: "user",
        entityId: user.id,
        description: "Senha alterada com sucesso",
        companyId: user.companyId,
        userId: user.id,
      });

      return successResponse({ message: "Senha alterada com sucesso" });
    }

    return errorResponse("Nenhuma alteração fornecida", 400);
  } catch {
    return errorResponse("Erro interno do servidor", 500);
  }
}
