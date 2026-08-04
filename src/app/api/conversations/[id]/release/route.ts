import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requirePermission } from "@/lib/auth/api-guard";
import { publish } from "@/lib/realtime";
import {
  successResponse,
  errorResponse,
  notFoundResponse,
} from "@/lib/auth/api-response";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, response } = await requirePermission("company:respond_conversations");
    if (response) return response;

    const { id } = await params;

    const conversation = await prisma.conversation.findFirst({
      where: { id, companyId: user.companyId },
      select: { id: true, companyId: true },
    });

    if (!conversation) {
      return notFoundResponse("Conversa não encontrada");
    }

    const updated = await prisma.conversation.update({
      where: { id },
      data: { handledById: null, handledAt: null },
      select: {
        id: true,
        handledById: true,
        handledAt: true,
        handledBy: { select: { id: true, name: true } },
      },
    });

    publish(conversation.companyId, "conversation", { id });

    return successResponse(updated);
  } catch (error) {
    console.error(error);

    return errorResponse("Erro interno do servidor", 500);
  }
}
