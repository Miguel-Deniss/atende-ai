import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requirePermission } from "@/lib/auth/api-guard";
import {
  successResponse,
  errorResponse,
} from "@/lib/auth/api-response";
import { createLog } from "@/lib/logger";
import { dataExportScopeSchema } from "@/lib/validators/auth";

export async function POST(request: NextRequest) {
  try {
    const { user, response } = await requirePermission("company:export_data");
    if (response) return response;

    const body = await request.json().catch(() => ({}));
    const parsed = dataExportScopeSchema.safeParse(body ?? {});
    const scope = parsed.success ? parsed.data.scope ?? "all" : "all";

    const companyId = user!.companyId;

    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: {
        name: true,
        slug: true,
        document: true,
        phone: true,
        address: true,
        hours: true,
        planType: true,
        subscriptionStatus: true,
        createdAt: true,
      },
    });

    const payload: Record<string, unknown> = {
      exportedAt: new Date().toISOString(),
      scope,
      company,
    };

    if (scope === "all" || scope === "clients") {
      payload.clients = await prisma.client.findMany({
        where: { companyId, deletedAt: null },
      });
    }

    if (scope === "all" || scope === "appointments") {
      payload.appointments = await prisma.appointment.findMany({
        where: { companyId, deletedAt: null },
      });
    }

    if (scope === "all" || scope === "conversations") {
      payload.conversations = await prisma.conversation.findMany({
        where: { companyId, deletedAt: null },
        include: { messages: true },
      });
    }

    if (scope === "all") {
      payload.users = await prisma.user.findMany({
        where: { companyId, deletedAt: null },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          phone: true,
          createdAt: true,
        },
      });
      payload.settings = await prisma.companySettings.findUnique({
        where: { companyId },
      });
      payload.aiConfig = await prisma.aIConfig.findUnique({
        where: { companyId },
        include: { services: true, faq: true },
      });
      payload.auditLogs = await prisma.auditLog.findMany({
        where: { companyId },
        take: 200,
        orderBy: { createdAt: "desc" },
      });
    }

    await createLog({
      action: "DATA_EXPORT",
      entity: "company",
      entityId: companyId,
      description: `Exportação de dados (LGPD) solicitada — escopo: ${scope}`,
      companyId,
      userId: user!.id,
    });

    return successResponse({
      message: "Exportação gerada",
      data: payload,
    });
  } catch (error) {
    console.error(error);
    return errorResponse("Erro interno do servidor", 500);
  }
}
