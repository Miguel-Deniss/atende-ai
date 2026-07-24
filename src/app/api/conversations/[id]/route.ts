import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  notFoundResponse,
} from "@/lib/auth/api-response";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
        messages: {
          orderBy: {
            createdAt: "asc",
          },
        },
      
        client: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            lastService: true,
            notes: true,
            status: true,
          },
        },
      },
    });

    if (!conversation) {
      return notFoundResponse("Conversa não encontrada");
    }

    if (!conversation.clientId) {

      let client = await prisma.client.findFirst({
        where: {
          phone: conversation.phone,
          companyId: user.companyId,
        },
      });
    
    
      if (!client) {
    
        client = await prisma.client.create({
          data: {
            phone: conversation.phone,
            name: conversation.name ?? "Cliente sem nome",
            companyId: user.companyId,
          },
        });
    
      }
    
    
      await prisma.conversation.update({
        where: {
          id: conversation.id,
        },
        data: {
          clientId: client.id,
        },
      });
    
    }

    return successResponse(conversation);
  } catch (error) {
    console.error(error);

    return errorResponse("Erro interno do servidor", 500);
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();

    if (!user) return unauthorizedResponse();

    const { id } = await params;

    const conversation = await prisma.conversation.findFirst({
      where: {
        id,
        companyId: user.companyId,
      },
    });

    if (!conversation) {
      return notFoundResponse("Conversa não encontrada");
    }

    const body = await request.json();

    const updated = await prisma.conversation.update({
      where: {
        id,
      },
      data: body,
    });

    return successResponse(updated);
  } catch {
    return errorResponse("Erro interno do servidor", 500);
  }
}
