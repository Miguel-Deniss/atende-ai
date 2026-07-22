import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { successResponse, errorResponse } from "@/lib/auth/api-response";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return errorResponse("Token é obrigatório", 400);
    }

    const user = await prisma.user.findUnique({
      where: { emailVerificationToken: token },
    });

    if (!user) {
      return errorResponse("Token inválido", 400);
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerificationToken: null,
      },
    });

    return successResponse({ message: "Email verificado com sucesso" });
  } catch {
    return errorResponse("Erro interno do servidor", 500);
  }
}
