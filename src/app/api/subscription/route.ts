import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { successResponse, errorResponse, unauthorizedResponse } from "@/lib/auth/api-response";
import { getCompanyBilling } from "@/lib/billing/subscription";
import { getPlanByCode } from "@/lib/billing/plans";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();

    const billing = await getCompanyBilling(user.companyId);

    const plan = await getPlanByCode(billing.planType);
    const company = await prisma.company.findUnique({
      where: { id: user.companyId },
      select: {
        stripeCustomerId: true,
        stripeSubscriptionId: true,
        createdAt: true,
      },
    });

    return successResponse({
      ...billing,
      price: plan?.price ?? 0,
      planName: plan?.name ?? billing.planType,
      features: plan?.features ?? [],
      stripeCustomerId: company?.stripeCustomerId ?? null,
      stripeSubscriptionId: company?.stripeSubscriptionId ?? null,
      createdAt: company?.createdAt,
    });
  } catch {
    return errorResponse("Erro interno do servidor", 500);
  }
}

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();

    return errorResponse(
      "Alteração de plano deve ser feita pelo fluxo de checkout em /api/billing/checkout.",
      409
    );
  } catch {
    return errorResponse("Erro interno do servidor", 500);
  }
}
