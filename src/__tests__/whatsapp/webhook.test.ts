import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    whatsAppConfig: { findFirst: vi.fn() },
    conversation: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    message: {
      create: vi.fn(),
    },
    company: {
      findUnique: vi.fn(),
    },
    subscription: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("@/lib/logger", () => ({
  createLog: vi.fn(async () => {}),
}));

vi.mock("@/lib/security/encryption", () => ({
  decrypt: vi.fn(() => "decrypted-token"),
}));

vi.mock("@/lib/ai/conversation-manager", () => ({
  processMessage: vi.fn(),
  createDefaultDeps: vi.fn(() => ({})),
}));

vi.mock("@/lib/ai/context-loader", () => ({
  loadConversationContext: vi.fn(),
}));

vi.mock("@/lib/whatsapp/client", () => ({
  findOrCreateWhatsAppClient: vi.fn(),
}));

vi.mock("@/lib/whatsapp/send-message", () => ({
  sendWhatsAppMessage: vi.fn(async () => {}),
}));

import { prisma } from "@/lib/db/prisma";
import { createLog } from "@/lib/logger";
import { decrypt } from "@/lib/security/encryption";
import {
  processMessage,
  createDefaultDeps,
} from "@/lib/ai/conversation-manager";
import { loadConversationContext } from "@/lib/ai/context-loader";
import { findOrCreateWhatsAppClient } from "@/lib/whatsapp/client";
import { sendWhatsAppMessage } from "@/lib/whatsapp/send-message";
import {
  extractIncomingMessages,
  processWhatsAppWebhook,
} from "@/lib/whatsapp/webhook";
import type { WhatsAppWebhookPayload } from "@/lib/whatsapp/types";

function makePayload(
  phoneNumberId: string,
  from: string,
  body: string,
  profileName?: string
): WhatsAppWebhookPayload {
  return {
    object: "whatsapp_business_account",
    entry: [
      {
        id: "WABA_ID",
        changes: [
          {
            field: "messages",
            value: {
              messaging_product: "whatsapp",
              metadata: {
                display_phone_number: "16505551111",
                phone_number_id: phoneNumberId,
              },
              contacts: [
                {
                  profile: profileName ? { name: profileName } : undefined,
                  wa_id: from,
                },
              ],
              messages: [
                {
                  from,
                  id: "wamid." + from,
                  timestamp: "1700000000",
                  type: "text",
                  text: { body },
                },
              ],
            },
          },
        ],
      },
    ],
  };
}

const configRow = {
  id: "config-1",
  companyId: "company-1",
  phoneNumberId: "PHONE_A",
  accessToken: "encrypted-token",
  status: "CONNECTED",
};

const contextRow = {
  conversationId: "conv-1",
  company: { name: "Barbearia A" },
  knownName: "João",
};

describe("extractIncomingMessages", () => {
  it("deve extrair mensagem com phone_number_id, wa_id e nome do perfil", () => {
    const messages = extractIncomingMessages(
      makePayload("PHONE_A", "5511999999999", "Quero agendar", "João")
    );
    expect(messages[0]).toEqual(
      expect.objectContaining({
        phoneNumberId: "PHONE_A",
        from: "5511999999999",
        body: "Quero agendar",
        profileName: "João",
      })
    );
  });

  it("deve ignorar statuses (delivery receipts)", () => {
    const payload: WhatsAppWebhookPayload = {
      object: "whatsapp_business_account",
      entry: [
        {
          id: "WABA_ID",
          changes: [
            {
              field: "messages",
              value: {
                messaging_product: "whatsapp",
                metadata: {
                  display_phone_number: "16505551111",
                  phone_number_id: "PHONE_A",
                },
                statuses: [
                  { id: "s1", status: "delivered", timestamp: "1700000000" },
                ],
              },
            },
          ],
        },
      ],
    };
    expect(extractIncomingMessages(payload)).toEqual([]);
  });
});

