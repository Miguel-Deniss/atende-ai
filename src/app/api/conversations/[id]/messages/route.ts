import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { generateAIResponse } from "@/lib/ai/assistant";

import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  notFoundResponse,
} from "@/lib/auth/api-response";

function isGarbageResponse(content: string): boolean {
  const garbagePatterns = [
    /sou um modelo de linguagem/i,
    /como uma ia/i,
    /como modelo de linguagem/i,
    /treinado por pesquisadores/i,
    /não tenho consciência/i,
    /não tenho sentimentos/i,
    /meta/i,
    /llama/i,
  ];
  return garbagePatterns.some((p) => p.test(content));
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();

    if (!user) return unauthorizedResponse();

    const { id } = await params;

    const conversation = await prisma.conversation.findFirst({
      where: {
        id,
        companyId: user.companyId,
      },
      include: {
        company: {
          include: {
            aiConfig: {
              include: {
                services: true,
                faq: true,
              },
            },
          },
        },
      },
    });

    if (!conversation) {
      return notFoundResponse("Conversa não encontrada");
    }

    const messages = await prisma.message.findMany({
      where: {
        conversationId: id,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return successResponse(messages);
  } catch (error) {
    console.error(error);

    return errorResponse("Erro interno do servidor", 500);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();

    if (!user) return unauthorizedResponse();

    const { id } = await params;

    const conversation = await prisma.conversation.findFirst({
      where: {
        id,
        companyId: user.companyId,
      },
      include: {
        company: {
          include: {
            aiConfig: {
              include: {
                services: true,
                faq: true,
              },
            },
          },
        },
      },
    });

    if (!conversation) {
      return notFoundResponse("Conversa não encontrada");
    }

    if (!conversation.company.aiConfig) {
      return errorResponse("Configuração da IA não encontrada", 400);
    }

    const body = await request.json();

    if (!body.content || typeof body.content !== "string") {
      return errorResponse("Mensagem inválida", 400);
    }

    console.log("====================================");
    console.log("NOVA MENSAGEM DO USUÁRIO:");
    console.log(body.content);
    console.log("====================================");

    await prisma.message.create({
      data: {
        role: "user",
        content: body.content,
        conversationId: id,
      },
    });

    const history = await prisma.message.findMany({
      where: {
        conversationId: id,
      },
      orderBy: {
        createdAt: "asc",
      },
      take: 20,
    });

    console.log("========== HISTORY ==========");
    console.log(
      history.map((m, index) => ({
        index,
        role: m.role,
        content: m.content,
      }))
    );
    console.log("=============================");

    const cleanHistory = history.map((m) => {
      if (m.role === "assistant" && isGarbageResponse(m.content)) {
        return {
          role: "assistant" as const,
          content: "[Mensagem do assistente filtrada por não atender aos padrões de qualidade]",
        };
      }
      return {
        role: (m.role === "assistant" ? "assistant" : "user") as "user" | "assistant",
        content: m.content,
      };
    });

    console.log("========== CLEAN HISTORY ==========");
    console.log(cleanHistory);
    console.log("===================================");

    console.log("ÚLTIMA MENSAGEM:");
    console.log(cleanHistory.at(-1));

    console.log("PENÚLTIMA MENSAGEM:");
    console.log(cleanHistory.at(-2));

    console.log("TOTAL:", cleanHistory.length);

    console.log("AI CONFIG:");
    console.log(conversation.company.aiConfig);

    console.log("ANTES DA IA", Date.now());

    const aiResponse = await generateAIResponse(cleanHistory, {
      name: conversation.company.name,
      phone: conversation.company.phone,
      address: conversation.company.address,
      hours: conversation.company.hours,
      welcomeMessage: conversation.company.welcomeMessage,

      aiConfig: {
        personality: conversation.company.aiConfig.personality,
        instructions: conversation.company.aiConfig.instructions,

        services:
          conversation.company.aiConfig.services.map((service) => ({
            name: service.name,
            price: service.price,
          })),

        faq:
          conversation.company.aiConfig.faq.map((item) => ({
            question: item.question,
            answer: item.answer,
          })),
      },
    });

    console.log("========== IA ==========");
    console.log(aiResponse);
    console.log("========================");

    console.log("DEPOIS DA IA", Date.now());

    if (isGarbageResponse(aiResponse)) {
      console.error("IA RETORNOU LIXO:");
      console.error(aiResponse);

      return errorResponse(
        "A IA gerou resposta inválida. Tente novamente.",
        500
      );
    }

    const assistantMessage = await prisma.message.create({
      data: {
        role: "assistant",
        content: aiResponse,
        type: "text",
        conversationId: id,
      },
    });

    return successResponse(assistantMessage);
  } catch (error) {
    console.error(error);

    return errorResponse("Erro interno do servidor", 500);
  }
}
