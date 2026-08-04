import { NextRequest } from "next/server";
import { errorResponse } from "@/lib/auth/api-response";
import { createLog } from "@/lib/logger";
import { getStripeClient } from "@/lib/billing/stripe";
import { processStripeEvent } from "@/lib/billing/stripe-webhook";

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

    let event;

    try {
      const stripe = getStripeClient();
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
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

    await processStripeEvent({
      id: event.id,
      type: event.type,
      data: {
        object: (event.data?.object ?? {}) as unknown as Record<string, unknown>,
      },
    });

    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch (error) {
    console.error(error);

    try {
      await createLog({
        action: "WEBHOOK_FAILED",
        entity: "webhook",
        description: `Erro ao processar webhook Stripe: ${
          error instanceof Error ? error.message : String(error)
        }`,
        companyId: "system",
      });
    } catch {
      // log failure must never break the webhook response
    }

    return errorResponse("Erro interno do servidor", 500);
  }
}

export const runtime = "nodejs";
