import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { errorResponse } from "@/lib/auth/api-response";
import { createLog } from "@/lib/logger";
import { getPlanByCode } from "@/lib/billing/plans";
import { recordBilling } from "@/lib/billing/subscription";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      await createLog({
        action: "WEBHOOK_FAILED",
        entity: "webhook",
        description: "Webhook Stripe recebido sem assinatura",
        companyId: "system",
      });
      return errorResponse("Missing signature", 400);
    }

    let event: { type: string; data: { object: Record<string, unknown> } };

    try {
      const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      await createLog({
        action: "WEBHOOK_FAILED",
        entity: "webhook",
        description: `Assinatura do webhook Stripe inválida`,
        companyId: "system",
      });
      return errorResponse("Invalid signature", 400);
    }

    const session = event.data.object;

    switch (event.type) {
      case "checkout.session.completed": {
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;
        const metadata = (session as any).metadata ?? {};
        const priceId = metadata.price_id ?? metadata.priceId;
        const planCode = metadata.planCode ?? mapPriceIdToPlan(priceId);

        const company = await prisma.company.findFirst({
          where: { stripeCustomerId: customerId },
        });

        if (company) {
          await prisma.company.update({
            where: { id: company.id },
            data: {
              stripeSubscriptionId: subscriptionId,
              subscriptionStatus: "ACTIVE",
              planType: planCode as never,
            },
          });

          await syncSubscriptionRow({
            companyId: company.id,
            planCode,
            status: "ACTIVE",
            amount: metadata.amount ? Number(metadata.amount) : 0,
            action: "SUBSCRIPTION_CREATED",
            description: `Checkout concluído: ${planCode}`,
          });
        }

        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as any;
        const status = subscription.status;
        const planId = subscription.items?.data?.[0]?.price?.id;

        const dbStatus = mapStripeStatus(status);
        const company = await prisma.company.findFirst({
          where: { stripeSubscriptionId: subscription.id },
        });

        if (company) {
          const previousStatus = company.subscriptionStatus;

          await prisma.company.update({
            where: { id: company.id },
            data: {
              subscriptionStatus: dbStatus,
              planType: (planId ? mapPriceIdToPlan(planId) : company.planType) as never,
            },
          });

          await syncSubscriptionRow({
            companyId: company.id,
            planCode: planId ? mapPriceIdToPlan(planId) : company.planType,
            status: dbStatus,
            action: dbStatus === "CANCELED" ? "SUBSCRIPTION_CANCEL" : "SUBSCRIPTION_RENEWED",
            amount: 0,
            description: `Status da assinatura alterado: ${previousStatus} -> ${dbStatus}`,
          });
        }
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as any;
        const company = await prisma.company.findFirst({
          where: { stripeSubscriptionId: invoice.subscription as string },
        });

        if (company) {
          const amount = Math.round((invoice.amount_paid ?? 0) * (invoice.currency === "brl" ? 1 : 1));
          await recordBilling({
            companyId: company.id,
            action: "PAYMENT_SUCCESS",
            amount,
            currency: (invoice.currency ?? "BRL").toUpperCase(),
            status: "paid",
            description: `Pagamento recebido: ${(invoice.amount_paid ?? 0) / 100} ${invoice.currency}`,
            metadata: { stripeInvoiceId: invoice.id as string },
          });
        }
        break;
      }

      case "invoice.payment_failed": {
        const failedInvoice = event.data.object as any;
        const failedCompany = await prisma.company.findFirst({
          where: { stripeSubscriptionId: failedInvoice.subscription as string },
        });

        if (failedCompany) {
          await prisma.company.update({
            where: { id: failedCompany.id },
            data: { subscriptionStatus: "PAST_DUE" },
          });

          await prisma.subscription.updateMany({
            where: { companyId: failedCompany.id },
            data: { status: "PAST_DUE" },
          });

          const amount = Math.round((failedInvoice.amount_due ?? 0) * 1);
          await recordBilling({
            companyId: failedCompany.id,
            action: "PAYMENT_FAILURE",
            amount,
            currency: (failedInvoice.currency ?? "BRL").toUpperCase(),
            status: "failed",
            description: `Falha no pagamento: ${(failedInvoice.amount_due ?? 0) / 100} ${failedInvoice.currency}`,
            metadata: { stripeInvoiceId: failedInvoice.id as string },
          });
        }
        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch (error) {
    console.error(error);
    return errorResponse("Erro interno do servidor", 500);
  }
}

async function syncSubscriptionRow(params: {
  companyId: string;
  planCode: string;
  status: "ACTIVE" | "PAST_DUE" | "CANCELED" | "INCOMPLETE" | "TRIALING";
  amount: number;
  action: "SUBSCRIPTION_CREATED" | "SUBSCRIPTION_CANCEL" | "SUBSCRIPTION_RENEWED";
  description: string;
}) {
  const plan = await getPlanByCode(params.planCode);
  if (!plan) return;

  const now = new Date();
  const nextBillingDate = new Date(now);
  nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);

  await prisma.subscription.upsert({
    where: { companyId: params.companyId },
    update: {
      planId: plan.id,
      status: params.status,
      nextBillingDate,
      expiresAt: params.status === "ACTIVE" ? nextBillingDate : null,
      ...(params.status === "CANCELED" ? { canceledAt: now } : { canceledAt: null }),
    },
    create: {
      companyId: params.companyId,
      planId: plan.id,
      status: params.status,
      startedAt: now,
      nextBillingDate,
      expiresAt: params.status === "ACTIVE" ? nextBillingDate : null,
    },
  });

  await recordBilling({
    companyId: params.companyId,
    action: params.action,
    amount: params.amount,
    status: params.status.toLowerCase(),
    description: params.description,
    metadata: { source: "stripe_webhook", planCode: params.planCode },
  });
}

function mapPriceIdToPlan(priceId: string): "STARTER" | "PRO" | "BUSINESS" | "ENTERPRISE" {
  const env = process.env;
  if (priceId === env.STRIPE_STARTER_PRICE_ID) return "STARTER";
  if (priceId === env.STRIPE_PRO_PRICE_ID) return "PRO";
  if (priceId === env.STRIPE_BUSINESS_PRICE_ID) return "BUSINESS";
  if (priceId === env.STRIPE_ENTERPRISE_PRICE_ID) return "ENTERPRISE";
  if (typeof priceId === "string" && priceId.toUpperCase().includes("ENTERPRISE")) return "ENTERPRISE";
  return "STARTER";
}

function mapStripeStatus(status: string): "ACTIVE" | "PAST_DUE" | "CANCELED" | "INCOMPLETE" | "TRIALING" {
  const map: Record<string, "ACTIVE" | "PAST_DUE" | "CANCELED" | "INCOMPLETE" | "TRIALING"> = {
    active: "ACTIVE",
    past_due: "PAST_DUE",
    canceled: "CANCELED",
    unpaid: "PAST_DUE",
    incomplete: "INCOMPLETE",
    trialing: "TRIALING",
  };
  return map[status] || "INCOMPLETE";
}
