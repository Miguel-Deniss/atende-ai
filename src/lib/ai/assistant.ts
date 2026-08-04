import {
  createDefaultDeps,
  processMessage,
  type ConversationManagerDeps,
  type ProcessMessageResult,
} from "./conversation-manager";
import type { IntentFallback } from "./intention-detector";
import type { CompanyContext } from "./types";

export type { CompanyContext } from "./types";

export interface GenerateAIInput {
  conversationId: string;
  message: string;
  company: CompanyContext;
  knownName: string | null;
  deps?: ConversationManagerDeps;
  intentFallback?: IntentFallback;
}

export async function generateAIResponse(
  input: GenerateAIInput
): Promise<ProcessMessageResult> {
  return processMessage({
    conversationId: input.conversationId,
    message: input.message,
    company: input.company,
    knownName: input.knownName,
    deps: input.deps ?? createDefaultDeps(),
    intentFallback: input.intentFallback,
  });
}
