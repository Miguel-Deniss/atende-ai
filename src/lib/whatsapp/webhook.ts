import { prisma } from "@/lib/db/prisma";
import { createLog } from "@/lib/logger";
import { decrypt } from "@/lib/security/encryption";
import { publish } from "@/lib/realtime";
import { enforceBilling } from "@/lib/billing/subscription";
import {
  createDefaultDeps,
  processMessage,
  type ConversationManagerDeps,
  type ProcessMessageInput,
  type ProcessMessageResult,
} from "@/lib/ai/conversation-manager";
import { loadConversationContext } from "@/lib/ai/context-loader";
import { findOrCreateWhatsAppClient } from "./client";
import { sendWhatsAppMessage } from "./send-message";
import type { IncomingWhatsAppMessage, WhatsAppWebhookPayload } from "./types";
import { Prisma } from "@prisma/client";
import { checkAIMessageLimit, checkConversationLimit } from "@/lib/tenant/plan-limits";

export interface WhatsAppWebhookDeps {
  process?: (input: ProcessMessageInput) => Promise<ProcessMessageResult>;
  send?: typeof sendWhatsAppMessage;
  managerDeps?: ConversationManagerDeps;
}

export interface ProcessWhatsAppResult {
  processed: number;
  skipped: number;
  failed: number;
  handled: number;
  errors: string[];
  companyIds: string[];
}

export function extractIncomingMessages(
  payload: WhatsAppWebhookPayload
): IncomingWhatsAppMessage[] {
  const messages: IncomingWhatsAppMessage[] = [];

  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      const value = change.value;
      if (!value?.messages) continue;

      for (const msg of value.messages) {
        if (!msg.text?.body || !msg.from) continue;

        const contact = value.contacts?.find((c) => c.wa_id === msg.from);
        const profileName = contact?.profile?.name?.trim();

        messages.push({
          phoneNumberId: value.metadata?.phone_number_id ?? "",
          displayPhoneNumber: value.metadata?.display_phone_number ?? "",
          from: msg.from,
          messageId: msg.id,
          body: msg.text.body,
          profileName: profileName ? profileName : undefined,
          timestamp: msg.timestamp,
        });
      }
    }
  }

  return messages;
}

