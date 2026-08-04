import type { LLMMessage } from "./types";

export async function chat(messages: LLMMessage[]) {
  const payload: Record<string, unknown> = {
    model: "qwen3:8b",
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

  console.log("===== PAYLOAD OLLAMA =====");
  console.log(JSON.stringify(payload, null, 2));

  const res = await fetch("http://localhost:11434/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("ERRO HTTP OLLAMA:", res.status, errorText);
    throw new Error(`Ollama HTTP ${res.status}: ${errorText}`);
  }

  const data = await res.json();

  console.log("===== RETORNO COMPLETO OLLAMA =====");
  console.log(JSON.stringify(data, null, 2));

  if (data.eval_count !== undefined && data.eval_count <= 3) {
    console.error("OLLAMA: eval_count muito baixo, modelo não gerou conteúdo.", {
      eval_count: data.eval_count,
      prompt_eval_count: data.prompt_eval_count,
      done_reason: data.done_reason,
    });
    throw new Error(`Modelo não gerou conteúdo (eval_count=${data.eval_count})`);
  }

  if (data.done_reason === "stop" && (!data.message?.content || data.message.content.trim() === "")) {
    console.error("OLLAMA: done_reason=stop com conteúdo vazio.", {
      eval_count: data.eval_count,
      prompt_eval_count: data.prompt_eval_count,
    });
    throw new Error("Modelo não gerou conteúdo (vazio com done=stop)");
  }

  const text = data?.message?.content;
  if (!text || text.trim() === "") {
    console.error("OLLAMA RETORNOU RESPOSTA VAZIA", {
      eval_count: data.eval_count,
      prompt_eval_count: data.prompt_eval_count,
    });
    throw new Error("Modelo retornou resposta vazia");
  }

  return text.trim();
}
