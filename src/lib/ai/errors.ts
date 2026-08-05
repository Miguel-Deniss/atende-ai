import { logger } from "@/lib/logger/structured";

export type AIErrorKind =
  | "QUOTA_EXCEEDED"
  | "RATE_LIMITED"
  | "TIMEOUT"
  | "PROVIDER_OFFLINE"
  | "CONFIGURATION"
  | "EMPTY_RESPONSE"
  | "INVALID_RESPONSE"
  | "INTERNAL";

export interface AIErrorContext {
  conversationId?: string;
  companyId?: string;
  userId?: string;
  provider?: string;
  action?: string;
}

interface KindSpec {
  code: string;
  retryable: boolean;
  userMessage: string;
  logLevel: "warn" | "error";
}

const KIND_SPECS: Record<AIErrorKind, KindSpec> = {
  QUOTA_EXCEEDED: {
    code: "ai_quota_exceeded",
    retryable: true,
    userMessage:
      "Desculpe, o assistente está temporariamente indisponível. Por favor, tente novamente em alguns instantes.",
    logLevel: "error",
  },
  RATE_LIMITED: {
    code: "ai_rate_limited",
    retryable: true,
    userMessage:
      "Estamos recebendo muitas solicitações no momento. Por favor, tente novamente em alguns minutos.",
    logLevel: "warn",
  },
  TIMEOUT: {
    code: "ai_timeout",
    retryable: true,
    userMessage:
      "O assistente está demorando mais que o esperado. Por favor, tente novamente em alguns instantes.",
    logLevel: "warn",
  },
  PROVIDER_OFFLINE: {
    code: "ai_provider_offline",
    retryable: true,
    userMessage:
      "O assistente está temporariamente indisponível. Por favor, tente novamente em alguns instantes.",
    logLevel: "warn",
  },
  CONFIGURATION: {
    code: "ai_not_configured",
    retryable: false,
    userMessage:
      "O assistente ainda não foi configurado corretamente. Por favor, contate o suporte.",
    logLevel: "error",
  },
  EMPTY_RESPONSE: {
    code: "ai_empty_response",
    retryable: true,
    userMessage:
      "Não consegui responder agora. Por favor, tente novamente.",
    logLevel: "warn",
  },
  INVALID_RESPONSE: {
    code: "ai_invalid_response",
    retryable: true,
    userMessage:
      "Não consegui processar sua solicitação no momento. Pode tentar novamente?",
    logLevel: "warn",
  },
  INTERNAL: {
    code: "ai_internal_error",
    retryable: true,
    userMessage:
      "Algo deu errado ao processar sua solicitação. Por favor, tente novamente em alguns instantes.",
    logLevel: "error",
  },
};

export class AIError extends Error {
  readonly kind: AIErrorKind;
  readonly code: string;
  readonly retryable: boolean;
  readonly userMessage: string;

  constructor(
    message: string,
    kind: AIErrorKind,
    options: { cause?: unknown } = {}
  ) {
    super(message, options);
    this.name = "AIError";
    this.kind = kind;
    this.code = KIND_SPECS[kind].code;
    this.retryable = KIND_SPECS[kind].retryable;
    this.userMessage = KIND_SPECS[kind].userMessage;
  }
}

export function userMessageFor(kind: AIErrorKind): string {
  return KIND_SPECS[kind].userMessage;
}

const KIND_MATCHERS: { kind: AIErrorKind; test: RegExp }[] = [
  {
    kind: "QUOTA_EXCEEDED",
    test:
      /insufficient_quota|quota exceeded|out of credits|billing.*exceed|plan.*limit|usage limit|credit balance/i,
  },
  { kind: "RATE_LIMITED", test: /rate.?limit|429|too many requests/i },
  { kind: "TIMEOUT", test: /timed? ?out|timeout|aborted|abort/ },
  {
    kind: "CONFIGURATION",
    test:
      /n[aã]o configurado|not configured|api.?key|OPENAI_API_KEY|missing api/i,
  },
  {
    kind: "EMPTY_RESPONSE",
    test:
      /n[aã]o gerou conte[uú]do|resposta vazia|vazio|retornou resposta vazia|empty response|eval_count|no content/i,
  },
  {
    kind: "PROVIDER_OFFLINE",
    test:
      /fetch failed|econnrefused|econnreset|enotfound|ehostunreach|etimedout|unavailable|offline|circuit breaker open|http 50[0-9]/i,
  },
  {
    kind: "INVALID_RESPONSE",
    test: /informacoes incorretas|resposta invalida|resposta inv[aá]lida|invented|garbage/i,
  },
];

export function classifyAIError(error: unknown): AIError {
  if (error instanceof AIError) return error;

  const raw = error instanceof Error ? error.message : String(error);
  const message = raw.toLowerCase();

  for (const matcher of KIND_MATCHERS) {
    if (matcher.test.test(message)) {
      return new AIError(raw, matcher.kind, { cause: error });
    }
  }

  return new AIError(raw, "INTERNAL", { cause: error });
}

export function logAIError(error: unknown, context: AIErrorContext = {}) {
  const aiError = classifyAIError(error);
  const spec = KIND_SPECS[aiError.kind];

  const metadata: Record<string, unknown> = {
    kind: aiError.kind,
    code: aiError.code,
    retryable: aiError.retryable,
  };
  if (context.provider) metadata.provider = context.provider;
  if (context.conversationId) metadata.conversationId = context.conversationId;
  if (context.companyId) metadata.companyId = context.companyId;
  if (context.userId) metadata.userId = context.userId;

  const entry = {
    action: context.action ?? "llm_error",
    error: aiError.message,
    metadata,
  };

  if (spec.logLevel === "error") {
    logger.error(`IA indisponível (${aiError.kind})`, entry);
  } else {
    logger.warn(`IA indisponível (${aiError.kind})`, entry);
  }

  return aiError;
}

export function fallbackReplyFor(error: unknown): string {
  return classifyAIError(error).userMessage;
}
