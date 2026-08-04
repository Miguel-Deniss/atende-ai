import { describe, it, expect } from "vitest";
import {
  extractService,
  extractDate,
  extractTime,
  extractName,
  extractSlots,
} from "@/lib/ai/slot-extractor";
import {
  defaultConversationState,
  type CompanyContext,
  type ConversationState,
} from "@/lib/ai/types";

const company: CompanyContext = {
  name: "Barbearia Teste",
  aiConfig: {
    services: [
      { name: "Corte", price: "R$ 30" },
      { name: "Barba", price: "R$ 20" },
      { name: "Corte Masculino", price: "R$ 40" },
    ],
  },
};

function state(step: ConversationState["step"] = "idle"): ConversationState {
  const base = defaultConversationState();
  return { ...base, step };
}

describe("extractService", () => {
  const services = company.aiConfig!.services!;

  it("deve extrair Barba de 'quero marcar uma barba'", () => {
    expect(extractService("Quero marcar uma barba", services)).toBe("Barba");
  });

  it("deve extrair Corte de 'quero um corte'", () => {
    expect(extractService("quero um corte", services)).toBe("Corte");
  });

  it("deve preferir o nome mais longo (Corte Masculino sobre Corte)", () => {
    expect(extractService("quero um corte masculino", services)).toBe(
      "Corte Masculino"
    );
  });

  it("deve ignorar acentos", () => {
    expect(extractService("quero um cabelo e barba", services)).toBe("Barba");
  });

  it("deve retornar null sem servico na mensagem", () => {
    expect(extractService("Olá", services)).toBeNull();
  });

  it("deve retornar null quando nao ha servicos cadastrados", () => {
    expect(extractService("quero uma barba", [])).toBeNull();
  });
});

describe("extractDate", () => {
  it("deve extrair sabado", () => {
    expect(extractDate("sábado")).toBe("sabado");
  });

  it("deve extrair amanha", () => {
    expect(extractDate("amanhã")).toBe("amanha");
  });

  it("deve extrair hoje", () => {
    expect(extractDate("hoje")).toBe("hoje");
  });

  it("deve extrair segunda-feira", () => {
    expect(extractDate("segunda-feira")).toBe("segunda-feira");
  });

  it("deve priorizar 'depois de amanha'", () => {
    expect(extractDate("depois de amanhã")).toBe("depois de amanha");
  });

  it("deve normalizar ISO", () => {
    expect(extractDate("2026-08-15")).toBe("2026-08-15");
  });

  it("deve normalizar dd/mm com ano atual", () => {
    const year = String(new Date().getFullYear());
    expect(extractDate("15/08")).toBe(year + "-08-15");
  });

  it("deve extrair 'dia 15'", () => {
    expect(extractDate("dia 15")).toBe("dia 15");
  });

  it("deve retornar null sem data", () => {
    expect(extractDate("quero um corte")).toBeNull();
  });
});

describe("extractTime", () => {
  it("deve normalizar 9h", () => {
    expect(extractTime("9h")).toBe("09:00");
  });

  it("deve normalizar 09:30", () => {
    expect(extractTime("09:30")).toBe("09:30");
  });

  it("deve normalizar 9h30", () => {
    expect(extractTime("9h30")).toBe("09:30");
  });

  it("deve converter 9 da noite para 21:00", () => {
    expect(extractTime("as 9 da noite")).toBe("21:00");
  });

  it("deve manter 9 da manha como 09:00", () => {
    expect(extractTime("9 da manhã")).toBe("09:00");
  });

  it("deve normalizar meio dia", () => {
    expect(extractTime("meio dia")).toBe("12:00");
  });

  it("deve normalizar meia noite", () => {
    expect(extractTime("meia noite")).toBe("00:00");
  });

  it("deve retornar null sem horario", () => {
    expect(extractTime("quero um corte")).toBeNull();
  });
});

describe("extractName", () => {
  it("deve extrair nome de 'meu nome e João'", () => {
    expect(extractName("meu nome é João", state())).toBe("João");
  });

  it("deve extrair nome de 'me chamo Maria'", () => {
    expect(extractName("me chamo Maria", state())).toBe("Maria");
  });

  it("deve extrair nome de 'sou o Pedro'", () => {
    expect(extractName("sou o Pedro", state())).toBe("Pedro");
  });

  it("deve extrair nome simples durante waiting_name", () => {
    expect(extractName("João Silva", state("waiting_name"))).toBe("João Silva");
  });

  it("nao deve extrair nome simples fora de waiting_name", () => {
    expect(extractName("João Silva", state("idle"))).toBeNull();
  });
});

describe("extractSlots", () => {
  it("deve extrair servico, data e horario juntos", () => {
    const result = extractSlots(
      "quero marcar uma barba para sábado às 9h",
      state(),
      company
    );
    expect(result.changed).toBe(true);
    expect(result.slots).toEqual({
      service: "Barba",
      date: "sabado",
      time: "09:00",
    });
  });

  it("deve retornar vazio para saudacao", () => {
    const result = extractSlots("Olá", state(), company);
    expect(result.changed).toBe(false);
    expect(result.slots).toEqual({});
  });
});
