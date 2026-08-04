import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/ai/conversation-manager", () => ({
  processMessage: vi.fn(),
  createDefaultDeps: vi.fn(() => "default-deps"),
}));

import { generateAIResponse } from "@/lib/ai/assistant";
import { processMessage, createDefaultDeps } from "@/lib/ai/conversation-manager";
import type { CompanyContext } from "@/lib/ai/types";

const mockedProcessMessage = vi.mocked(processMessage);
const mockedCreateDefaultDeps = vi.mocked(createDefaultDeps);

const company: CompanyContext = {
  name: "Barbearia Teste",
  aiConfig: { services: [{ name: "Corte", price: "R$ 30" }], faq: [] },
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("generateAIResponse (fachada)", () => {
  it("deve delegar ao processMessage com deps default quando nenhuma deps for passada", async () => {
    mockedProcessMessage.mockResolvedValue({
      response: "Olá! Como posso ajudar?",
      state: {
        intent: "none",
        step: "idle",
        slots: { name: null, service: null, date: null, time: null },
        confirmed: false,
      },
      appointmentPersisted: false,
    });

    const result = await generateAIResponse({
      conversationId: "conv-1",
      message: "Olá",
      company,
      knownName: "João",
    });

    expect(mockedCreateDefaultDeps).toHaveBeenCalled();
    expect(mockedProcessMessage).toHaveBeenCalledWith({
      conversationId: "conv-1",
      message: "Olá",
      company,
      knownName: "João",
      deps: "default-deps",
      intentFallback: undefined,
    });
    expect(result.response).toBe("Olá! Como posso ajudar?");
  });

  it("deve usar as deps injetadas quando fornecidas", async () => {
    mockedProcessMessage.mockResolvedValue({
      response: "Ok",
      state: {
        intent: "appointment",
        step: "confirming",
        slots: { name: "João", service: "Barba", date: "sabado", time: "09:00" },
        confirmed: false,
      },
      appointmentPersisted: false,
    });

    const injected = { custom: true } as never;

    await generateAIResponse({
      conversationId: "conv-1",
      message: "quero marcar",
      company,
      knownName: null,
      deps: injected,
    });

    expect(mockedCreateDefaultDeps).not.toHaveBeenCalled();
    expect(mockedProcessMessage).toHaveBeenCalledWith(
      expect.objectContaining({ deps: injected })
    );
  });

  it("deve repassar o intentFallback quando informado", async () => {
    mockedProcessMessage.mockResolvedValue({
      response: "Ok",
      state: {
        intent: "appointment",
        step: "idle",
        slots: { name: null, service: null, date: null, time: null },
        confirmed: false,
      },
      appointmentPersisted: false,
    });

    const fallback = vi.fn();
    await generateAIResponse({
      conversationId: "conv-1",
      message: "quero marcar",
      company,
      knownName: null,
      intentFallback: fallback,
    });

    expect(mockedProcessMessage).toHaveBeenCalledWith(
      expect.objectContaining({ intentFallback: fallback })
    );
  });
});
