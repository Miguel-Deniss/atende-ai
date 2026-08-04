import { describe, it, expect } from "vitest";
import { containsInventedInfo, isGarbageResponse } from "@/lib/ai/guardrails";
import type { CompanyContext } from "@/lib/ai/types";

const company: CompanyContext = {
  name: "Barbearia Teste",
  phone: "(11) 99999-0000",
  aiConfig: {
    services: [
      { name: "Corte", price: "R$ 30" },
      { name: "Barba", price: "R$ 20" },
    ],
    faq: [],
  },
};

describe("containsInventedInfo", () => {
  it("deve retornar null para resposta limpa", () => {
    const issue = containsInventedInfo(
      "Claro! Temos Corte por R$ 30 e Barba por R$ 20. Qual prefere?",
      company
    );
    expect(issue).toBeNull();
  });

  it("deve detectar pagamento aprovado", () => {
    const issue = containsInventedInfo("Seu pagamento aprovado, obrigado!", company);
    expect(issue).toContain("pagamento aprovado");
  });

  it("deve detectar cartao de credito", () => {
    const issue = containsInventedInfo("Aceitamos cartao de credito.", company);
    expect(issue).toContain("cartao de credito");
  });

  it("deve detectar servico fora do cadastro (manicure)", () => {
    const issue = containsInventedInfo("Também fazemos manicure.", company);
    expect(issue).toContain("manicure");
  });

  it("deve detectar produto inventado (perfume)", () => {
    const issue = containsInventedInfo("Temos perfume disponivel.", company);
    expect(issue).toContain("perfume");
  });

  it("deve detectar nome de funcionario inventado", () => {
    const issue = containsInventedInfo("O Carlos vai realizar seu corte.", company);
    expect(issue).toContain("nome de funcionario");
  });

  it("deve retornar null para nome de funcionario inexistente com verbo nao flagrado", () => {
    const issue = containsInventedInfo("O Carlos cuida do seu atendimento.", company);
    expect(issue).toBeNull();
  });

  it("deve retornar null para empresa sem aiConfig", () => {
    const issue = containsInventedInfo(
      "Claro! Qual serviço deseja?",
      { name: "Loja" }
    );
    expect(issue).toBeNull();
  });
});

describe("isGarbageResponse", () => {
  it("deve detectar autorreferencia de modelo de linguagem", () => {
    expect(isGarbageResponse("Sou um modelo de linguagem e não posso fazer isso.")).toBe(true);
  });

  it("deve detectar menção a 'como uma IA'", () => {
    expect(isGarbageResponse("Como uma IA, posso te ajudar com isso.")).toBe(true);
  });

  it("deve detectar 'não tenho consciência'", () => {
    expect(isGarbageResponse("Não tenho consciência nem sentimentos.")).toBe(true);
  });

  it("deve retornar false para resposta normal", () => {
    expect(isGarbageResponse("Claro! Qual serviço você gostaria?")).toBe(false);
  });

  it("deve retornar false para texto vazio", () => {
    expect(isGarbageResponse("")).toBe(false);
  });
});
