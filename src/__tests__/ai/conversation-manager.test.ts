import { describe, it, expect, vi } from "vitest";
import { processMessage, type ConversationManagerDeps } from "@/lib/ai/conversation-manager";
import { defaultConversationState, type AIMessage, type CompanyContext, type ConversationState, type LLMMessage } from "@/lib/ai/types";

const company: CompanyContext = {
  name: "Barbearia Teste",
  phone: "(11) 99999-0000",
  aiConfig: {
    services: [
      { name: "Corte", price: "R$ 30" },
      { name: "Barba", price: "R$ 20" },
    ],
  },
};

function fakeLLM(messages: LLMMessage[]): Promise<string> {
  const system = messages[0]?.content ?? "";
  if (system.includes("falta a DATA")) {
    return Promise.resolve("Claro! Qual dia você prefere?");
  }
  if (system.includes("falta o HORARIO")) {
    return Promise.resolve("Ótimo! Qual horário?");
  }
  if (system.includes("CONFIRMA")) {
    return Promise.resolve("Confirma o agendamento?");
  }
  if (system.includes("ja foi confirmado")) {
    return Promise.resolve("Perfeito, seu agendamento está confirmado!");
  }
  if (system.includes("falta o NOME")) {
    return Promise.resolve("Perfeito! Pode me dizer seu nome?");
  }
  return Promise.resolve("Olá! Como posso ajudar?");
}

function createHarness(knownName: string | null) {
  const messages: AIMessage[] = [];
  let currentState: ConversationState = defaultConversationState();
  const drafts: { draft: unknown; conversationId: string }[] = [];

  const deps: ConversationManagerDeps = {
    llm: fakeLLM,
    loadState: vi.fn(async () => currentState),
    saveState: vi.fn(async (_id, state) => {
      currentState = state;
    }),
    saveMessage: vi.fn(async ({ role, content }) => {
      messages.push({ role, content });
    }),
    loadRecentMessages: vi.fn(async () => messages.slice(-3)),
    persistAppointment: vi.fn(async (draft, conversationId) => {
      drafts.push({ draft, conversationId });
    }),
  };

  return {
    deps,
    messages,
    drafts,
    getState: () => currentState,
    send: (message: string) =>
      processMessage({
        conversationId: "conv-1",
        message,
        company,
        knownName,
        deps,
      }),
  };
}

