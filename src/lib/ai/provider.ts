import type { LLMMessage } from "./types";

const OLLAMA_URL =
  process.env.OLLAMA_URL ?? "http://localhost:11434";

export async function chat(messages: LLMMessage[]) {
  const payload: Record<string, unknown> = {
    model: process.env.OLLAMA_MODEL ?? "qwen3:8b",
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
