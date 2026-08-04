import { prisma } from "@/lib/db/prisma";
import { Prisma } from "@prisma/client";
import {
  conversationStateSchema,
  defaultConversationState,
  type ConversationState,
} from "./types";

export async function loadConversationState(
  conversationId: string
): Promise<ConversationState> {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { state: true },
  });

  if (!conversation?.state) {
    return defaultConversationState();
  }

  const parsed = conversationStateSchema.safeParse(conversation.state);
  if (!parsed.success) {
    console.error("Estado de conversa inválido no banco, usando default:", {
      conversationId,
      error: parsed.error.flatten(),
    });
    return defaultConversationState();
  }

  return parsed.data;
}

export async function saveConversationState(
  conversationId: string,
  state: ConversationState
): Promise<void> {
  const parsed = conversationStateSchema.safeParse(state);
  if (!parsed.success) {
    console.error("Tentativa de salvar estado inválido:", {
      conversationId,
      error: parsed.error.flatten(),
    });
    throw new Error("Estado de conversa inválido");
  }

  await prisma.conversation.update({
    where: { id: conversationId },
    data: { state: parsed.data },
  });
}

export async function clearConversationState(
  conversationId: string
): Promise<void> {
  await prisma.conversation.update({
    where: { id: conversationId },
    data: { state: Prisma.DbNull },
  });
}
