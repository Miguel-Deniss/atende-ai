import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth/api-guard";
import { prisma } from "@/lib/db/prisma";
import { successResponse, errorResponse } from "@/lib/auth/api-response";
import { createLog } from "@/lib/logger";
import { verifyTotp } from "@/lib/auth/two-factor";
import { Prisma } from "@prisma/client";

export async function POST(request: NextRequest) {
  try {
    const { user, response } = await requireAuth();
    if (response) return response;

    const body = await request.json();
    const { token } = body;

    if (!token || token.length !== 6) {
      return errorResponse("Código inválido", 400);
    }

    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: { twoFactorSecret: true },
    });

    if (!userData?.twoFactorSecret) {
      return errorResponse("2FA não configurado", 400);
    }

    if (!verifyTotp(userData.twoFactorSecret, token)) {
      return errorResponse("Código inválido", 400);
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorRecoveryCodes: Prisma.JsonNull,
      },
    });

    await createLog({
      action: "TWOFA_DISABLE",
      entity: "user",
      entityId: user.id,
      description: "2FA desativado",
      companyId: user.companyId,
      userId: user.id,
    });

    return successResponse({ message: "2FA desativado" });
  } catch (error) {
    console.error(error);
    return errorResponse("Erro interno do servidor", 500);
  }
}
