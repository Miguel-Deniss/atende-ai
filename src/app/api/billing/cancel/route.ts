import { NextRequest } from "next/server";
import { requirePermission } from "@/lib/auth/api-guard";
import { successResponse, errorResponse } from "@/lib/auth/api-response";
import { cancelStripeSubscription, isStripeConfigured } from "@/lib/billing/stripe";
import { updateSubscriptionStatus } from "@/lib/billing/subscription";
import { prisma } from "@/lib/db/prisma";
import { createLog } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const { user, response } = await requirePermission("company:manage_billing");
    if (response) return response;

    const company = await prisma.company.findUnique({
      where: { id: user!.companyId },
      select: {
        stripeSubscriptionId: true,
        subscriptionStatus: true,
        planType: true,
      },
    });

    if (!company) {
      return errorResponse("Empresa não encontrada.", 404);
    }

    if (company.subscriptionStatus === "CANCELED") {
      return errorResponse("A assinatura já está cancelada.", 400);
    }

    if (company.subscriptionStatus !== "ACTIVE" && company.subscriptionStatus !== "TRIALING") {
      return errorResponse("Nenhuma assinatura ativa encontrada para cancelamento.", 400);
    }

    const stripeEnabled = isStripeConfigured() && Boolean(company.stripeSubscriptionId);

    if (stripeEnabled) {
      await cancelStripeSubscription(company.stripeSubscriptionId!);
    }

    await prisma.subscription.updateMany({
      where: { companyId: user!.companyId },
      data: { canceledAt: new Date() },
    });

    await updateSubscriptionStatus({
      companyId: user!.companyId,
      status: stripeEnabled ? "ACTIVE" : "CANCELED",
      canceledAt: new Date(),
      logAction: "SUBSCRIPTION_CANCEL",
      userId: user!.id,
      description: stripeEnabled
        ? "Cancelamento agendado no Stripe (válido até o fim do ciclo)"
        : "Assinatura cancelada (modo demonstração)",
    });

    await createLog({
      action: "SUBSCRIPTION_CANCEL",
      entity: "subscription",
      entityId: user!.companyId,
      description: `Cancelamento de assinatura solicitado pelo administrador. Plano: ${company.planType}`,
      companyId: user!.companyId,
      userId: user!.id,
      oldValues: { subscriptionStatus: company.subscriptionStatus },
      newValues: { subscriptionStatus: "CANCELED" },
    });

    return successResponse({
      message: stripeEnabled
        ? "Cancelamento agendado. A assinatura permanece ativa até o fim do ciclo atual."
        : "Assinatura cancelada com sucesso.",
      cancelAtPeriodEnd: stripeEnabled,
    });
  } catch (error) {
    console.error(error);
    return errorResponse("Erro interno do servidor", 500);
  }
}