export async function processWhatsAppWebhook(
  payload: WhatsAppWebhookPayload,
  deps: WhatsAppWebhookDeps = {}
): Promise<ProcessWhatsAppResult> {
  const messages = extractIncomingMessages(payload);

  const result: ProcessWhatsAppResult = {
    processed: 0,
    skipped: 0,
    failed: 0,
    handled: 0,
    errors: [],
    companyIds: [],
  };

  if (messages.length === 0) return result;

  const doProcess = deps.process ?? processMessage;
  const doSend = deps.send ?? sendWhatsAppMessage;
  const managerDeps = deps.managerDeps ?? createDefaultDeps();

  for (const incoming of messages) {
    if (!incoming.phoneNumberId) {
      result.skipped++;
      continue;
    }

    try {
      const alreadyProcessed = await prisma.message.findUnique({
        where: { externalId: incoming.messageId },
        select: { id: true },
      });
      if (alreadyProcessed) {
        result.skipped++;
        continue;
      }

      const config = await prisma.whatsAppConfig.findFirst({
        where: {
          phoneNumberId: incoming.phoneNumberId,
          status: "CONNECTED",
        },
      });

      if (!config) {
        result.skipped++;
        await createLog({
          action: "WEBHOOK_FAILED",
          entity: "webhook",
          description: `WhatsAppConfig nao encontrada para o numero ${incoming.phoneNumberId}`,
          companyId: "system",
        });
        continue;
      }

      result.companyIds.push(config.companyId);

      const billing = await enforceBilling(config.companyId);
      if (!billing.allowed) {
        result.skipped++;
        await createLog({
          action: "BILLING_BLOCKED",
          entity: "subscription",
          entityId: config.companyId,
          description: `Mensagem ignorada (inadimplência): ${billing.reason}`,
          companyId: config.companyId,
        });
        continue;
      }

      const company = await prisma.company.findUnique({
        where: { id: config.companyId },
        select: { planType: true },
      });
      if (!company) {
        result.skipped++;
        continue;
      }

      const whatsappClient = await findOrCreateWhatsAppClient(
        config.companyId,
        incoming.from,
        incoming.profileName
      );

      let conversation = await prisma.conversation.findFirst({
        where: { companyId: config.companyId, clientId: whatsappClient.id },
      });

      if (!conversation) {
        conversation = await prisma.conversation.findFirst({
          where: { companyId: config.companyId, phone: incoming.from },
        });
      }

      if (!conversation) {
        const currentCount = await prisma.conversation.count({
          where: { companyId: config.companyId, deletedAt: null },
        });
        const conversationLimit = checkConversationLimit(currentCount, company.planType);
        if (!conversationLimit.allowed) {
          result.skipped++;
          await createLog({
            action: "BILLING_BLOCKED",
            entity: "conversation",
            description: conversationLimit.message,
            companyId: config.companyId,
          });
          continue;
        }
        conversation = await prisma.conversation.create({
          data: {
            companyId: config.companyId,
            phone: incoming.from,
            name: whatsappClient.whatsappName ?? whatsappClient.name,
            status: "OPEN",
            unread: true,
            clientId: whatsappClient.id,
          },
        });
      } else if (!conversation.clientId) {
        conversation = await prisma.conversation.update({
          where: { id: conversation.id },
          data: { clientId: whatsappClient.id, status: "OPEN" },
        });
      }

      if (conversation.handledById) {
        await prisma.message.create({
          data: {
            conversationId: conversation.id,
            role: "user",
            content: incoming.body,
            externalId: incoming.messageId,
          },
        });

        await prisma.conversation.update({
          where: { id: conversation.id },
          data: {
            lastMessage: incoming.body,
            lastMessageAt: new Date(),
            unread: true,
          },
        });

        publish(config.companyId, "message", {
          conversationId: conversation.id,
          role: "user",
          content: incoming.body,
        });
        publish(config.companyId, "conversation", { id: conversation.id });

        result.handled++;
        continue;
      }

      const context = await loadConversationContext(conversation.id, config.companyId);
      if (!context) {
        result.skipped++;
        continue;
      }

      const monthStart = new Date();
      monthStart.setUTCDate(1);
      monthStart.setUTCHours(0, 0, 0, 0);
      const aiMessagesThisMonth = await prisma.message.count({
        where: {
          role: "assistant",
          createdAt: { gte: monthStart },
          conversation: { companyId: config.companyId },
        },
      });
      const aiLimit = checkAIMessageLimit(aiMessagesThisMonth, company.planType);
      if (!aiLimit.allowed) {
        result.skipped++;
        await createLog({
          action: "BILLING_BLOCKED",
          entity: "ai_message",
          description: aiLimit.message,
          companyId: config.companyId,
        });
        continue;
      }

      const processed = await doProcess({
        conversationId: conversation.id,
        message: incoming.body,
        userMessageExternalId: incoming.messageId,
        company: context.company,
        knownName: incoming.profileName ?? null,
        deps: managerDeps,
      });

      let accessToken: string;
      try {
        accessToken = decrypt(config.accessToken);
      } catch {
        throw new Error("Falha ao descriptografar o token de acesso do WhatsApp.");
      }

      await doSend({
        phoneNumberId: config.phoneNumberId,
        accessToken,
        to: incoming.from,
        message: processed.response,
      });

      await prisma.conversation.update({
        where: { id: conversation.id },
        data: {
          lastMessage: processed.response,
          lastMessageAt: new Date(),
          unread: true,
        },
      });

      publish(config.companyId, "message", {
        conversationId: conversation.id,
        role: "assistant",
        content: processed.response,
      });
      publish(config.companyId, "conversation", { id: conversation.id });

      result.processed++;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        result.skipped++;
        continue;
      }
      result.failed++;
      const message = error instanceof Error ? error.message : String(error);
      result.errors.push(message);
      await createLog({
        action: "WEBHOOK_FAILED",
        entity: "webhook",
        description: message,
        companyId: result.companyIds[result.companyIds.length - 1] ?? "system",
      });
    }
  }

  return result;
}
