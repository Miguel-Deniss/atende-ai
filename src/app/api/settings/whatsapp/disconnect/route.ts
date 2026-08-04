import { prisma } from "@/lib/db/prisma";
import { requirePermission } from "@/lib/auth/api-guard";
import {
  successResponse,
  errorResponse,
} from "@/lib/auth/api-response";
import { createLog } from "@/lib/logger";

export async function POST() {
  try {
    const { user, response } = await requirePermission("company:manage_whatsapp");
    if (response) return response;

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
