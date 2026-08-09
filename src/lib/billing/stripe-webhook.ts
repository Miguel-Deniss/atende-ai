import { prisma } from "@/lib/db/prisma";
import { createLog, logSystemEvent } from "@/lib/logger";
import { getPlanByCode } from "@/lib/billing/plans";
import {
  createOrUpdateSubscription,
  recordBilling,
  updateSubscriptionStatus,
} from "@/lib/billing/subscription";
import { mapPriceIdToPlan } from "@/lib/billing/stripe";
import { incrementCouponUsage } from "@/lib/billing/coupons";
import { sendInvoiceEmail } from "@/lib/email";

interface StripeEventObject {
  id?: string;
  [key: string]: unknown;
}

export type StripeEvent = {
  id: string;
  type: string;
  data: { object: StripeEventObject };
};

const appUrl = () => process.env.APP_URL ?? "http://localhost:3000";

async function markProcessed(eventId: string, type: string, status: "processed" | "failed", error?: string) {
  await prisma.webhookEvent.updateMany({
    where: { signature: eventId, provider: "stripe" },
    data: { status, error, processedAt: new Date() },
  });
}

async function claimEvent(event: StripeEvent): Promise<boolean> {
  const existing = await prisma.webhookEvent.findFirst({
    where: { provider: "stripe", signature: event.id },
    select: { status: true },
  });

  if (existing?.status === "processed" || existing?.status === "processing") {
    return false;
  }

  await prisma.webhookEvent.upsert({
    where: {
      provider_signature: { provider: "stripe", signature: event.id },
    },
    update: {},
    create: {
      provider: "stripe",
      event: event.type,
      signature: event.id,
      payload: event as unknown as object,
      status: "received",
    },
  });

  await prisma.webhookEvent.updateMany({
    where: { provider: "stripe", signature: event.id, status: "failed" },
    data: { status: "received", error: null, processedAt: null },
  });

  const claimed = await prisma.webhookEvent.updateMany({
    where: { provider: "stripe", signature: event.id, status: "received" },
    data: { status: "processing" },
  });

  return claimed.count > 0;
}

export async function processStripeEvent(event: StripeEvent): Promise<"processed" | "skipped"> {
  const claimed = await claimEvent(event);
  if (!claimed) {
    return "skipped";
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object);
        break;
      case "customer.subscription.created":
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object);
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object);
        break;
      case "invoice.paid":
        await handleInvoicePaid(event.data.object);
        break;
      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event.data.object);
        break;
      default:
        await markProcessed(event.id, event.type, "processed");
        return "processed";
    }

    await markProcessed(event.id, event.type, "processed");
    return "processed";
  } catch (error) {
    await markProcessed(event.id, event.type, "failed", error instanceof Error ? error.message : String(error));
    await logSystemEvent({
      action: "WEBHOOK_FAILED",
      entity: "webhook",
      entityId: event.id,
      description: `Falha ao processar evento Stripe ${event.type}`,
    });
    throw error;
  }
}

async function handleCheckoutCompleted(session: StripeEventObject) {
  const metadata = (session.metadata as Record<string, string> | undefined) ?? {};
  const customerId = session.customer as string | undefined;
  const subscriptionId = session.subscription as string | undefined;
  const planCode = metadata.planCode ?? null;

  let company = null;

  if (metadata.companyId) {
    company = await prisma.company.findUnique({ where: { id: metadata.companyId } });
  }

  if (!company && customerId) {
    company = await prisma.company.findFirst({
      where: { stripeCustomerId: customerId },
    });
  }

  if (!company) return;

  const resolvedPlan = planCode ?? company.planType;
  const plan = await getPlanByCode(resolvedPlan as string);
  if (!plan) return;

  await createOrUpdateSubscription({
    companyId: company.id,
    planId: plan.id,
    planCode: plan.code,
    status: "ACTIVE",
    amount: plan.price,
    stripeCustomerId: customerId ?? company.stripeCustomerId ?? undefined,
    stripeSubscriptionId: subscriptionId,
    logAction: "SUBSCRIPTION_CREATED",
    description: `Checkout concluído: ${plan.name}`,
  });

  if (metadata.couponCode) {
    const coupon = await prisma.coupon.findUnique({
      where: { code: metadata.couponCode.toUpperCase() },
    });
    if (coupon) {
      await incrementCouponUsage(coupon.id);
    }
  }
}

async function handleSubscriptionUpdated(subscription: StripeEventObject) {
  const stripeSubscriptionId = subscription.id as string | undefined;
  const rawStatus = subscription.status as string | undefined;
  const priceId =
    (subscription.items as { data?: { price?: { id?: string } }[] } | undefined)
      ?.data?.[0]?.price?.id;

  if (!stripeSubscriptionId) return;

  const company = await prisma.company.findFirst({
    where: { stripeSubscriptionId },
  });
  if (!company) return;

  const dbStatus = mapStripeStatus(rawStatus);
  const planCode = priceId ? mapPriceIdToPlan(priceId) : null;
  const currentPeriodEnd = subscription.current_period_end as number | undefined;
  const currentPeriodStart = subscription.current_period_start as number | undefined;
  const cancelAtPeriodEnd = subscription.cancel_at_period_end as boolean | undefined;

  const canPromote = dbStatus === "ACTIVE" || dbStatus === "TRIALING";
  const selectedPlan = canPromote && planCode ? await getPlanByCode(planCode) : null;

  const updates: Parameters<typeof updateSubscriptionStatus>[0] = {
    companyId: company.id,
    status: dbStatus,
    ...(selectedPlan
      ? { planId: selectedPlan.id, planCode: selectedPlan.code }
      : {}),
    logAction:
      dbStatus === "PAST_DUE"
        ? "PAYMENT_FAILURE"
        : cancelAtPeriodEnd
          ? "SUBSCRIPTION_CANCEL"
          : "SUBSCRIPTION_RENEWED",
    description: `Assinatura Stripe atualizada: ${dbStatus}`,
  };

  if (currentPeriodEnd) {
    updates.nextBillingDate = new Date(currentPeriodEnd * 1000);
  }
  if (currentPeriodStart) {
    updates.expiresAt = new Date(currentPeriodEnd ? currentPeriodEnd * 1000 : currentPeriodStart * 1000);
  }
  if (cancelAtPeriodEnd && dbStatus === "ACTIVE") {
    updates.canceledAt = new Date(currentPeriodEnd ? currentPeriodEnd * 1000 : Date.now());
  }

  await updateSubscriptionStatus(updates);

  if (canPromote && planCode && planCode !== company.planType) {
    await prisma.company.update({
      where: { id: company.id },
      data: { planType: planCode as never },
    });
  }
}