describe("processWhatsAppWebhook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(decrypt).mockReturnValue("decrypted-token");
    vi.mocked(loadConversationContext).mockResolvedValue(contextRow as never);
    vi.mocked(processMessage).mockResolvedValue({
      response: "Perfeito! Vou agendar.",
      state: {} as never,
      appointmentPersisted: false,
    });
    vi.mocked(findOrCreateWhatsAppClient).mockResolvedValue({
      id: "client-1",
      name: "João",
      whatsappName: "João",
    } as never);
    vi.mocked(prisma.company.findUnique).mockResolvedValue({
      planType: "FREE",
      subscriptionStatus: "ACTIVE",
      trialEndsAt: null,
    } as never);
    vi.mocked(prisma.subscription.findUnique).mockResolvedValue(null as never);
  });

  it("deve descobrir a empresa pelo phone_number_id e processar a mensagem", async () => {
    vi.mocked(prisma.whatsAppConfig.findFirst).mockResolvedValue(configRow as never);
    vi.mocked(prisma.conversation.findFirst).mockResolvedValue(null as never);
    vi.mocked(prisma.conversation.create).mockResolvedValue({
      id: "conv-1",
    } as never);

    const result = await processWhatsAppWebhook(
      makePayload("PHONE_A", "5511999999999", "Quero agendar", "João")
    );

    expect(prisma.whatsAppConfig.findFirst).toHaveBeenCalledWith({
      where: { phoneNumberId: "PHONE_A", status: "CONNECTED" },
    });

    expect(findOrCreateWhatsAppClient).toHaveBeenCalledWith(
      "company-1",
      "5511999999999",
      "João"
    );

    expect(prisma.conversation.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        companyId: "company-1",
        phone: "5511999999999",
        clientId: "client-1",
        status: "OPEN",
        unread: true,
      }),
    });

    expect(processMessage).toHaveBeenCalledWith({
      conversationId: "conv-1",
      message: "Quero agendar",
      company: { name: "Barbearia A" },
      knownName: "João",
      deps: {},
    });

    expect(decrypt).toHaveBeenCalledWith("encrypted-token");

    expect(sendWhatsAppMessage).toHaveBeenCalledWith({
      phoneNumberId: "PHONE_A",
      accessToken: "decrypted-token",
      to: "5511999999999",
      message: "Perfeito! Vou agendar.",
    });

    expect(prisma.conversation.update).toHaveBeenCalledWith({
      where: { id: "conv-1" },
      data: expect.objectContaining({ lastMessage: "Perfeito! Vou agendar." }),
    });

    expect(result).toMatchObject({
      processed: 1,
      failed: 0,
      skipped: 0,
      companyIds: ["company-1"],
    });
  });

  it("deve reutilizar conversa aberta existente pelo cliente", async () => {
    vi.mocked(prisma.whatsAppConfig.findFirst).mockResolvedValue(configRow as never);
    vi.mocked(prisma.conversation.findFirst).mockResolvedValue({
      id: "conv-1",
      clientId: "client-1",
    } as never);

    await processWhatsAppWebhook(makePayload("PHONE_A", "5511999999999", "Oi"));

    expect(prisma.conversation.create).not.toHaveBeenCalled();
    expect(prisma.conversation.update).toHaveBeenCalledWith({
      where: { id: "conv-1" },
      data: expect.objectContaining({ lastMessage: expect.any(String) }),
    });
  });

  it("não deve responder quando a conversa foi assumida por um humano", async () => {
    vi.mocked(prisma.whatsAppConfig.findFirst).mockResolvedValue(configRow as never);
    vi.mocked(prisma.conversation.findFirst).mockResolvedValue({
      id: "conv-1",
      clientId: "client-1",
      handledById: "user-1",
    } as never);

    const result = await processWhatsAppWebhook(
      makePayload("PHONE_A", "5511999999999", "Preciso falar com alguém")
    );

    expect(prisma.message.create).toHaveBeenCalledWith({
      data: {
        conversationId: "conv-1",
        role: "user",
        content: "Preciso falar com alguém",
      },
    });

    expect(prisma.conversation.update).toHaveBeenCalledWith({
      where: { id: "conv-1" },
      data: expect.objectContaining({ lastMessage: "Preciso falar com alguém" }),
    });

    expect(processMessage).not.toHaveBeenCalled();
    expect(sendWhatsAppMessage).not.toHaveBeenCalled();

    expect(result).toMatchObject({
      handled: 1,
      processed: 0,
      failed: 0,
    });
  });

  it("deve pular quando a empresa não possui WhatsAppConfig para o número", async () => {
    vi.mocked(prisma.whatsAppConfig.findFirst).mockResolvedValue(null as never);

    const result = await processWhatsAppWebhook(
      makePayload("PHONE_DESCONHECIDO", "5511999999999", "Oi")
    );

    expect(result.skipped).toBe(1);
    expect(result.processed).toBe(0);
    expect(processMessage).not.toHaveBeenCalled();
    expect(createLog).toHaveBeenCalledWith(
      expect.objectContaining({ action: "WEBHOOK_FAILED", companyId: "system" })
    );
  });

  it("deve usar knownName null quando não há nome no perfil", async () => {
    vi.mocked(prisma.whatsAppConfig.findFirst).mockResolvedValue(configRow as never);
    vi.mocked(prisma.conversation.findFirst).mockResolvedValue(null as never);
    vi.mocked(prisma.conversation.create).mockResolvedValue({ id: "conv-1" } as never);
    vi.mocked(findOrCreateWhatsAppClient).mockResolvedValue({
      id: "client-1",
      name: "Cliente WhatsApp",
      whatsappName: null,
    } as never);

    await processWhatsAppWebhook(
      makePayload("PHONE_A", "5511999999999", "Oi")
    );

    expect(processMessage).toHaveBeenCalledWith(
      expect.objectContaining({ knownName: null })
    );
  });

  it("deve registrar falha quando o processamento lança erro", async () => {
    vi.mocked(prisma.whatsAppConfig.findFirst).mockResolvedValue(configRow as never);
    vi.mocked(prisma.conversation.findFirst).mockResolvedValue(null as never);
    vi.mocked(prisma.conversation.create).mockResolvedValue({ id: "conv-1" } as never);
    vi.mocked(processMessage).mockRejectedValue(new Error("A IA gerou resposta invalida."));

    const result = await processWhatsAppWebhook(
      makePayload("PHONE_A", "5511999999999", "Oi")
    );

    expect(result.failed).toBe(1);
    expect(result.errors).toContain("A IA gerou resposta invalida.");
    expect(sendWhatsAppMessage).not.toHaveBeenCalled();
  });

  it("multiempresa: empresa A só processa mensagens do número A e empresa B do número B", async () => {
    vi.mocked(prisma.conversation.findFirst).mockResolvedValue(null as never);
    vi.mocked(prisma.conversation.create).mockResolvedValue({ id: "conv-1" } as never);

    vi.mocked(prisma.whatsAppConfig.findFirst).mockResolvedValue({
      ...configRow,
      companyId: "company-1",
      phoneNumberId: "PHONE_A",
    } as never);
    await processWhatsAppWebhook(makePayload("PHONE_A", "5511111111111", "Oi"));

    expect(prisma.whatsAppConfig.findFirst).toHaveBeenCalledWith({
      where: { phoneNumberId: "PHONE_A", status: "CONNECTED" },
    });
    expect(processMessage).toHaveBeenCalledWith(
      expect.objectContaining({ conversationId: "conv-1" })
    );
    expect(sendWhatsAppMessage).toHaveBeenCalledWith(
      expect.objectContaining({ phoneNumberId: "PHONE_A" })
    );

    vi.clearAllMocks();
    vi.mocked(loadConversationContext).mockResolvedValue({
      conversationId: "conv-2",
      company: { name: "Barbearia B" },
      knownName: null,
    } as never);
    vi.mocked(processMessage).mockResolvedValue({
      response: "Resposta B",
      state: {} as never,
      appointmentPersisted: false,
    });
    vi.mocked(findOrCreateWhatsAppClient).mockResolvedValue({
      id: "client-2",
      name: "Cliente WhatsApp",
      whatsappName: null,
    } as never);
    vi.mocked(prisma.conversation.findFirst).mockResolvedValue(null as never);
    vi.mocked(prisma.conversation.create).mockResolvedValue({ id: "conv-2" } as never);

    vi.mocked(prisma.whatsAppConfig.findFirst).mockResolvedValue({
      id: "config-2",
      companyId: "company-2",
      phoneNumberId: "PHONE_B",
      accessToken: "encrypted-b",
      status: "CONNECTED",
    } as never);
    await processWhatsAppWebhook(makePayload("PHONE_B", "5522222222222", "Oi"));

    expect(prisma.whatsAppConfig.findFirst).toHaveBeenCalledWith({
      where: { phoneNumberId: "PHONE_B", status: "CONNECTED" },
    });
    expect(sendWhatsAppMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        phoneNumberId: "PHONE_B",
        accessToken: "decrypted-token",
        to: "5522222222222",
      })
    );
    expect(processMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        conversationId: "conv-2",
        company: { name: "Barbearia B" },
      })
    );
  });

  it("deve falhar quando o token não pode ser descriptografado", async () => {
    vi.mocked(prisma.whatsAppConfig.findFirst).mockResolvedValue(configRow as never);
    vi.mocked(prisma.conversation.findFirst).mockResolvedValue(null as never);
    vi.mocked(prisma.conversation.create).mockResolvedValue({ id: "conv-1" } as never);
    vi.mocked(decrypt).mockImplementation(() => {
      throw new Error("Invalid encrypted text format");
    });

    const result = await processWhatsAppWebhook(
      makePayload("PHONE_A", "5511999999999", "Oi")
    );

    expect(result.failed).toBe(1);
    expect(result.errors[0]).toContain("descriptografar");
    expect(sendWhatsAppMessage).not.toHaveBeenCalled();
  });

  it("deve usar o processo injetado quando fornecido", async () => {
    vi.mocked(prisma.whatsAppConfig.findFirst).mockResolvedValue(configRow as never);
    vi.mocked(prisma.conversation.findFirst).mockResolvedValue(null as never);
    vi.mocked(prisma.conversation.create).mockResolvedValue({ id: "conv-1" } as never);

    const fakeProcess = vi.fn(async () => ({
      response: "Resposta custom",
      state: {} as never,
      appointmentPersisted: false,
    }));

    await processWhatsAppWebhook(makePayload("PHONE_A", "5511999999999", "Oi"), {
      process: fakeProcess as never,
      managerDeps: createDefaultDeps() as never,
    });

    expect(fakeProcess).toHaveBeenCalledTimes(1);
    expect(sendWhatsAppMessage).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Resposta custom" })
    );
  });
});
