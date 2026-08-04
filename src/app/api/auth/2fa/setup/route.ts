import { prisma } from "@/lib/db/prisma";
import { successResponse, errorResponse } from "@/lib/auth/api-response";
import { requireRole } from "@/lib/auth/api-guard";
import { createLog } from "@/lib/logger";
import {
  generateSecret,
  generateQrDataUrl,
  generateRecoveryCodes,
  hashRecoveryCodes,
} from "@/lib/auth/two-factor";

export async function POST() {
  try {
    const { user, response } = await requireRole(["ADMIN", "SUPER_ADMIN"]);
    if (response) return response;

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
