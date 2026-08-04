import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
} from "@/lib/auth/api-response";
import { createLog } from "@/lib/logger";

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();

    const updated = await prisma.whatsAppConfig.updateMany({
      where: { companyId: user.companyId },
      data: { status: "DISCONNECTED" },
    });

    await createLog({
      action: "WHATSAPP_DISCONNECT",
      entity: "whatsapp",
      description:
        updated.count > 0
          ? "WhatsApp desconectado"
          : "Tentativa de desconexão sem configuração ativa",
      companyId: user.companyId,
      userId: user.id,
    });

    return successResponse({ connected: false });
  } catch {
    return errorResponse("Erro interno do servidor", 500);
  }
}
