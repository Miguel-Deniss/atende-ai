import { describe, it, expect } from "vitest";
import { buildPrompt, objectiveFor } from "@/lib/ai/prompt-builder";
import type { CompanyContext, ConversationState } from "@/lib/ai/types";

const company: CompanyContext = {
  name: "Barbearia Teste",
  phone: "(11) 99999-0000",
  address: "Rua das Flores, 123",
  hours: "Seg a Sab, 9h as 20h",
  aiConfig: {
    services: [
      { name: "Corte", price: "R$ 30" },
      { name: "Barba", price: "R$ 20" },
    ],
    faq: [{ question: "Aceita cartao?", answer: "Sim, aceitamos." }],
  },
};

function makeState(overrides: Partial<ConversationState>): ConversationState {
  return {
    intent: "none",
    step: "idle",
    slots: { name: null, service: null, date: null, time: null },
    confirmed: false,
    ...overrides,
  };
}

describe("objectiveFor", () => {
  it("appointment/waiting_service deve pedir somente o servico", () => {
    const obj = objectiveFor(
      makeState({ intent: "appointment", step: "waiting_service" }),
      company
    );
    expect(obj).toContain("Pergunte QUAL servico");
  });

  it("appointment/waiting_date deve pedir somente a data e nao repetir servicos", () => {
    const obj = objectiveFor(
      makeState({
        intent: "appointment",
        step: "waiting_date",
        slots: { name: null, service: "Barba", date: null, time: null },
      }),
      company
    );
    expect(obj).toContain("falta a DATA");
    expect(obj).toContain("Pergunte SOMENTE");
    expect(obj).toContain("NAO repita os servicos");
    expect(obj).toContain("NAO reinicie o atendimento");
  });

  it("appointment/waiting_time deve pedir somente o horario", () => {
    const obj = objectiveFor(
      makeState({
        intent: "appointment",
        step: "waiting_time",
        slots: { name: null, service: "Barba", date: "sabado", time: null },
      }),
      company
    );
    expect(obj).toContain("falta o HORARIO");
    expect(obj).toContain("Pergunte SOMENTE o horario");
  });

  it("appointment/confirming deve pedir confirmacao", () => {
    const obj = objectiveFor(
      makeState({
        intent: "appointment",
        step: "confirming",
        slots: { name: "João", service: "Barba", date: "sabado", time: "09:00" },
      }),
      company
    );
    expect(obj).toContain("CONFIRMA");
    expect(obj).toContain("Barba");
    expect(obj).toContain("sabado");
    expect(obj).toContain("09:00");
  });

  it("none deve cumprimentar e nao listar servicos", () => {
    const obj = objectiveFor(makeState({}), company);
    expect(obj).toContain("Cumprimente");
    expect(obj).toContain("NAO liste os servicos ainda");
  });

  it("human deve transferir", () => {
    const obj = objectiveFor(
      makeState({ intent: "human", step: "idle" }),
      company
    );
    expect(obj).toContain("transferir");
  });

  it("service deve usar somente a lista", () => {
    const obj = objectiveFor(
      makeState({ intent: "service", step: "idle" }),
      company
    );
    expect(obj).toContain("SOMENTE a lista de servicos");
  });

  it("faq deve responder com dados cadastrados", () => {
    const obj = objectiveFor(makeState({ intent: "faq", step: "idle" }), company);
    expect(obj).toContain("dados cadastrados");
  });
});

describe("buildPrompt", () => {
  it("deve montar system com empresa, servicos, estado e objetivo", () => {
    const state = makeState({
      intent: "appointment",
      step: "waiting_date",
      slots: { name: null, service: "Barba", date: null, time: null },
    });
    const prompt = buildPrompt({
      state,
      company,
      history: [
        { role: "user", content: "quero marcar uma barba" },
        { role: "assistant", content: "Claro! Qual dia?" },
      ],
    });

    expect(prompt.system).toContain("Barbearia Teste");
    expect(prompt.system).toContain("- Corte: R$ 30");
    expect(prompt.system).toContain("P: Aceita cartao?");
    expect(prompt.system).toContain("ESTADO ATUAL DA CONVERSA");
    expect(prompt.system).toContain("OBJETIVO ATUAL");
    expect(prompt.system).toContain("falta a DATA");
  });

  it("deve repassar o historico", () => {
    const prompt = buildPrompt({
      state: makeState({}),
      company,
      history: [{ role: "user", content: "Olá" }],
    });
    expect(prompt.messages).toEqual([{ role: "user", content: "Olá" }]);
  });

  it("deve incluir instrucoes e personalidade quando existirem", () => {
    const companyWithExtras: CompanyContext = {
      ...company,
      aiConfig: {
        ...company.aiConfig!,
        instructions: "Seja direto.",
        personality: "Acolhedor",
      },
    };
    const prompt = buildPrompt({
      state: makeState({}),
      company: companyWithExtras,
      history: [],
    });
    expect(prompt.system).toContain("INSTRUCOES: Seja direto.");
    expect(prompt.system).toContain("PERSONALIDADE: Acolhedor");
  });
});
