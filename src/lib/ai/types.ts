import { z } from "zod";

export const conversationSteps = [
  "idle",
  "waiting_name",
  "waiting_service",
  "waiting_date",
  "waiting_time",
  "confirming",
  "finished",
] as const;

export type ConversationStep = (typeof conversationSteps)[number];

export const conversationIntents = [
  "none",
  "appointment",
  "faq",
  "service",
  "human",
  "other",
] as const;

export type ConversationIntent = (typeof conversationIntents)[number];

export const conversationSlotsSchema = z
  .object({
    name: z.string().nullable().default(null),
    service: z.string().nullable().default(null),
    date: z.string().nullable().default(null),
    time: z.string().nullable().default(null),
  })
  .strict();

export type ConversationSlots = z.infer<typeof conversationSlotsSchema>;

export const conversationStateSchema = z.object({
  intent: z.enum(conversationIntents).default("none"),
  step: z.enum(conversationSteps).default("idle"),
  slots: conversationSlotsSchema.default(() => ({
    name: null,
    service: null,
    date: null,
    time: null,
  })),
  confirmed: z.boolean().default(false),
});

export type ConversationState = z.infer<typeof conversationStateSchema>;

export function defaultConversationState(): ConversationState {
  return {
    intent: "none",
    step: "idle",
    slots: {
      name: null,
      service: null,
      date: null,
      time: null,
    },
    confirmed: false,
  };
}

export function parseConversationState(raw: unknown): ConversationState {
  const parsed = conversationStateSchema.safeParse(raw);
  if (!parsed.success) {
    return defaultConversationState();
  }
  return parsed.data;
}

export interface AIMessage {
  role: "user" | "assistant";
  content: string;
}

export type LLMMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export interface CompanyContext {
  name: string;
  phone?: string | null;
  address?: string | null;
  hours?: string | null;
  welcomeMessage?: string | null;
  aiConfig?: {
    personality?: string | null;
    instructions?: string | null;
    services?: { name: string; price: string }[];
    faq?: { question: string; answer: string }[];
  };
}
