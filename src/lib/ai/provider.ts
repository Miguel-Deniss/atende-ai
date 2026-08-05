import type { LLMMessage } from "./types";
import { openaiCircuitBreaker } from "@/lib/resilience/circuit-breaker";
import { logger } from "@/lib/logger/structured";

const OLLAMA_URL =
  process.env.OLLAMA_URL ?? "http://localhost:11434";

const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? "qwen3:8b";

const OPENAI_MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

function hasOpenAIConfig(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

async function chatWithOllama(messages: LLMMessage[]): Promise<string> {
  const payload: Record<string, unknown> = {
    model: OLLAMA_MODEL,
    messages,
    stream: false,
    think: false,
    options: {
      temperature: 0.2,
      top_p: 0.9,
      repeat_penalty: 1.1,
      num_ctx: 8192,
      num_predict: 512,
    },
  };

  const res = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Ollama HTTP ${res.status}: ${errorText}`);
  }

  const data = await res.json();

  if (data.eval_count !== undefined && data.eval_count <= 3) {
    throw new Error(`Modelo não gerou conteúdo (eval_count=${data.eval_count})`);
  }

  if (data.done_reason === "stop" && (!data.message?.content || data.message.content.trim() === "")) {
    throw new Error("Modelo não gerou conteúdo (vazio com done=stop)");
  }

  const text = data?.message?.content;
  if (!text || text.trim() === "") {
    throw new Error("Modelo retornou resposta vazia");
  }

  return text.trim();
}

async function chatWithOpenAI(messages: LLMMessage[]): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY não configurado");
  }

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages,
      temperature: 0.2,
      max_tokens: 512,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`OpenAI HTTP ${res.status}: ${errorText}`);
  }

  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text || text.trim() === "") {
    throw new Error("OpenAI retornou resposta vazia");
  }

  return text.trim();
}

export async function chat(messages: LLMMessage[]): Promise<string> {
  const provider = process.env.AI_PROVIDER ?? "ollama";

  if (provider === "openai") {
    if (!hasOpenAIConfig()) {
      throw new Error("AI_PROVIDER=openai mas OPENAI_API_KEY não configurado");
    }
    return openaiCircuitBreaker.call(() => chatWithOpenAI(messages));
  }

  try {
    return await chatWithOllama(messages);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if (hasOpenAIConfig()) {
      logger.warn(`Ollama falhou, usando fallback OpenAI: ${message}`, {
        action: "llm_fallback_openai",
        metadata: { provider, ollamaError: message },
      });
      return openaiCircuitBreaker.call(() => chatWithOpenAI(messages));
    }

    throw error;
  }
}
