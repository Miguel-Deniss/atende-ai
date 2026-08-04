import { describe, it, expect } from "vitest";
import {
  conversationStateSchema,
  defaultConversationState,
  parseConversationState,
} from "@/lib/ai/types";

describe("conversationStateSchema", () => {
  it("deve aceitar um estado completo válido", () => {
    const result = conversationStateSchema.safeParse({
      intent: "appointment",
      step: "waiting_date",
      slots: {
        name: "João",
        service: "Barba",
        date: null,
        time: "09:00",
      },
      confirmed: false,
    });

    expect(result.success).toBe(true);
  });

  it("deve preencher valores default quando omitidos", () => {
    const result = conversationStateSchema.safeParse({});
    expect(result.success).toBe(true);
    expect(result.data).toEqual({
      intent: "none",
      step: "idle",
      slots: {
        name: null,
        service: null,
        date: null,
        time: null,
      },
      confirmed: false,
    });
  });

  it("deve rejeitar intent inválida", () => {
    const result = conversationStateSchema.safeParse({ intent: "compra" });
    expect(result.success).toBe(false);
  });

  it("deve rejeitar step inválido", () => {
    const result = conversationStateSchema.safeParse({ step: "pagando" });
    expect(result.success).toBe(false);
  });

  it("deve rejeitar slot com tipo errado", () => {
    const result = conversationStateSchema.safeParse({
      slots: { service: 123 },
    });
    expect(result.success).toBe(false);
  });

  it("deve rejeitar slots com chave desconhecida", () => {
    const result = conversationStateSchema.safeParse({
      slots: { preco: "R$ 30" },
    });
    expect(result.success).toBe(false);
  });
});

describe("defaultConversationState", () => {
  it("deve retornar estado vazio no formato correto", () => {
    expect(defaultConversationState()).toEqual({
      intent: "none",
      step: "idle",
      slots: {
        name: null,
        service: null,
        date: null,
        time: null,
      },
      confirmed: false,
    });
  });

  it("deve retornar um objeto novo a cada chamada", () => {
    const a = defaultConversationState();
    const b = defaultConversationState();
    expect(a).toEqual(b);
    expect(a).not.toBe(b);
    a.slots.service = "Corte";
    expect(b.slots.service).toBeNull();
  });
});

describe("parseConversationState", () => {
  it("deve retornar estado válido quando o valor é válido", () => {
    const state = parseConversationState({
      intent: "faq",
      step: "idle",
      slots: { name: null, service: null, date: null, time: null },
    });
    expect(state.intent).toBe("faq");
  });

  it("deve retornar default para null", () => {
    expect(parseConversationState(null)).toEqual(defaultConversationState());
  });

  it("deve retornar default para undefined", () => {
    expect(parseConversationState(undefined)).toEqual(defaultConversationState());
  });

  it("deve retornar default para valor inválido", () => {
    expect(parseConversationState({ intent: "errado" })).toEqual(
      defaultConversationState()
    );
  });
});
