import { prisma } from "@/lib/db/prisma";
import type { CompanyContext } from "./types";

export interface LoadedConversationContext {
  conversationId: string;
  company: CompanyContext;
  knownName: string | null;
  handledById: string | null;
  phone: string | null;
}

export async function loadConversationContext(
  conversationId: string,
  companyId: string
): Promise<LoadedConversationContext | null> {
  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, companyId },
    include: {
      client: { select: { name: true } },
      company: {
        select: {
          name: true,
          phone: true,
          address: true,
          hours: true,
          welcomeMessage: true,
          aiConfig: {
            select: {
              personality: true,
              instructions: true,
              services: { select: { name: true, price: true } },
              faq: { select: { question: true, answer: true } },
            },
          },
        },
      },
    },
  });

  if (!conversation) return null;

  const company: CompanyContext = {
    name: conversation.company.name,
    phone: conversation.company.phone,
    address: conversation.company.address,
    hours: conversation.company.hours,
    welcomeMessage: conversation.company.welcomeMessage,
    aiConfig: conversation.company.aiConfig
      ? {
          personality: conversation.company.aiConfig.personality,
          instructions: conversation.company.aiConfig.instructions,
          services: conversation.company.aiConfig.services,
          faq: conversation.company.aiConfig.faq,
        }
      : undefined,
  };

  return {
    conversationId: conversation.id,
    company,
    knownName: conversation.client?.name ?? null,
    handledById: conversation.handledById,
    phone: conversation.phone,
  };
}
