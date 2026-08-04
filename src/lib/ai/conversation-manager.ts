import { prisma } from "@/lib/db/prisma";
import { chat } from "./provider";
import { containsInventedInfo, isGarbageResponse } from "./guardrails";
import { detectIntent, parseConfirmation, type IntentFallback } from "./intention-detector";
import { extractSlots } from "./slot-extractor";
import { buildPrompt } from "./prompt-builder";
import {
  computeAppointmentStep,
  mergeSlots,
  type AppointmentDraft,
} from "./flows/appointment";
import {
  loadConversationState,
  saveConversationState,
} from "./conversation-state";
import { resolveAppointmentDate } from "./appointment-date";
import { createLog } from "@/lib/logger";
import type {
  AIMessage,
  CompanyContext,
  ConversationState,
  LLMMessage,
} from "./types";

export interface SaveMessageParams {
  conversationId: string;
  role: "user" | "assistant";
  content: string;
}

export interface ConversationManagerDeps {
  llm: (messages: LLMMessage[]) => Promise<string>;
  loadState: (conversationId: string) => Promise<ConversationState>;
  saveState: (conversationId: string, state: ConversationState) => Promise<void>;
  saveMessage: (params: SaveMessageParams) => Promise<void>;
  loadRecentMessages: (conversationId: string, limit: number) => Promise<AIMessage[]>;
  persistAppointment?: (draft: AppointmentDraft, conversationId: string) => Promise<void>;
}

export interface ProcessMessageInput {
  conversationId: string;
  message: string;
  company: CompanyContext;
  knownName: string | null;
  deps: ConversationManagerDeps;
  intentFallback?: IntentFallback;
}

export interface ProcessMessageResult {
  response: string;
  state: ConversationState;
  appointmentPersisted: boolean;
}

export async function processMessage(
  input: ProcessMessageInput
): Promise<ProcessMessageResult> {
  const { conversationId, message, company, knownName, deps, intentFallback } =
    input;

  await deps.saveMessage({ conversationId, role: "user", content: message });

  const prevState = await deps.loadState(conversationId);

  const intent = await detectIntent(message, prevState, {
    fallback: intentFallback,
  });

  const extraction = extractSlots(message, prevState, company);

  const needsName = knownName == null || knownName.trim() === "";
  const emptySlots = () => ({
    name: knownName ?? null,
    service: null,
    date: null,
    time: null,
  });

  let slots = prevState.slots;
  let step = prevState.step;
  let confirmed = prevState.confirmed;
  let shouldPersist = false;

  if (intent === "appointment") {
    const freshBooking =
      prevState.step === "finished" || prevState.intent !== "appointment";

    if (freshBooking) {
      slots = emptySlots();
    }

    slots = mergeSlots(slots, extraction.slots);

    if (prevState.step === "confirming") {
      const confirmation = parseConfirmation(message);

      if (confirmation === "yes") {
        confirmed = true;
        step = "finished";
        shouldPersist = true;
      } else if (confirmation === "no") {
        slots.date = null;
        slots.time = null;
        step = computeAppointmentStep(slots, needsName);
      } else {
        step = computeAppointmentStep(slots, needsName);
      }
    } else {
      step = computeAppointmentStep(slots, needsName);
    }
  } else {
    slots = emptySlots();
    step = "idle";
    confirmed = false;
  }

  const state: ConversationState = {
    intent,
    step,
    slots,
    confirmed,
  };

  const history = await deps.loadRecentMessages(conversationId, 3);

  const prompt = buildPrompt({ state, company, history });

  const response = await deps.llm([
    { role: "system", content: prompt.system },
    ...prompt.messages,
  ]);

  const inventedIssue = containsInventedInfo(response, company);
  if (inventedIssue) {
    throw new Error("A IA gerou resposta com informacoes incorretas.");
  }

  if (isGarbageResponse(response)) {
    throw new Error("A IA gerou resposta invalida.");
  }

  let appointmentPersisted = false;

  if (
    shouldPersist &&
    deps.persistAppointment &&
    state.slots.service &&
    state.slots.date &&
    state.slots.time
  ) {
    await deps.persistAppointment(
      {
        service: state.slots.service,
        date: state.slots.date,
        time: state.slots.time,
        name: state.slots.name ?? knownName ?? "Cliente",
      },
      conversationId
    );
    appointmentPersisted = true;
  }

  await deps.saveMessage({
    conversationId,
    role: "assistant",
    content: response,
  });

  await deps.saveState(conversationId, state);

  return { response, state, appointmentPersisted };
}

export function createDefaultDeps(): ConversationManagerDeps {
  return {
    llm: (messages) => chat(messages),
    loadState: (conversationId) => loadConversationState(conversationId),
    saveState: (conversationId, state) =>
      saveConversationState(conversationId, state),
    saveMessage: ({ conversationId, role, content }) =>
      prisma.message
        .create({ data: { conversationId, role, content } })
        .then(() => undefined),
    loadRecentMessages: (conversationId, limit) =>
      prisma.message
        .findMany({
          where: { conversationId },
          orderBy: { createdAt: "desc" },
          take: limit,
        })
        .then(rows =>
          rows
            .slice()
            .reverse()
            .map(row => ({
              role: row.role === "assistant" ? ("assistant" as const) : ("user" as const),
              content: row.content,
            }))
        ),
    persistAppointment: async (draft, conversationId) => {
      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        select: { companyId: true, clientId: true },
      });

      if (!conversation) {
        throw new Error(
          "Conversa nao encontrada para persistir o agendamento."
        );
      }

      if (!/^\d{2}:\d{2}$/.test(draft.time)) {
        throw new Error("Horario do agendamento invalido.");
      }

      const date = resolveAppointmentDate(draft.date);
      if (!date) {
        throw new Error("Nao foi possivel resolver a data do agendamento.");
      }

      const appointment = await prisma.appointment.create({
        data: {
          time: draft.time,
          date,
          name: draft.name,
          service: draft.service,
          status: "pending",
          companyId: conversation.companyId,
          clientId: conversation.clientId ?? undefined,
        },
      });

      await createLog({
        action: "AI_APPOINTMENT_CREATE",
        entity: "appointment",
        entityId: appointment.id,
        description: `Agendamento criado pela IA: ${draft.name} - ${draft.service}`,
        companyId: conversation.companyId,
      });
    },
  };
}
