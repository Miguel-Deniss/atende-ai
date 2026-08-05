import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/lib/resilience/circuit-breaker", () => ({
  openaiCircuitBreaker: {
    call: (fn: () => Promise<string>) => fn(),
  },
}));

vi.mock("@/lib/logger/structured", () => ({
  logger: { warn: vi.fn(), info: vi.fn(), error: vi.fn() },
}));

import { chat } from "@/lib/ai/provider";

const originalOllamaUrl = process.env.OLLAMA_URL;
const originalModel = process.env.OLLAMA_MODEL;
const originalOpenAiKey = process.env.OPENAI_API_KEY;
const originalProvider = process.env.AI_PROVIDER;

function mockFetchOnce(response: Response | ((url: string) => Promise<Response>)) {
  const fetchMock = vi.spyOn(globalThis, "fetch");
  if (typeof response === "function") {
    fetchMock.mockImplementation((input) =>
      (response as (url: string) => Promise<Response>)(String(input))
    );
  } else {
    fetchMock.mockResolvedValue(response as Response);
  }
  return fetchMock;
}

function jsonResponse(data: unknown, ok = true): Response {
  return {
    ok,
    status: ok ? 200 : 500,
    text: async () => JSON.stringify(data),
    json: async () => data,
  } as unknown as Response;
}

beforeEach(() => {
  vi.restoreAllMocks();
});

afterEach(() => {
  process.env.OLLAMA_URL = originalOllamaUrl;
  process.env.OLLAMA_MODEL = originalModel;
  process.env.OPENAI_API_KEY = originalOpenAiKey;
  process.env.AI_PROVIDER = originalProvider;
});

describe("chat provider com fallback OpenAI", () => {
  it("usa Ollama quando está online", async () => {
    process.env.AI_PROVIDER = "ollama";
    const fetchMock = mockFetchOnce(jsonResponse({ message: { content: "Resposta Ollama" }, eval_count: 20 }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await chat([{ role: "user", content: "oi" }]);

    expect(result).toBe("Resposta Ollama");
    expect(String(fetchMock.mock.calls[0][0])).toContain("api/chat");
    vi.unstubAllGlobals();
  });

  it("faz fallback para OpenAI quando Ollama falha", async () => {
    process.env.AI_PROVIDER = "ollama";
    process.env.OPENAI_API_KEY = "sk-test";

    let callCount = 0;
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      callCount++;
      if (callCount === 1) {
        return { ok: false, status: 503, text: async () => "unavailable", json: async () => ({}) } as unknown as Response;
      }
      expect(String(input)).toContain("api.openai.com");
      return jsonResponse({ choices: [{ message: { content: "Resposta OpenAI" } }] });
    });

    const result = await chat([{ role: "user", content: "oi" }]);

    expect(result).toBe("Resposta OpenAI");
    expect(callCount).toBe(2);
  });

  it("usa OpenAI diretamente quando AI_PROVIDER=openai", async () => {
    process.env.AI_PROVIDER = "openai";
    process.env.OPENAI_API_KEY = "sk-test";

    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse({ choices: [{ message: { content: "Direto OpenAI" } }] })
    );

    const result = await chat([{ role: "user", content: "oi" }]);

    expect(result).toBe("Direto OpenAI");
    expect(String(fetchMock.mock.calls[0][0])).toContain("api.openai.com");
  });

  it("lança erro quando AI_PROVIDER=openai sem chave", async () => {
    process.env.AI_PROVIDER = "openai";
    process.env.OPENAI_API_KEY = "";

    await expect(chat([{ role: "user", content: "oi" }])).rejects.toThrow("OPENAI_API_KEY");
  });

  it("repassa erro do Ollama quando não há OpenAI configurado", async () => {
    process.env.AI_PROVIDER = "ollama";
    process.env.OPENAI_API_KEY = "";

    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse({}, false)
    );

    await expect(chat([{ role: "user", content: "oi" }])).rejects.toThrow("Ollama HTTP 500");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
