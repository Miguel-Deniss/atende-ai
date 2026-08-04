import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requirePermission } from "@/lib/auth/api-guard";
import {
  successResponse,
  errorResponse,
} from "@/lib/auth/api-response";
import { whatsAppConnectSchema } from "@/lib/validators/auth";
import { encrypt } from "@/lib/security/encryption";
import { hasFeature } from "@/lib/tenant/plan-limits";
import { createLog } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const { user, response } = await requirePermission("company:manage_whatsapp");
    if (response) return response;

    const company = await prisma.company.findUnique({
      where: { id: user.companyId },
      select: { planType: true },
    });
    if (!company) return errorResponse("Empresa não encontrada", 404);

    if (!hasFeature(company.planType, "whatsapp")) {
      return errorResponse(
        "Seu plano não inclui a integração com WhatsApp. Faça upgrade.",
        403
      );
    }

    const body = await request.json();
    const parsed = whatsAppConnectSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(
        "Dados inválidos",
        400,
        parsed.error.flatten().fieldErrors
      );
    }

    const { phoneNumberId, businessAccountId, accessToken, phoneNumber } =
      parsed.data;

    const config = await prisma.whatsAppConfig.upsert({
      where: { companyId: user.companyId },
      update: {
        phoneNumberId,
        businessAccountId,
        accessToken: encrypt(accessToken),
        phoneNumber,
        status: "CONNECTED",
      },
      create: {
        companyId: user.companyId,
        phoneNumberId,
        businessAccountId,
        accessToken: encrypt(accessToken),
        phoneNumber,
        status: "CONNECTED",
      },
    });

    await createLog({
      action: "WHATSAPP_CONNECT",
      entity: "whatsapp",
      entityId: config.id,
      description: `WhatsApp conectado (${phoneNumber})`,
      companyId: user.companyId,
      userId: user.id,
    });

    return successResponse({ connected: true, phoneNumber });
  } catch {
    return errorResponse("Erro interno do servidor", 500);
  }
}