describe("processMessage — diálogo completo de agendamento", () => {
  it("deve evoluir o estado passo a passo e persistir no fim", async () => {
    const h = createHarness("João");

    const r1 = await h.send("Olá");
    expect(r1.state.intent).toBe("none");
    expect(r1.state.step).toBe("idle");
    expect(r1.response).toContain("Como posso ajudar");

    const r2 = await h.send("Quero marcar uma barba");
    expect(r2.state.intent).toBe("appointment");
    expect(r2.state.slots.service).toBe("Barba");
    expect(r2.state.step).toBe("waiting_date");
    expect(r2.response).toContain("Qual dia");

    const r3 = await h.send("sábado");
    expect(r3.state.slots.date).toBe("sabado");
    expect(r3.state.step).toBe("waiting_time");
    expect(r3.response).toContain("Qual horário");

    const r4 = await h.send("9h");
    expect(r4.state.slots.time).toBe("09:00");
    expect(r4.state.step).toBe("confirming");
    expect(r4.response).toContain("Confirma o agendamento");

    const r5 = await h.send("sim");
    expect(r5.state.step).toBe("finished");
    expect(r5.state.confirmed).toBe(true);
    expect(r5.appointmentPersisted).toBe(true);
    expect(r5.response).toContain("confirmado");
    expect(h.drafts).toHaveLength(1);
    expect(h.drafts[0].draft).toEqual({
      service: "Barba",
      date: "sabado",
      time: "09:00",
      name: "João",
    });
    expect(h.drafts[0].conversationId).toBe("conv-1");
  });

  it("deve coletar o nome quando o cliente é desconhecido", async () => {
    const h = createHarness(null);

    await h.send("Quero marcar uma barba");
    await h.send("sábado");
    await h.send("9h");

    const beforeName = h.getState();
    expect(beforeName.step).toBe("waiting_name");

    const r4 = await h.send("meu nome é João");
    expect(r4.state.slots.name).toBe("João");
    expect(r4.state.step).toBe("confirming");
  });

  it("deve voltar a coletar quando a confirmação é negada", async () => {
    const h = createHarness("João");

    await h.send("Quero marcar uma barba");
    await h.send("sábado");
    await h.send("9h");
    await h.send("não");

    const state = h.getState();
    expect(state.step).toBe("waiting_date");
    expect(state.slots.date).toBeNull();
    expect(state.slots.time).toBeNull();
    expect(state.confirmed).toBe(false);
    expect(h.drafts).toHaveLength(0);
  });

  it("deve permitir novo agendamento após finalizar", async () => {
    const h = createHarness("João");

    await h.send("Quero marcar uma barba");
    await h.send("sábado");
    await h.send("9h");
    await h.send("sim");
    expect(h.drafts).toHaveLength(1);

    const again = await h.send("quero marcar um corte também");
    expect(again.state.slots.service).toBe("Corte");
    expect(again.state.slots.date).toBeNull();
    expect(again.state.step).toBe("waiting_date");
  });

  it("deve confirmar e persistir quando o cliente diz 'exatamente'", async () => {
    const h = createHarness(null);

    await h.send("Quero marcar uma barba");
    await h.send("sábado");
    await h.send("9h");
    await h.send("meu nome é João");

    const before = h.getState();
    expect(before.step).toBe("confirming");
    expect(before.confirmed).toBe(false);

    const r = await h.send("Exatamente");
    expect(r.state.step).toBe("finished");
    expect(r.state.confirmed).toBe(true);
    expect(r.appointmentPersisted).toBe(true);
    expect(h.drafts).toHaveLength(1);
  });

  it("deve permanecer em confirming para confirmação desconhecida", async () => {
    const h = createHarness("João");

    await h.send("Quero marcar uma barba");
    await h.send("sábado");
    await h.send("9h");

    const r = await h.send("obrigado pela ajuda");
    expect(r.state.step).toBe("confirming");
    expect(r.state.confirmed).toBe(false);
    expect(r.appointmentPersisted).toBe(false);
    expect(h.drafts).toHaveLength(0);
  });
});

describe("processMessage — intents simples", () => {
  it("não deve quebrar para pedido de preço", async () => {
    const h = createHarness("João");
    const r = await h.send("quanto custa o corte?");
    expect(r.state.intent).toBe("service");
    expect(r.state.step).toBe("idle");
    expect(r.state.slots.service).toBeNull();
    expect(h.messages.length).toBe(2);
  });

  it("não deve quebrar para falar com humano", async () => {
    const h = createHarness("João");
    const r = await h.send("quero falar com um humano");
    expect(r.state.intent).toBe("human");
    expect(r.state.step).toBe("idle");
  });

  it("não deve quebrar para pergunta de endereço", async () => {
    const h = createHarness("João");
    const r = await h.send("onde vocês ficam?");
    expect(r.state.intent).toBe("faq");
    expect(r.state.step).toBe("idle");
  });

  it("deve preservar as mensagens salvas na ordem", async () => {
    const h = createHarness("João");
    await h.send("Olá");
    await h.send("Quero marcar uma barba");
    expect(h.messages.map(m => m.role)).toEqual([
      "user",
      "assistant",
      "user",
      "assistant",
    ]);
  });

  it("deve barrar resposta com informação inventada", async () => {
    const h = createHarness("João");
    h.deps.llm = async () => "Também fazemos manicure por R$ 50.";
    await expect(h.send("quais serviços têm?")).rejects.toThrow(
      "informacoes incorretas"
    );
  });

  it("deve barrar resposta com autorreferência de IA (garbage)", async () => {
    const h = createHarness("João");
    h.deps.llm = async () => "Sou um modelo de linguagem e não posso agendar.";
    await expect(h.send("quero marcar uma barba")).rejects.toThrow(
      "resposta invalida"
    );
  });
});
