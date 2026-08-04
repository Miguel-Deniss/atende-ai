import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requirePermission } from "@/lib/auth/api-guard";
import {
  successResponse,
  errorResponse,
} from "@/lib/auth/api-response";
import { createLog } from "@/lib/logger";

const ANONYMIZED_NAME = "Usuário removido (LGPD)";

export async function POST(request: NextRequest) {
  try {
    const { user, response } = await requirePermission("company:export_data");
    if (response) return response;

    const companyId = user!.companyId;

    const [clientResult, appointmentResult, conversationResult] =
      await Promise.all([
        prisma.client.updateMany({
          where: { companyId, deletedAt: null },
          data: {
            name: ANONYMIZED_NAME,
            phone: "(removido)",
            email: null,
            whatsappName: null,
            notes: null,
          },
        }),
        prisma.appointment.updateMany({
          where: { companyId, deletedAt: null },
          data: { name: ANONYMIZED_NAME },
        }),
        prisma.conversation.updateMany({
          where: { companyId, deletedAt: null },
          data: {
            phone: "(removido)",
            name: ANONYMIZED_NAME,
            deletedAt: new Date(),
          },
        }),
      ]);

    await createLog({
      action: "DATA_DELETE",
      entity: "company",
      entityId: companyId,
      description:
        "Exclusão de dados pessoais (LGPD) executada — clientes, agendamentos e conversas anonimizados",
      companyId,
      userId: user!.id,
    });

    return successResponse({
      message: "Dados pessoais anonimizados",
      affected: {
        clients: clientResult.count,
        appointments: appointmentResult.count,
        conversations: conversationResult.count,
      },
    });
  } catch (error) {
    console.error(error);
    return errorResponse("Erro interno do servidor", 500);
  }
}
