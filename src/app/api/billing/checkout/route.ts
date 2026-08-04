import { NextRequest } from "next/server";
import { requirePermission } from "@/lib/auth/api-guard";
import {
  successResponse,
  errorResponse,
} from "@/lib/auth/api-response";
import { checkoutSchema } from "@/lib/validators/auth";
import { getPlanByCode } from "@/lib/billing/plans";
import {
  validateCoupon,
  computeDiscount,
  incrementCouponUsage,
} from "@/lib/billing/coupons";
import {
  createOrUpdateSubscription,
  recordBilling,
} from "@/lib/billing/subscription";
import {
  createCheckoutSession,
  getOrCreateStripeCustomer,
  isStripeConfigured,
} from "@/lib/billing/stripe";
import { prisma } from "@/lib/db/prisma";
import { guardRateLimit, clientIp } from "@/lib/rate-limit/with-rate-limit";

const PAID_PLANS = ["STARTER", "PRO", "BUSINESS", "ENTERPRISE"];

export async function POST(request: NextRequest) {
  try {
    const blocked = guardRateLimit(request, `checkout:${clientIp(request)}`);
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

    if (!isStripeConfigured()) {
      const status = "ACTIVE";

      if (couponInfo) {
        await incrementCouponUsage(couponInfo.id);
      }

      const subscription = await createOrUpdateSubscription({
        companyId: user!.companyId,
        planId: plan.id,
        planCode: plan.code,
        status,
        couponId: couponInfo?.id ?? null,
        trialDays: plan.trialDays,
        amount,
        userId: user!.id,
        logAction: amount === 0 ? "SUBSCRIPTION_CREATED" : "SUBSCRIPTION_UPGRADE",
        description: `Assinatura ativada (modo demonstração): ${plan.name}`,
      });

      await recordBilling({
        companyId: user!.companyId,
        subscriptionId: subscription.subscription.id,
        action: "PAYMENT_SUCCESS",
        amount,
        status: "paid",
        description:
          amount === 0
            ? "Pagamento não requerido (valor zero / cupom integral)"
            : `Pagamento simulado aprovado: ${plan.name}`,
        userId: user!.id,
        metadata: { mode: "demo", coupon: couponInfo?.code, discount },
      });

      return successResponse({
        mode: "demo",
        amount,
        discount,
        status: subscription.subscription.status,
        nextBillingDate: subscription.subscription.nextBillingDate,
        planCode: plan.code,
      });
    }

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

    const checkout = await createCheckoutSession({
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

    const subscription = await createOrUpdateSubscription({
      companyId: user!.companyId,
      planId: plan.id,
      planCode: plan.code,
      status: "INCOMPLETE",
      couponId: couponInfo?.id ?? null,
      trialDays: plan.trialDays,
      amount,
      userId: user!.id,
      description: `Checkout iniciado: ${plan.name}`,
      stripeCustomerId: customerId,
    });

    return successResponse({
      mode: "stripe",
      url: checkout.url,
      checkoutSessionId: checkout.checkoutSessionId,
      amount,
      status: subscription.subscription.status,
    });
  } catch (error) {
    console.error(error);
    return errorResponse("Erro interno do servidor", 500);
  }
}

