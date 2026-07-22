import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { successResponse, errorResponse } from "@/lib/auth/api-response";
import speakeasy from "speakeasy";
import { createLog } from "@/lib/logger";

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) return errorResponse("Não autorizado", 401);

    if (user.role !== "ADMIN") {
      return errorResponse("Apenas administradores podem configurar 2FA", 403);
    }

    const secret = speakeasy.generateSecret({
      name: `AtendeAI:${user.email}`,
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { twoFactorSecret: secret.base32 },
    });

    await createLog({
      action: "AI_CONFIG_CHANGE",
      entity: "user",
      entityId: user.id,
      description: "Configuração de 2FA iniciada",
      companyId: user.companyId,
      userId: user.id,
    });

    return successResponse({
      secret: secret.base32,
      otpauth_url: secret.otpauth_url,
    });
  } catch {
    return errorResponse("Erro interno do servidor", 500);
  }
}
