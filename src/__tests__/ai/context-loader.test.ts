import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    conversation: {
      findFirst: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/db/prisma";
import { loadConversationContext } from "@/lib/ai/context-loader";

const mockedFindFirst = vi.mocked(prisma.conversation.findFirst);

const conversationRow = {
  id: "conv-1",
  companyId: "company-1",
  client: { name: "João" },
  company: {
    name: "Barbearia Teste",
    phone: "(11) 99999-0000",
    address: null,
    hours: null,
    welcomeMessage: null,
    aiConfig: {
      personality: "Acolhedor",
      instructions: null,
      services: [
        { name: "Corte", price: "R$ 30" },
        { name: "Barba", price: "R$ 20" },
      ],
      faq: [{ question: "Aceita cartão?", answer: "Sim." }],
    },
  },
};

describe("loadConversationContext", () => {
  beforeEach(() => {
    mockedFindFirst.mockReset();
  });

  it("deve retornar null quando a conversa não existe", async () => {
    mockedFindFirst.mockResolvedValue(null as never);
    const result = await loadConversationContext("conv-1", "company-1");
    expect(result).toBeNull();
  });

  it("deve buscar a conversa pelo id e companyId", async () => {
    mockedFindFirst.mockResolvedValue(conversationRow as never);
    await loadConversationContext("conv-1", "company-1");
    expect(mockedFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "conv-1", companyId: "company-1" },
      })
    );
  });

  it("deve montar CompanyContext e knownName a partir do cliente", async () => {
    mockedFindFirst.mockResolvedValue(conversationRow as never);
    const result = await loadConversationContext("conv-1", "company-1");
    expect(result).toEqual({
      conversationId: "conv-1",
      knownName: "João",
      company: {
        name: "Barbearia Teste",
        phone: "(11) 99999-0000",
        address: null,
        hours: null,
        welcomeMessage: null,
        aiConfig: {
          personality: "Acolhedor",
          instructions: null,
          services: [
            { name: "Corte", price: "R$ 30" },
            { name: "Barba", price: "R$ 20" },
          ],
          faq: [{ question: "Aceita cartão?", answer: "Sim." }],
        },
      },
    });
  });

  it("deve retornar knownName null quando não há cliente", async () => {
    const row = { ...conversationRow, client: null };
    mockedFindFirst.mockResolvedValue(row as never);
    const result = await loadConversationContext("conv-1", "company-1");
    expect(result?.knownName).toBeNull();
  });

  it("deve deixar aiConfig indefinido quando a empresa não tem aiConfig", async () => {
    const row = { ...conversationRow, company: { ...conversationRow.company, aiConfig: null } };
    mockedFindFirst.mockResolvedValue(row as never);
    const result = await loadConversationContext("conv-1", "company-1");
    expect(result?.company.aiConfig).toBeUndefined();
  });
});
