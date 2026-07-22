import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { errorResponse } from "@/lib/auth/api-response";
import { createLog } from "@/lib/logger";

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
        const priceId = (session as any).metadata?.price_id;

        await prisma.company.updateMany({
          where: { stripeCustomerId: customerId },
          data: {
            stripeSubscriptionId: subscriptionId,
            subscriptionStatus: "ACTIVE",
            ...(priceId ? { planType: mapPriceIdToPlan(priceId) } : {}),
          },
        });

        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as any;
        const status = subscription.status;

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
              ...(dbStatus === "CANCELED" || dbStatus === "PAST_DUE"
                ? {}
                : {}),
            },
          });

          await createLog({
            action: "SUBSCRIPTION_CANCEL",
            entity: "subscription",
            entityId: company.id,
            description: `Status da assinatura alterado: ${previousStatus} -> ${dbStatus}`,
            companyId: company.id,
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
          await createLog({
            action: "PAYMENT_SUCCESS",
            entity: "payment",
            entityId: invoice.id as string,
            description: `Pagamento recebido: ${invoice.amount_paid / 100} ${invoice.currency}`,
            companyId: company.id,
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

          await createLog({
            action: "PAYMENT_FAILURE",
            entity: "payment",
            entityId: failedInvoice.id as string,
            description: `Falha no pagamento: ${failedInvoice.amount_due / 100} ${failedInvoice.currency}`,
            companyId: failedCompany.id,
          });
        }
        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch {
    return errorResponse("Erro interno do servidor", 500);
  }
}

function mapPriceIdToPlan(priceId: string): "STARTER" | "PRO" | "BUSINESS" {
  const env = process.env;
  if (priceId === env.STRIPE_STARTER_PRICE_ID) return "STARTER";
  if (priceId === env.STRIPE_PRO_PRICE_ID) return "PRO";
  if (priceId === env.STRIPE_BUSINESS_PRICE_ID) return "BUSINESS";
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
