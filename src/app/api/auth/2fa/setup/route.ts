import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { successResponse, errorResponse } from "@/lib/auth/api-response";
import { createLog } from "@/lib/logger";
import {
  generateSecret,
  generateQrDataUrl,
  generateRecoveryCodes,
  hashRecoveryCodes,
} from "@/lib/auth/two-factor";

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) return errorResponse("Não autorizado", 401);

    if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
      return errorResponse("Apenas administradores podem configurar 2FA", 403);
    }

    const secret = generateSecret(user.email);
    const recoveryCodes = generateRecoveryCodes(10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorSecret: secret.base32,
        twoFactorRecoveryCodes: hashRecoveryCodes(recoveryCodes) as never,
      },
    });

    await createLog({
      action: "TWOFA_SETUP",
      entity: "user",
      entityId: user.id,
      description: "Configuração de 2FA iniciada (códigos de recuperação gerados)",
      companyId: user.companyId,
      userId: user.id,
    });

    const qrCodeDataUrl = secret.otpauth_url
      ? await generateQrDataUrl(secret.otpauth_url)
      : null;

    return successResponse({
      secret: secret.base32,
      otpauth_url: secret.otpauth_url,
      qrCodeDataUrl,
      recoveryCodes,
    });
  } catch (error) {
    console.error(error);
    return errorResponse("Erro interno do servidor", 500);
  }
}
