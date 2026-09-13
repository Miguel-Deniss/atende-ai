import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requirePermission } from "@/lib/auth/api-guard";
import { generateAIResponse } from "@/lib/ai/assistant";
import { loadConversationContext } from "@/lib/ai/context-loader";
import { classifyAIError, logAIError } from "@/lib/ai/errors";
import { deliverWhatsAppMessage } from "@/lib/whatsapp/deliver";
import { publish } from "@/lib/realtime";
import { enforceBilling } from "@/lib/billing/subscription";
import { guardRateLimit } from "@/lib/rate-limit/with-rate-limit";

import { successResponse, errorResponse, notFoundResponse } from "@/lib/auth/api-response";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user, response } = await requirePermission("company:view_conversations");
    if (response) return response;

    const { id } = await params;

    const context = await prisma.conversation.findFirst({
      where: { id, companyId: user.companyId, deletedAt: null },
      select: { id: true },
    });

    if (!context) {
      return notFoundResponse("Conversa não encontrada");
    }

    const [messages, readUpdate] = await Promise.all([
      prisma.message.findMany({
        where: {
          conversationId: id,
        },
        orderBy: {
          createdAt: "asc",
        },
      }),
      prisma.conversation.updateMany({
        where: { id, companyId: user.companyId, unread: true },
        data: { unread: false },
      }),
    ]);

    // Evita publicar um evento em toda leitura. Isso impedia um ciclo de
    // EventSource -> GET -> publish -> GET na tela de conversa individual.
    if (readUpdate.count > 0) {
      publish(user.companyId, "conversation", { id });
    }

    return successResponse(messages);
  } catch (error) {
    console.error(error);

    return errorResponse("Erro interno do servidor", 500);
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user, response } = await requirePermission("company:respond_conversations");
    if (response) return response;

    const { id } = await params;

    const [context, billing] = await Promise.all([
      loadConversationContext(id, user.companyId),
      enforceBilling(user.companyId),
    ]);

    if (!context) {
      return notFoundResponse("Conversa não encontrada");
    }

    if (!billing.allowed) {
      return errorResponse(`Acesso bloqueado: ${billing.reason}`, 402);
    }

    const blocked = await guardRateLimit(request, `messages:${user.companyId}:${user.id}`);
    if (blocked) {
      return blocked;
    }

    const body = await request.json();

    if (!body.content || typeof body.content !== "string") {
      return errorResponse("Mensagem inválida", 400);
    }

    const handled = Boolean(context.handledById);

    let reply: string;

    if (handled) {
      reply = body.content;

      await prisma.message.create({
        data: {
          conversationId: id,
          role: "assistant",
          content: reply,
        },
      });
    } else {
      if (!context.company.aiConfig) {
        return errorResponse("Configuração da IA não encontrada", 400);
      }

      const result = await generateAIResponse({
        conversationId: id,
        message: body.content,
        company: context.company,
        knownName: context.knownName,
      });

      reply = result.response;
    }

    await prisma.conversation.update({
      where: { id },
      data: {
        lastMessage: reply,
        lastMessageAt: new Date(),
        unread: false,
      },
    });

    if (context.phone) {
      await deliverWhatsAppMessage(user.companyId, context.phone, reply);
    }

    publish(user.companyId, "message", {
      conversationId: id,
      role: "assistant",
      content: reply,
    });
    publish(user.companyId, "conversation", { id });

    return successResponse({
      role: "assistant",
      content: reply,
      type: "text",
      conversationId: id,
      handled,
    });
  } catch (error) {
    logAIError(error, { action: "message_route" });
    const aiError = classifyAIError(error);
    return errorResponse(aiError.userMessage, 500);
  }
}
