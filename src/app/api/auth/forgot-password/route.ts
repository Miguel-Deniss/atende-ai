import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { forgotPasswordSchema } from "@/lib/validators/auth";
import { successResponse, errorResponse } from "@/lib/auth/api-response";
import { generateToken } from "@/lib/security/encryption";
import { createLog } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = forgotPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse("Email inválido", 400);
    }

    const { email } = parsed.data;

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return successResponse({
        message: "Se o email existir, você receberá instruções para redefinir sua senha.",
      });
    }

    const resetToken = generateToken(48);
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: resetToken,
        resetPasswordExpires: resetExpires,
      },
    });

    await createLog({
      action: "PASSWORD_RESET",
      entity: "user",
      entityId: user.id,
      description: `Solicitação de redefinição de senha para ${email}`,
      companyId: user.companyId,
      userId: user.id,
    });

    return successResponse({
      message: "Se o email existir, você receberá instruções para redefinir sua senha.",
      resetToken: process.env.NODE_ENV === "development" ? resetToken : undefined,
    });
  } catch {
    return errorResponse("Erro interno do servidor", 500);
  }
}
