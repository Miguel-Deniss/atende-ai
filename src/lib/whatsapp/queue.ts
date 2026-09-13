import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/logger/structured";
import type { WhatsAppWebhookPayload } from "./types";
import { processWhatsAppWebhook } from "./webhook";

const MAX_ATTEMPTS = 5;

export async function enqueueWhatsAppWebhook(payload: WhatsAppWebhookPayload, signature: string) {
  return prisma.webhookEvent.upsert({
    where: {
      provider_signature: { provider: "whatsapp", signature },
    },
    update: {},
    create: {
      provider: "whatsapp",
      event: payload.object || "message",
      payload: payload as unknown as Prisma.InputJsonValue,
      signature,
      status: "queued",
      availableAt: new Date(),
    },
  });
}

export async function processWhatsAppWebhookEvent(id: string): Promise<boolean> {
  const claimed = await prisma.webhookEvent.updateMany({
    where: {
      id,
      provider: "whatsapp",
      status: { in: ["queued", "failed"] },
      attempts: { lt: MAX_ATTEMPTS },
      availableAt: { lte: new Date() },
    },
    data: {
      status: "processing",
      claimedAt: new Date(),
      attempts: { increment: 1 },
    },
  });
  if (claimed.count !== 1) return false;

  const event = await prisma.webhookEvent.findUnique({ where: { id } });
  if (!event) return false;

  try {
    const payload = event.payload as unknown as WhatsAppWebhookPayload;
    const result = await processWhatsAppWebhook(payload);
    if (result.failed > 0) {
      throw new Error(result.errors.join("; ") || "Falha no processamento do webhook");
    }

    await prisma.webhookEvent.update({
      where: { id },
      data: {
        status: "processed",
        processedAt: new Date(),
        claimedAt: null,
        error: null,
        companyId: result.companyIds.at(-1),
        payload: { object: payload.object, processed: true },
      },
    });
    return true;
  } catch (error) {
    const attempts = event.attempts;
    const delayMinutes = Math.min(60, 2 ** Math.max(0, attempts - 1));
    await prisma.webhookEvent.update({
      where: { id },
      data: {
        status: attempts >= MAX_ATTEMPTS ? "dead_letter" : "failed",
        claimedAt: null,
        error: error instanceof Error ? error.message.slice(0, 1000) : "unknown",
        availableAt: new Date(Date.now() + delayMinutes * 60_000),
      },
    });
    logger.error("Falha ao processar webhook WhatsApp", {
      action: "whatsapp_webhook_processing_failed",
      error: error instanceof Error ? error.message : "unknown",
      metadata: { webhookEventId: id, attempts },
    });
    return false;
  }
}

export async function processPendingWhatsAppWebhooks(limit = 10) {
  const events = await prisma.webhookEvent.findMany({
    where: {
      provider: "whatsapp",
      status: { in: ["queued", "failed"] },
      attempts: { lt: MAX_ATTEMPTS },
      availableAt: { lte: new Date() },
    },
    select: { id: true },
    orderBy: { createdAt: "asc" },
    take: Math.min(Math.max(limit, 1), 50),
  });

  const results = await Promise.all(events.map((event) => processWhatsAppWebhookEvent(event.id)));
  return { found: events.length, processed: results.filter(Boolean).length };
}
