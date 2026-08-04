import { describe, it, expect, vi } from "vitest";
import {
  detectIntent,
  detectIntentSync,
  parseConfirmation,
} from "@/lib/ai/intention-detector";
import { defaultConversationState, type ConversationState } from "@/lib/ai/types";

function freshState(): ConversationState {
  return defaultConversationState();
}

function activeState(step: ConversationState["step"]): ConversationState {
  return {
    intent: "appointment",
    step,
    slots: { name: null, service: "Barba", date: "sabado", time: null },
    confirmed: false,
  };
}

describe("detectIntentSync (estado novo)", () => {
  it("deve detectar agendamento por 'marcar'", () => {
    const d = detectIntentSync("Quero marcar uma barba", freshState());
    expect(d.intent).toBe("appointment");
    expect(d.confident).toBe(true);
  });

  it("deve detectar agendamento por 'agendar'", () => {
    const d = detectIntentSync("quero agendar um corte", freshState());
    expect(d.intent).toBe("appointment");
  });

  it("deve detectar agendamento por 'quero fazer'", () => {
    const d = detectIntentSync("quero fazer uma barba", freshState());
    expect(d.intent).toBe("appointment");
  });

  it("deve detectar agendamento por 'tem horario disponivel'", () => {
    const d = detectIntentSync("tem horario disponivel hoje?", freshState());
    expect(d.intent).toBe("appointment");
  });

  it("deve detectar servicos por preco", () => {
    const d = detectIntentSync("quanto custa o corte?", freshState());
    expect(d.intent).toBe("service");
  });

  it("deve detectar servicos por 'quais sao os servicos'", () => {
    const d = detectIntentSync("quais são os serviços?", freshState());
    expect(d.intent).toBe("service");
  });

  it("deve detectar servicos por 'o que voces fazem'", () => {
    const d = detectIntentSync("o que vocês fazem?", freshState());
    expect(d.intent).toBe("service");
  });

  it("deve detectar faq por endereco", () => {
    const d = detectIntentSync("onde vocês ficam?", freshState());
    expect(d.intent).toBe("faq");
  });

  it("deve detectar faq por horario de funcionamento", () => {
    const d = detectIntentSync("até que horas vocês ficam abertos?", freshState());
    expect(d.intent).toBe("faq");
  });

  it("deve detectar faq por pagamento", () => {
    const d = detectIntentSync("aceita cartão?", freshState());
    expect(d.intent).toBe("faq");
  });

  it("deve detectar humano", () => {
    const d = detectIntentSync("quero falar com um humano", freshState());
    expect(d.intent).toBe("human");
  });

  it("deve detectar humano por atendente", () => {
    const d = detectIntentSync("quero falar com um atendente", freshState());
    expect(d.intent).toBe("human");
  });

  it("deve detectar saudação como none", () => {
    const d = detectIntentSync("Olá", freshState());
    expect(d.intent).toBe("none");
    expect(d.confident).toBe(true);
  });

  it("deve detectar 'bom dia' como none", () => {
    const d = detectIntentSync("Bom dia!", freshState());
    expect(d.intent).toBe("none");
  });

  it("deve tratar mensagem desconhecida como other sem confiança", () => {
    const d = detectIntentSync("zxbqwy poqrz", freshState());
    expect(d.intent).toBe("other");
    expect(d.confident).toBe(false);
  });
});

describe("detectIntentSync (fluxo ativo)", () => {
  it("deve manter appointment para 'sim' durante coleta", () => {
    const d = detectIntentSync("sim", activeState("waiting_date"));
    expect(d.intent).toBe("appointment");
  });

  it("deve manter appointment para continuacao com data/hora", () => {
    const d = detectIntentSync("sábado às 9h", activeState("waiting_date"));
    expect(d.intent).toBe("appointment");
  });

  it("deve trocar para human durante fluxo", () => {
    const d = detectIntentSync("quero falar com um humano", activeState("waiting_time"));
    expect(d.intent).toBe("human");
  });

  it("deve trocar para other em cancelamento durante fluxo", () => {
    const d = detectIntentSync("quero cancelar", activeState("confirming"));
    expect(d.intent).toBe("other");
  });
});

describe("detectIntent (com fallback)", () => {
  it("deve usar o fallback quando não houver confiança", async () => {
    const fallback = vi.fn(async () => "faq" as const);
    const intent = await detectIntent("zxbqwy poqrz", freshState(), { fallback });
    expect(intent).toBe("faq");
    expect(fallback).toHaveBeenCalledTimes(1);
  });

  it("não deve chamar o fallback quando a detecção é confiante", async () => {
    const fallback = vi.fn(async () => "faq" as const);
    const intent = await detectIntent("quero marcar uma barba", freshState(), {
      fallback,
    });
    expect(intent).toBe("appointment");
    expect(fallback).not.toHaveBeenCalled();
  });

  it("deve retornar 'other' quando sem fallback", async () => {
    const intent = await detectIntent("zxbqwy poqrz", freshState());
    expect(intent).toBe("other");
  });
});

describe("parseConfirmation", () => {
  it("deve reconhecer sim", () => {
    expect(parseConfirmation("sim")).toBe("yes");
  });

  it("deve reconhecer pode confirmar", () => {
    expect(parseConfirmation("pode confirmar")).toBe("yes");
  });

  it("deve reconhecer exatamente", () => {
    expect(parseConfirmation("Exatamente")).toBe("yes");
  });

  it("deve reconhecer certamente", () => {
    expect(parseConfirmation("certamente")).toBe("yes");
  });

  it("deve reconhecer perfeitamente", () => {
    expect(parseConfirmation("perfeitamente")).toBe("yes");
  });

  it("deve reconhecer de acordo", () => {
    expect(parseConfirmation("de acordo")).toBe("yes");
  });

  it("deve reconhecer pode agendar", () => {
    expect(parseConfirmation("pode agendar")).toBe("yes");
  });

  it("deve reconhecer confirmo sim", () => {
    expect(parseConfirmation("confirmo sim")).toBe("yes");
  });

  it("deve reconhecer nao", () => {
    expect(parseConfirmation("não")).toBe("no");
  });

  it("deve reconhecer cancelar como nao", () => {
    expect(parseConfirmation("cancelar")).toBe("no");
  });

  it("deve reconhecer vou pensar como nao", () => {
    expect(parseConfirmation("vou pensar")).toBe("no");
  });

  it("deve reconhecer mudei de ideia como nao", () => {
    expect(parseConfirmation("mudei de ideia")).toBe("no");
  });

  it("deve retornar unknown para mensagem comum", () => {
    expect(parseConfirmation("sábado às 9h")).toBe("unknown");
  });

  it("deve retornar unknown para texto aleatorio", () => {
    expect(parseConfirmation("obrigado pela ajuda")).toBe("unknown");
  });
});
