import { NextRequest } from "next/server";
import { errorResponse } from "@/lib/auth/api-response";
import { logSystemEvent } from "@/lib/logger";
import { verifyMetaSignature, verifyWebhookToken } from "@/lib/whatsapp/verify-signature";
import { enqueueWhatsAppWebhook, processWhatsAppWebhookEvent } from "@/lib/whatsapp/queue";
import { guardRateLimit, clientIp } from "@/lib/rate-limit/with-rate-limit";
import type { WhatsAppWebhookPayload } from "@/lib/whatsapp/types";
import { after } from "next/server";

export async function POST(request: NextRequest) {
  const blocked = await guardRateLimit(request, `webhook-whatsapp:${clientIp(request)}`, "webhook");

  if (blocked) {
    return blocked;
  }

  const body = await request.text();
  const signature = request.headers.get("x-hub-signature-256");

  if (!verifyMetaSignature(body, signature)) {
    await logSystemEvent({
      action: signature ? "WEBHOOK_FAILED" : "SUSPICIOUS_ACTIVITY",
      entity: "webhook",
      description: signature
        ? "Assinatura do webhook WhatsApp inválida"
        : "Webhook WhatsApp recebido sem assinatura",
    });
    return errorResponse("Invalid signature", 401);
  }

  let payload: WhatsAppWebhookPayload;
  try {
    payload = JSON.parse(body);
  } catch {
    return errorResponse("Invalid payload", 400);
  }

  await logSystemEvent({
    action: "WEBHOOK_RECEIVED",
    entity: "webhook",
    description: "Webhook WhatsApp recebido",
  });

  const webhookEvent = await enqueueWhatsAppWebhook(payload, signature!);
  after(async () => {
    await processWhatsAppWebhookEvent(webhookEvent.id);
  });

  return Response.json({ received: true });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && verifyWebhookToken(token)) {
    return new Response(challenge, { status: 200 });
  }

  return errorResponse("Verification failed", 403);
}
