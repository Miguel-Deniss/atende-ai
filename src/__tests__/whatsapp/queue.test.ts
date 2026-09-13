import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    webhookEvent: {
      upsert: vi.fn(),
      updateMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

vi.mock("@/lib/logger/structured", () => ({
  logger: { error: vi.fn() },
}));

vi.mock("@/lib/whatsapp/webhook", () => ({
  processWhatsAppWebhook: vi.fn(),
}));

import { prisma } from "@/lib/db/prisma";
import { processWhatsAppWebhook } from "@/lib/whatsapp/webhook";
import { enqueueWhatsAppWebhook, processWhatsAppWebhookEvent } from "@/lib/whatsapp/queue";
import type { WhatsAppWebhookPayload } from "@/lib/whatsapp/types";

const payload = { object: "whatsapp_business_account", entry: [] } as WhatsAppWebhookPayload;

describe("fila durável de webhooks WhatsApp", () => {
  beforeEach(() => vi.clearAllMocks());

  it("usa provider e assinatura como chave idempotente", async () => {
    vi.mocked(prisma.webhookEvent.upsert).mockResolvedValue({ id: "event-1" } as never);
    await enqueueWhatsAppWebhook(payload, "sha256=abc");
    expect(prisma.webhookEvent.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { provider_signature: { provider: "whatsapp", signature: "sha256=abc" } },
        update: {},
      })
    );
  });

  it("não processa o mesmo evento quando o claim atômico falha", async () => {
    vi.mocked(prisma.webhookEvent.updateMany).mockResolvedValue({ count: 0 });
    expect(await processWhatsAppWebhookEvent("event-1")).toBe(false);
    expect(processWhatsAppWebhook).not.toHaveBeenCalled();
  });

  it("envia para dead-letter após a quinta falha", async () => {
    vi.mocked(prisma.webhookEvent.updateMany).mockResolvedValue({ count: 1 });
    vi.mocked(prisma.webhookEvent.findUnique).mockResolvedValue({
      id: "event-1",
      payload,
      attempts: 5,
    } as never);
    vi.mocked(processWhatsAppWebhook).mockRejectedValue(new Error("provider offline"));
    vi.mocked(prisma.webhookEvent.update).mockResolvedValue({} as never);

    expect(await processWhatsAppWebhookEvent("event-1")).toBe(false);
    expect(prisma.webhookEvent.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "event-1" },
        data: expect.objectContaining({ status: "dead_letter", claimedAt: null }),
      })
    );
  });
});
