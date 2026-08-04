import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { successResponse, errorResponse } from "@/lib/auth/api-response";
import { createLog } from "@/lib/logger";
import { verifyTotp } from "@/lib/auth/two-factor";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return errorResponse("Não autorizado", 401);

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
      data: { twoFactorEnabled: true },
    });

    await createLog({
      action: "TWOFA_VERIFY",
      entity: "user",
      entityId: user.id,
      description: "2FA ativado com sucesso",
      companyId: user.companyId,
      userId: user.id,
    });

    return successResponse({ message: "2FA ativado com sucesso" });
  } catch (error) {
    console.error(error);
    return errorResponse("Erro interno do servidor", 500);
  }
}
