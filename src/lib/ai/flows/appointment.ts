import type { ConversationSlots, ConversationStep } from "../types";

export interface AppointmentDraft {
  service: string;
  date: string;
  time: string;
  name: string;
}

export function mergeSlots(
  current: ConversationSlots,
  extracted: Partial<ConversationSlots>
): ConversationSlots {
  const next: ConversationSlots = { ...current };

  if (extracted.service !== undefined && extracted.service !== next.service) {
    next.service = extracted.service;
    next.date = null;
    next.time = null;
  }

  if (extracted.date !== undefined && extracted.date !== next.date) {
    next.date = extracted.date;
    next.time = null;
  }

  if (extracted.time !== undefined) {
    next.time = extracted.time;
  }

  if (extracted.name !== undefined) {
    next.name = extracted.name;
  }

  return next;
}

export function computeAppointmentStep(
  slots: ConversationSlots,
  needsName: boolean
): ConversationStep {
  if (!slots.service) return "waiting_service";
  if (!slots.date) return "waiting_date";
  if (!slots.time) return "waiting_time";
  if (needsName && !slots.name) return "waiting_name";
  return "confirming";
}
