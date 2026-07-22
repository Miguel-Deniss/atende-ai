import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse } from "@/lib/auth/api-response";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();
    const { id } = await params;

    const conversation = await prisma.conversation.findFirst({
      where: { id, companyId: user.companyId },
    });

    if (!conversation) return notFoundResponse("Conversa não encontrada");

    const body = await request.json();
    const updated = await prisma.conversation.update({
      where: { id },
      data: body,
    });

    return successResponse(updated);
  } catch {
    return errorResponse("Erro interno do servidor", 500);
  }
}
