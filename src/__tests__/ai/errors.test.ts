import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/logger/structured", () => ({
  logger: { warn: vi.fn(), info: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import {
  AIError,
  classifyAIError,
  logAIError,
  fallbackReplyFor,
  userMessageFor,
} from "@/lib/ai/errors";
import { logger } from "@/lib/logger/structured";

describe("classifyAIError", () => {
  it("deve classificar quota excedida", () => {
    const err = classifyAIError(
      new Error("OpenAI HTTP 429: insufficient_quota")
    );
    expect(err.kind).toBe("QUOTA_EXCEEDED");
    expect(err.code).toBe("ai_quota_exceeded");
    expect(err.retryable).toBe(true);
    expect(err.message).toContain("insufficient_quota");
  });

  it("deve classificar rate limit", () => {
    const err = classifyAIError(new Error("Rate limit reached: 429"));
    expect(err.kind).toBe("RATE_LIMITED");
    expect(err.retryable).toBe(true);
  });

  it("deve classificar timeout", () => {
    const err = classifyAIError(new Error("The request timed out after 10s"));
    expect(err.kind).toBe("TIMEOUT");
  });

  it("deve classificar provider offline", () => {
    const err = classifyAIError(new Error("fetch failed"));
    expect(err.kind).toBe("PROVIDER_OFFLINE");
  });

  it("deve classificar HTTP 503 como provider offline", () => {
    const err = classifyAIError(new Error("Ollama HTTP 503: Service Unavailable"));
    expect(err.kind).toBe("PROVIDER_OFFLINE");
  });

  it("deve classificar configuração ausente", () => {
    const err = classifyAIError(
      new Error("AI_PROVIDER=openai mas OPENAI_API_KEY não configurado")
    );
    expect(err.kind).toBe("CONFIGURATION");
    expect(err.retryable).toBe(false);
  });

  it("deve classificar resposta vazia", () => {
    const err = classifyAIError(new Error("Modelo retornou resposta vazia"));
    expect(err.kind).toBe("EMPTY_RESPONSE");
  });

  it("deve classificar resposta inválida (guardrail)", () => {
    const err = classifyAIError(
      new Error("A IA gerou resposta com informacoes incorretas.")
    );
    expect(err.kind).toBe("INVALID_RESPONSE");
  });

  it("deve classificar como interno erros desconhecidos", () => {
    const err = classifyAIError(new Error("Alguma falha estranha"));
    expect(err.kind).toBe("INTERNAL");
  });

  it("deve preservar AIError já classificado", () => {
    const original = new AIError("x", "TIMEOUT");
    expect(classifyAIError(original)).toBe(original);
  });

  it("deve tratar valores não-Error", () => {
    const err = classifyAIError("string crua");
    expect(err.kind).toBe("INTERNAL");
    expect(err.message).toBe("string crua");
  });
});

describe("fallbackReplyFor e userMessageFor", () => {
  it("deve retornar mensagem amigável que nunca expõe o erro bruto", () => {
    const msg = fallbackReplyFor(
      new Error("OpenAI HTTP 429: insufficient_quota ... detalhes internos")
    );
    expect(msg).not.toContain("insufficient_quota");
    expect(msg).not.toContain("HTTP");
    expect(msg.length).toBeGreaterThan(10);
  });

  it("deve prover mensagem por kind", () => {
    expect(userMessageFor("QUOTA_EXCEEDED")).toBeTruthy();
    expect(userMessageFor("INTERNAL")).toBeTruthy();
  });
});

describe("logAIError", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve registrar log estruturado com kind, code e contexto", () => {
    const err = new Error("fetch failed: ECONNREFUSED");
    logAIError(err, {
      conversationId: "conv-1",
      companyId: "company-1",
      action: "llm_fallback_reply",
    });

    expect(logger.warn).toHaveBeenCalled();
    const [message, meta] = vi.mocked(logger.warn).mock.calls[0] as [
      string,
      { action?: string; error?: string; metadata?: Record<string, unknown> },
    ];
    expect(message).toContain("PROVIDER_OFFLINE");
    expect(meta?.action).toBe("llm_fallback_reply");
    expect(meta?.error).toContain("ECONNREFUSED");
    expect(meta?.metadata).toMatchObject({
      kind: "PROVIDER_OFFLINE",
      code: "ai_provider_offline",
      conversationId: "conv-1",
      companyId: "company-1",
    });
  });

  it("deve usar logger.error para falhas críticas (quota)", () => {
    logAIError(new Error("OpenAI HTTP 429: insufficient_quota"));
    expect(logger.error).toHaveBeenCalled();
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it("deve retornar o AIError classificado", () => {
    const result = logAIError(new Error("fetch failed"));
    expect(result).toBeInstanceOf(AIError);
    expect(result.kind).toBe("PROVIDER_OFFLINE");
  });
});
