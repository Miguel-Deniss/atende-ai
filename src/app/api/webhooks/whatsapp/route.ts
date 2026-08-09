import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { errorResponse } from "@/lib/auth/api-response";
import { logSystemEvent } from "@/lib/logger";
import {
  verifyMetaSignature,
  verifyWebhookToken,
} from "@/lib/whatsapp/verify-signature";
import { processWhatsAppWebhook } from "@/lib/whatsapp/webhook";
import { guardRateLimit, clientIp } from "@/lib/rate-limit/with-rate-limit";
import type { WhatsAppWebhookPayload } from "@/lib/whatsapp/types";

export async function POST(request: NextRequest) {
  const blocked = await guardRateLimit(
    request,
    `webhook-whatsapp:${clientIp(request)}`,
    "webhook"
  );

  if (blocked) {
    return blocked;
  }

  const body = await request.text();
  const signature = request.headers.get("x-hub-signature-256");

  if (!verifyMetaSignature(body, signature)) {
    await logSystemEvent({
      action: signature
        ? "WEBHOOK_FAILED"
        : "SUSPICIOUS_ACTIVITY",
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

  const webhookEvent = await prisma.webhookEvent.create({
    data: {
      provider: "whatsapp",
      event: payload.object || "message",
      payload: JSON.parse(JSON.stringify(payload)),
      signature,
      status: "received",
    },
  });

  const result = await processWhatsAppWebhook(payload);

  await prisma.webhookEvent.update({
    where: { id: webhookEvent.id },
    data: {
      status: result.failed > 0 ? "failed" : "processed",
      processedAt: new Date(),
      ...(result.failed > 0 ? { error: result.errors.join("; ") } : {}),
      ...(result.companyIds.length > 0
        ? { companyId: result.companyIds[result.companyIds.length - 1] }
        : {}),
    },
  });

  return new Response(JSON.stringify({ received: true }), { status: 200 });
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
