import { NextRequest } from "next/server";
import { requirePermission } from "@/lib/auth/api-guard";
import {
  successResponse,
  errorResponse,
} from "@/lib/auth/api-response";
import { checkoutSchema } from "@/lib/validators/auth";
import { getPlanByCode } from "@/lib/billing/plans";
import { validateCoupon, computeDiscount } from "@/lib/billing/coupons";
import {
  createCheckoutSession,
  getOrCreateStripeCustomer,
  getMissingStripePriceIds,
  isStripeConfigured,
  StripeConfigError,
  type CheckoutResult,
} from "@/lib/billing/stripe";
import { prisma } from "@/lib/db/prisma";
import { guardRateLimit, clientIp } from "@/lib/rate-limit/with-rate-limit";

const PAID_PLANS = ["STARTER", "PRO", "BUSINESS", "ENTERPRISE"];

export async function POST(request: NextRequest) {
  try {
    const blocked = await guardRateLimit(request, `checkout:${clientIp(request)}`);
    if (blocked) {
      return blocked;
    }

    const { user, response } = await requirePermission("company:manage_billing");
    if (response) return response;

    const body = await request.json();
    const parsed = checkoutSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse("Dados inválidos", 400, parsed.error.flatten().fieldErrors);
    }

    const planCode = parsed.data.planCode.toUpperCase();

    if (!PAID_PLANS.includes(planCode)) {
      return errorResponse("Plano inválido para assinatura", 400);
    }

    const plan = await getPlanByCode(planCode);
    if (!plan) {
      return errorResponse("Plano não encontrado", 404);
    }

    if (!isStripeConfigured()) {
      return errorResponse(
        "Os pagamentos ainda não estão configurados. Tente novamente em instantes.",
        503
      );
    }

    const missingPrices = getMissingStripePriceIds();
    if (
      missingPrices.length > 0 &&
      missingPrices.includes(planCode)
    ) {
      return errorResponse(
        `Checkout indisponível: falta configurar o Preço (Price ID) do plano ${planCode}.`,
        503
      );
    }

    let couponInfo: Awaited<ReturnType<typeof validateCoupon>>["coupon"];

    if (parsed.data.couponCode) {
      const couponValidation = await validateCoupon(
        parsed.data.couponCode,
        plan.code
      );
      if (!couponValidation.valid) {
        return errorResponse(couponValidation.reason ?? "Cupom inválido", 400);
      }
      couponInfo = couponValidation.coupon;
    }

    const discount = couponInfo
      ? computeDiscount(
          plan.price,
          couponInfo.discountType,
          couponInfo.discountValue
        )
      : 0;

    const amount = Math.max(0, plan.price - discount);

    const admin = await prisma.user.findFirst({
      where: { companyId: user!.companyId, role: "ADMIN", deletedAt: null },
      orderBy: { createdAt: "asc" },
    });

    const company = await prisma.company.findUnique({
      where: { id: user!.companyId },
      select: { name: true, stripeCustomerId: true },
    });

    let customerId = company?.stripeCustomerId ?? null;

    if (!customerId) {
      const customer = await getOrCreateStripeCustomer({
        companyId: user!.companyId,
        email: admin?.email ?? user!.email,
        name: company?.name ?? "Cliente AtendeAI",
      });
      customerId = customer.id;

      await prisma.company.update({
        where: { id: user!.companyId },
        data: { stripeCustomerId: customer.id },
      });
    }

    let checkout: CheckoutResult;
    try {
      checkout = await createCheckoutSession({
        companyId: user!.companyId,
        customerId,
        planCode: plan.code,
        amount,
        couponCode: parsed.data.couponCode,
        successUrl: `${process.env.APP_URL ?? "http://localhost:3000"}/dashboard/subscription?checkout=success`,
        cancelUrl: `${process.env.APP_URL ?? "http://localhost:3000"}/dashboard/subscription?checkout=cancel`,
        email: admin?.email ?? user!.email,
        companyName: company?.name ?? "Cliente AtendeAI",
      });
    } catch (error) {
      if (error instanceof StripeConfigError) {
        return errorResponse(error.message, 503);
      }
      console.error(error);
      return errorResponse("Falha ao criar o checkout no Stripe. Tente novamente.", 502);
    }

    return successResponse({
      mode: "stripe",
      url: checkout.url,
      checkoutSessionId: checkout.checkoutSessionId,
      amount,
    });
  } catch (error) {
    console.error(error);
    return errorResponse("Erro interno do servidor", 500);
  }
}