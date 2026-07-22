import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { errorResponse } from "@/lib/auth/api-response";
import { createLog } from "@/lib/logger";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("x-hub-signature-256");
    const webhookSecret = process.env.WHATSAPP_WEBHOOK_SECRET;

    if (!signature && webhookSecret) {
      await createLog({
        action: "SUSPICIOUS_ACTIVITY",
        entity: "webhook",
        description: "Webhook WhatsApp recebido sem assinatura",
        companyId: "system",
      });
      return errorResponse("Missing signature", 401);
    }

    if (webhookSecret && signature) {
      const expectedSig = crypto
        .createHmac("sha256", webhookSecret)
        .update(body)
        .digest("hex");

      const actualSig = signature.replace("sha256=", "");

      if (!crypto.timingSafeEqual(Buffer.from(expectedSig), Buffer.from(actualSig))) {
        await createLog({
          action: "WEBHOOK_FAILED",
          entity: "webhook",
          description: "Assinatura do webhook WhatsApp inválida",
          companyId: "system",
        });
        return errorResponse("Invalid signature", 401);
      }
    }

    const payload = JSON.parse(body);

    await createLog({
      action: "WEBHOOK_RECEIVED",
      entity: "webhook",
      description: "Webhook WhatsApp recebido",
      companyId: "system",
    });

    await prisma.webhookEvent.create({
      data: {
        provider: "whatsapp",
        event: payload.type || "message",
        payload,
        signature,
        status: "received",
      },
    });

    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch {
    return errorResponse("Erro interno do servidor", 500);
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.WHATSAPP_API_KEY) {
    return new Response(challenge, { status: 200 });
  }

  return errorResponse("Verification failed", 403);
}
