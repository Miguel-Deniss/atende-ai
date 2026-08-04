import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requirePermission } from "@/lib/auth/api-guard";
import {
  successResponse,
  errorResponse,
} from "@/lib/auth/api-response";


// LISTAR CONVERSAS
export async function GET() {
  try {
    const { user, response } = await requirePermission("company:view_conversations");
    if (response) return response;


    const conversations = await prisma.conversation.findMany({
      where: {
        companyId: user.companyId,
      },

      orderBy: {
        updatedAt: "desc",
      },

      include: {
        messages: {
          take: 1,
          orderBy: {
            createdAt: "desc",
          },
        },

        handledBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });


    const result = conversations.map((c) => ({
      id: c.id,
      phone: c.phone,
      name: c.name,
      status: c.status,
      unread: c.unread,
      lastMessage: c.messages[0]?.content ?? c.lastMessage,
      lastMessageAt: c.messages[0]?.createdAt.toISOString() ?? c.lastMessageAt,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
      clientId: c.clientId,
      handledBy: c.handledBy ? { id: c.handledBy.id, name: c.handledBy.name } : null,
      handledAt: c.handledAt ? c.handledAt.toISOString() : null,
    }));

    return successResponse(result);


  } catch (error) {

    console.error(error);

    return errorResponse(
      "Erro interno do servidor",
      500
    );
  }
}



// CRIAR CONVERSA
export async function POST(
  request: NextRequest
) {

  try {

    const { user, response } = await requirePermission("company:respond_conversations");
    if (response) return response;

    const body = await request.json();



    const conversation = await prisma.conversation.create({

      data: {

        companyId: user.companyId,

        phone: body.phone ?? "cliente-teste",

        name: body.name ?? null,

        status: "OPEN",

        unread: true,

      },

    });



    return successResponse(conversation);


  } catch(error) {

    console.error(error);


    return errorResponse(
      "Erro interno do servidor",
      500
    );

  }

}