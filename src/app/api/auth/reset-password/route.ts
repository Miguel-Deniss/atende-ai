import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { resetPasswordSchema } from "@/lib/validators/auth";
import { hashPassword } from "@/lib/auth/password";
import { successResponse, errorResponse } from "@/lib/auth/api-response";
import { revokeAllUserSessions } from "@/lib/auth/session";
import { createLog } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = resetPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse("Dados inválidos", 400);
    }

    const { token, password } = parsed.data;

    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: { gt: new Date() },
      },
    });

    if (!user) {
      return errorResponse("Token inválido ou expirado", 400);
    }

    const passwordHash = await hashPassword(password);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });

    await revokeAllUserSessions(user.id);

    await createLog({
      action: "PASSWORD_RESET",
      entity: "user",
      entityId: user.id,
      description: "Senha redefinida com sucesso",
      companyId: user.companyId,
      userId: user.id,
    });

    return successResponse({ message: "Senha redefinida com sucesso" });
  } catch {
    return errorResponse("Erro interno do servidor", 500);
  }
}
