import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requirePermission } from "@/lib/auth/api-guard";
import { errorResponse, notFoundResponse, successResponse } from "@/lib/auth/api-response";
import { createLog } from "@/lib/logger";

const deletionSchema = z.object({ clientId: z.string().min(1).max(255) }).strict();

export async function POST(request: NextRequest) {
  try {
    const { user, response } = await requirePermission("company:manage_clients");
    if (response) return response;

    const parsed = deletionSchema.safeParse(await request.json());
    if (!parsed.success) return errorResponse("Informe o titular que deve ser anonimizado", 400);

    const client = await prisma.client.findFirst({
      where: { id: parsed.data.clientId, companyId: user.companyId, deletedAt: null },
      select: { id: true },
    });
    if (!client) return notFoundResponse("Titular nao encontrado");

    const anonymizedPhone = `deleted-${client.id}`;
    const [messages, appointments, conversations] = await prisma.$transaction([
      prisma.message.updateMany({
        where: { conversation: { clientId: client.id, companyId: user.companyId } },
        data: { content: "[conteudo removido por solicitacao do titular]" },
      }),
      prisma.appointment.updateMany({
        where: { clientId: client.id, companyId: user.companyId },
        data: { name: "Titular anonimizado", deletedAt: new Date() },
      }),
      prisma.conversation.updateMany({
        where: { clientId: client.id, companyId: user.companyId },
        data: {
          name: "Titular anonimizado",
          phone: anonymizedPhone,
          state: {},
          lastMessage: null,
          deletedAt: new Date(),
        },
      }),
      prisma.client.update({
        where: { id: client.id },
        data: {
          name: "Titular anonimizado",
          phone: anonymizedPhone,
          email: null,
          whatsappName: null,
          lastService: null,
          notes: null,
          deletedAt: new Date(),
        },
      }),
    ]);

    await createLog({
      action: "DATA_DELETE",
      entity: "client",
      entityId: client.id,
      description: "Solicitacao individual de anonimização LGPD concluida",
      companyId: user.companyId,
      userId: user.id,
    });

    return successResponse({
      message: "Dados do titular anonimizados",
      affected: {
        messages: messages.count,
        appointments: appointments.count,
        conversations: conversations.count,
      },
    });
  } catch {
    return errorResponse("Erro interno do servidor", 500);
  }
}
