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

    return errorResponse(
      "Erro interno do servidor",
      500
    );
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
      return errorResponse(
        "Configuração da IA não encontrada",
        400
      );
    }



    const body = await request.json();


    if (!body.content || typeof body.content !== "string") {
      return errorResponse(
        "Mensagem inválida",
        400
      );
    }



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

    console.log(
      "AI CONFIG:",
      conversation.company.aiConfig
    );

    const aiResponse = await generateAIResponse(

      history.map((message) => ({
        role:
          message.role === "assistant"
            ? "assistant"
            : "user",

        content: message.content,
      })),

      {

        name: conversation.company.name,

        phone: conversation.company.phone,

        address: conversation.company.address,

        hours: conversation.company.hours,

        welcomeMessage:
          conversation.company.welcomeMessage,


        aiConfig: {

          personality:
            conversation.company.aiConfig.personality,

          instructions:
            conversation.company.aiConfig.instructions,


          services:
            conversation.company.aiConfig.services.map(
              (service) => ({
                name: service.name,
                price: service.price,
              })
            ),


          faq:
            conversation.company.aiConfig.faq.map(
              (item) => ({
                question: item.question,
                answer: item.answer,
              })
            ),

        },

      }
    );



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


    return errorResponse(
      "Erro interno do servidor",
      500
    );

  }
}