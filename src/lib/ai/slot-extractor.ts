import { escapeRegExp, normalizeText } from "./text";
import type {
  CompanyContext,
  ConversationSlots,
  ConversationState,
} from "./types";

export interface ExtractionResult {
  slots: Partial<ConversationSlots>;
  changed: boolean;
}

export { normalizeText };

function pad2(value: string | number): string {
  return String(value).padStart(2, "0");
}

const WEEKDAY_MAP: Record<string, string> = {
  segunda: "segunda-feira",
  seg: "segunda-feira",
  terca: "terca-feira",
  ter: "terca-feira",
  quarta: "quarta-feira",
  quinta: "quinta-feira",
  quin: "quinta-feira",
  sexta: "sexta-feira",
  sex: "sexta-feira",
  sabado: "sabado",
  sab: "sabado",
  domingo: "domingo",
  dom: "domingo",
};

export function extractService(
  message: string,
  services: { name: string; price: string }[]
): string | null {
  const normMessage = normalizeText(message);
  let best: string | null = null;

  for (const service of services) {
    const normName = normalizeText(service.name);
    if (!normName) continue;

    const pattern = new RegExp("\\b" + escapeRegExp(normName) + "\\b", "i");
    if (!pattern.test(normMessage)) continue;

    if (best === null || normName.length > normalizeText(best).length) {
      best = service.name;
    }
  }

  return best;
}

export function extractDate(message: string): string | null {
  const m = normalizeText(message);

  if (/\bdepois\s+de\s+amanha\b/.test(m)) return "depois de amanha";
  if (/\bamanha\b/.test(m)) return "amanha";
  if (/\bhoje\b/.test(m)) return "hoje";

  const iso = m.match(/\b(\d{4})-(\d{1,2})-(\d{1,2})\b/);
  if (iso) {
    return iso[1] + "-" + pad2(iso[2]) + "-" + pad2(iso[3]);
  }

  const dayMonth = m.match(/\b(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?\b/);
  if (dayMonth) {
    const day = pad2(dayMonth[1]);
    const month = pad2(dayMonth[2]);
    let year = dayMonth[3];
    if (!year) {
      year = String(new Date().getFullYear());
    } else if (year.length === 2) {
      year = "20" + year;
    }
    return year + "-" + month + "-" + day;
  }

  const dayOnly = m.match(/\bdia\s+(\d{1,2})\b/);
  if (dayOnly) return "dia " + dayOnly[1];

  for (const key of Object.keys(WEEKDAY_MAP)) {
    const pattern = new RegExp("\\b" + key + "\\b", "i");
    if (pattern.test(m)) return WEEKDAY_MAP[key];
  }

  return null;
}

export function extractTime(message: string): string | null {
  const m = normalizeText(message);

  if (/\bmeio\s*dia\b/.test(m)) return "12:00";
  if (/\bmeia\s*noite\b/.test(m)) return "00:00";

  const isAfternoonOrNight = /\b(tarde|noite)\b/.test(m);

  const explicit = m.match(/\b(\d{1,2})\s*[h:](\d{2})\b/);
  if (explicit) {
    let hour = Number(explicit[1]);
    if (isAfternoonOrNight && hour < 12) hour += 12;
    return pad2(hour) + ":" + explicit[2];
  }

  const hourOnly = m.match(/\b(\d{1,2})\s*(?:h|horas?)\b/);
  if (hourOnly) {
    let hour = Number(hourOnly[1]);
    if (isAfternoonOrNight && hour < 12) hour += 12;
    return pad2(hour) + ":00";
  }

  const withPeriod = m.match(/\b(\d{1,2})\s+da\s+(manha|tarde|noite)\b/);
  if (withPeriod) {
    let hour = Number(withPeriod[1]);
    const period = withPeriod[2];
    if (period === "noite" && hour === 12) return "00:00";
    if ((period === "tarde" || period === "noite") && hour < 12) hour += 12;
    return pad2(hour) + ":00";
  }

  return null;
}

const NAME_PATTERNS: RegExp[] = [
  /\bmeu\s+nome\s+[eé]\s+([A-Za-zÀ-ÖØ-öø-ÿ]+)\b/i,
  /\bme\s+chamo\s+([A-Za-zÀ-ÖØ-öø-ÿ]+)\b/i,
  /\b(?:sou\s+o\s+|sou\s+a\s+|eu\s+sou\s+o\s+|eu\s+sou\s+a\s+)([A-Za-zÀ-ÖØ-öø-ÿ]+)\b/i,
  /\bpode\s+me\s+chamar\s+de\s+([A-Za-zÀ-ÖØ-öø-ÿ]+)\b/i,
  /\bnome\s*:\s*([A-Za-zÀ-ÖØ-öø-ÿ]+)\b/i,
];

export function extractName(
  message: string,
  state: ConversationState
): string | null {
  const trimmed = message.trim();

  for (const pattern of NAME_PATTERNS) {
    const match = trimmed.match(pattern);
    if (match) return match[1];
  }

  if (state.step === "waiting_name") {
    const words = trimmed.split(/\s+/).filter(Boolean);
    if (words.length >= 1 && words.length <= 4 && trimmed.length <= 40) {
      return trimmed;
    }
  }

  return null;
}

export function extractSlots(
  message: string,
  state: ConversationState,
  company: CompanyContext
): ExtractionResult {
  const slots: Partial<ConversationSlots> = {};
  let changed = false;

  const services = company.aiConfig?.services ?? [];

  const service = extractService(message, services);
  if (service) {
    slots.service = service;
    changed = true;
  }

  const date = extractDate(message);
  if (date) {
    slots.date = date;
    changed = true;
  }

  const time = extractTime(message);
  if (time) {
    slots.time = time;
    changed = true;
  }

  const name = extractName(message, state);
  if (name) {
    slots.name = name;
    changed = true;
  }

  return { slots, changed };
}
