import { NextRequest } from "next/server";
import { requirePermission } from "@/lib/auth/api-guard";
import { successResponse, errorResponse } from "@/lib/auth/api-response";
import { createBillingPortalSession, isStripeConfigured } from "@/lib/billing/stripe";
import { prisma } from "@/lib/db/prisma";

export async function POST(request: NextRequest) {
  try {
    const { user, response } = await requirePermission("company:manage_billing");
    if (response) return response;

    if (!isStripeConfigured()) {
      return errorResponse(
        "O portal de pagamento está disponível apenas com Stripe configurado.",
        400
      );
    }

    const company = await prisma.company.findUnique({
      where: { id: user!.companyId },
      select: { stripeCustomerId: true },
    });

    if (!company?.stripeCustomerId) {
      return errorResponse(
        "Nenhuma forma de pagamento vinculada. Assine um plano para ativar o portal.",
        400
      );
    }

    const returnUrl = `${process.env.APP_URL ?? "http://localhost:3000"}/dashboard/subscription`;
    const url = await createBillingPortalSession({
      customerId: company.stripeCustomerId,
      returnUrl,
    });

    return successResponse({ url });
  } catch (error) {
    console.error(error);
    return errorResponse("Erro interno do servidor", 500);
  }
}
