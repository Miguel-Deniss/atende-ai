import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { successResponse, errorResponse, unauthorizedResponse } from "@/lib/auth/api-response";
import { createLog } from "@/lib/logger";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();

    const company = await prisma.company.findUnique({
      where: { id: user.companyId },
      select: {
        planType: true,
        subscriptionStatus: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
        trialEndsAt: true,
        createdAt: true,
      },
    });

    return successResponse(company);
  } catch {
    return errorResponse("Erro interno do servidor", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();

    const body = await request.json();
    const { planType } = body;

    if (!["STARTER", "PRO", "BUSINESS"].includes(planType)) {
      return errorResponse("Plano inválido", 400);
    }

    const previous = await prisma.company.findUnique({
      where: { id: user.companyId },
      select: { planType: true },
    });

    await prisma.company.update({
      where: { id: user.companyId },
      data: {
        planType: planType as "STARTER" | "PRO" | "BUSINESS",
        subscriptionStatus: "ACTIVE",
      },
    });

    await createLog({
      action: "PLAN_CHANGE",
      entity: "subscription",
      entityId: user.companyId,
      description: `Plano alterado: ${previous?.planType} -> ${planType}`,
      companyId: user.companyId,
      userId: user.id,
      oldValues: previous,
      newValues: { planType },
    });

    return successResponse({ message: "Plano alterado com sucesso" });
  } catch {
    return errorResponse("Erro interno do servidor", 500);
  }
}