async function handleSubscriptionDeleted(subscription: StripeEventObject) {
  const stripeSubscriptionId = subscription.id as string | undefined;
  if (!stripeSubscriptionId) return;

  const company = await prisma.company.findFirst({
    where: { stripeSubscriptionId },
  });
  if (!company) return;

  await updateSubscriptionStatus({
    companyId: company.id,
    status: "CANCELED",
    canceledAt: new Date(),
    logAction: "SUBSCRIPTION_CANCEL",
    description: "Assinatura cancelada no Stripe",
  });
}

async function handleInvoicePaid(invoice: StripeEventObject) {
  const stripeSubscriptionId = invoice.subscription as string | undefined;
  if (!stripeSubscriptionId) return;

  const company = await prisma.company.findFirst({
    where: { stripeSubscriptionId },
  });
  if (!company) return;

  const amount = Math.round((invoice.amount_paid as number) ?? 0);
  const currency = ((invoice.currency as string) ?? "brl").toUpperCase();
  const periodEnd = invoice.period_end as number | undefined;

  await prisma.subscription.updateMany({
    where: { companyId: company.id },
    data: {
      status: "ACTIVE",
      nextBillingDate: periodEnd ? new Date(periodEnd * 1000) : new Date(),
    },
  });

  await prisma.company.update({
    where: { id: company.id },
    data: { subscriptionStatus: "ACTIVE" },
  });

  await recordBilling({
    companyId: company.id,
    action: "PAYMENT_SUCCESS",
    amount,
    currency,
    status: "paid",
    description: `Pagamento recebido: R$ ${(amount / 100).toFixed(2)}`,
    metadata: { stripeInvoiceId: invoice.id, source: "stripe" },
  });

  const plan = await getPlanByCode(company.planType);
  const admin = await prisma.user.findFirst({
    where: { companyId: company.id, role: "ADMIN", deletedAt: null },
    orderBy: { createdAt: "asc" },
  });

  if (admin) {
    try {
      await sendInvoiceEmail({
        to: admin.email,
        invoiceUrl: (invoice.hosted_invoice_url as string) ?? `${appUrl()}/dashboard/subscription`,
        companyName: company.name,
        planName: plan?.name ?? company.planType,
        amount: `R$ ${(amount / 100).toFixed(2)}`,
        dueDate: periodEnd
          ? new Date(periodEnd * 1000).toLocaleDateString("pt-BR")
          : new Date().toLocaleDateString("pt-BR"),
        invoiceNumber: (invoice.number as string) ?? `#${invoice.id?.slice(-8)}`,
        companyId: company.id,
      });
    } catch {
      await createLog({
        action: "EMAIL_FAILED",
        entity: "email",
        entityId: admin.email,
        description: "Falha ao enviar fatura por e-mail",
        companyId: company.id,
        userId: admin.id,
      });
    }
  }
}

async function handleInvoicePaymentFailed(invoice: StripeEventObject) {
  const stripeSubscriptionId = invoice.subscription as string | undefined;
  if (!stripeSubscriptionId) return;

  const company = await prisma.company.findFirst({
    where: { stripeSubscriptionId },
  });
  if (!company) return;

  const amount = Math.round((invoice.amount_due as number) ?? 0);
  const currency = ((invoice.currency as string) ?? "brl").toUpperCase();

  await updateSubscriptionStatus({
    companyId: company.id,
    status: "PAST_DUE",
    logAction: "PAYMENT_FAILURE",
    description: "Pagamento falhou. Assinatura pendente.",
  });

  await recordBilling({
    companyId: company.id,
    action: "PAYMENT_FAILURE",
    amount,
    currency,
    status: "failed",
    description: `Falha no pagamento: R$ ${(amount / 100).toFixed(2)}`,
    metadata: { stripeInvoiceId: invoice.id, source: "stripe" },
  });
}

function mapStripeStatus(
  status: string | undefined
): "ACTIVE" | "PAST_DUE" | "CANCELED" | "INCOMPLETE" | "TRIALING" {
  const map: Record<string, "ACTIVE" | "PAST_DUE" | "CANCELED" | "INCOMPLETE" | "TRIALING"> = {
    active: "ACTIVE",
    past_due: "PAST_DUE",
    canceled: "CANCELED",
    unpaid: "PAST_DUE",
    incomplete: "INCOMPLETE",
    incomplete_expired: "INCOMPLETE",
    trialing: "TRIALING",
    paused: "PAST_DUE",
  };
  return map[status ?? ""] ?? "INCOMPLETE";
}
