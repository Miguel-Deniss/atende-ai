import { normalizeText } from "./text";
import type { ConversationIntent, ConversationState } from "./types";

export type IntentFallback = (message: string) => Promise<ConversationIntent>;

export interface IntentDetection {
  intent: ConversationIntent;
  confident: boolean;
}

const HUMAN_PATTERNS: RegExp[] = [
  /\b(falar|falo|fala)\s+com\s+(um\s+)?(humano|atendente|pessoa|alguem)\b/i,
  /\bquero\s+(falar|falo)\s+com\b/i,
  /\b(transferir|transferencia)\b/i,
  /\b(atendimento\s+humano)\b/i,
  /\bfalar\s+(no|pelo)\s+telefone\b/i,
];

const CANCEL_PATTERNS: RegExp[] = [
  /\b(cancelar|cancela|desmarcar|remarcar\s+nao)\b/i,
  /\bquero\s+cancelar\b/i,
];

const APPOINTMENT_PATTERNS: RegExp[] = [
  /\b(agendar|marcar|reservar|remarcar)\b/i,
  /\b(horario|horarios)\s+disponivel(is)?\b/i,
  /\b(tem|tem\s+alguma)\s+vaga\b/i,
  /\btem\s+horario\b/i,
  /\b(quero|gostaria|queria|vou)\s+(marcar|agendar|reservar|fazer|cortar)\b/i,
];

const SERVICE_PATTERNS: RegExp[] = [
  /\b(servico|servicos)\b/i,
  /\b(quais|que|quais\s+sao)\s+(os\s+)?servicos\b/i,
  /\b(preco|precos|valor|valores|custo|custa|quanto\s+eh|quanto\s+custa)\b/i,
  /\btabela\s+de\s+precos\b/i,
  /\b(o\s+que|o\s+que\s+voces)\s+(fazem|oferecem)\b/i,
];

const FAQ_PATTERNS: RegExp[] = [
  /\bonde\s+(?:voces\s+)?(?:fica|ficam|eh|e)\b/i,
  /\bcomo\s+(?:chego|chegar|ir)\b/i,
  /\bendereco\b/i,
  /\b(ate\s+que\s+horas|horario\s+de\s+funcionamento|que\s+horas\s+(abre|fecha|abrem|fecham))\b/i,
  /\b(aberto|aberta|fechado|fechada)\s+em\b/i,
  /\b(atende|atendem)\s+(em\s+)?(sabado|domingo|feriado)\b/i,
  /\baceita\s+(cartao|cartoes|pix|dinheiro|pagamento)\b/i,
  /\bestacionamento\b/i,
];

const GREETING_PATTERNS: RegExp[] = [
  /^(ola|oi|eai|e ai|opa|hey|bom dia|boa tarde|boa noite)\b/i,
];

function matchesAny(patterns: RegExp[], text: string): boolean {
  return patterns.some(p => p.test(text));
}

export function parseConfirmation(
  message: string
): "yes" | "no" | "unknown" {
  const m = normalizeText(message);

  if (
    /^(sim|pode|pode sim|pode ser|pode confirmar|pode agendar|confirmo|confirmo sim|confirmado|isso|isso mesmo|exato|exatamente|certamente|com certeza|claro|claro que sim|perfeito|perfeitamente|de acordo|combinado|fechado|fechou|tudo certo|ok|okay|agendado|marcado)\b/.test(
      m
    )
  ) {
    return "yes";
  }

  if (
    /^(nao|nop|nope|nada|deixa|deixa para la|deixa pra la|deixa quieto|vou pensar|mudei de ideia|cancelar|cancela|quero nao|nao quero|nao preciso)\b/.test(
      m
    )
  ) {
    return "no";
  }

  return "unknown";
}

function isPureGreeting(message: string): boolean {
  const norm = normalizeText(message);
  const words = norm.split(/\s+/).filter(Boolean);
  return words.length <= 4 && matchesAny(GREETING_PATTERNS, norm);
}

export function detectIntentSync(
  message: string,
  state: ConversationState
): IntentDetection {
  const norm = normalizeText(message);
  const activeFlow = [
    "waiting_name",
    "waiting_service",
    "waiting_date",
    "waiting_time",
    "confirming",
  ].includes(state.step);

  if (activeFlow) {
    if (matchesAny(HUMAN_PATTERNS, norm)) {
      return { intent: "human", confident: true };
    }
    if (matchesAny(CANCEL_PATTERNS, norm)) {
      return { intent: "other", confident: true };
    }
    return { intent: "appointment", confident: true };
  }

  if (matchesAny(HUMAN_PATTERNS, norm)) {
    return { intent: "human", confident: true };
  }

  if (matchesAny(CANCEL_PATTERNS, norm)) {
    return { intent: "other", confident: true };
  }

  if (matchesAny(APPOINTMENT_PATTERNS, norm)) {
    return { intent: "appointment", confident: true };
  }

  if (matchesAny(SERVICE_PATTERNS, norm)) {
    return { intent: "service", confident: true };
  }

  if (matchesAny(FAQ_PATTERNS, norm)) {
    return { intent: "faq", confident: true };
  }

  if (isPureGreeting(norm)) {
    return { intent: "none", confident: true };
  }

  return { intent: "other", confident: false };
}

export async function detectIntent(
  message: string,
  state: ConversationState,
  options: { fallback?: IntentFallback } = {}
): Promise<ConversationIntent> {
  const detection = detectIntentSync(message, state);

  if (!detection.confident && options.fallback) {
    return options.fallback(message);
  }

  return detection.intent;
}
