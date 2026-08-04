import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    conversation: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/db/prisma";
import { Prisma } from "@prisma/client";
import {
  loadConversationState,
  saveConversationState,
  clearConversationState,
} from "@/lib/ai/conversation-state";
import { defaultConversationState, type ConversationState } from "@/lib/ai/types";

const mockedFindUnique = vi.mocked(prisma.conversation.findUnique);
const mockedUpdate = vi.mocked(prisma.conversation.update);

describe("loadConversationState", () => {
  beforeEach(() => {
    mockedFindUnique.mockReset();
    mockedUpdate.mockReset();
  });

  it("deve retornar default quando a conversa não existe", async () => {
    mockedFindUnique.mockResolvedValue(null as never);
    const state = await loadConversationState("conv-1");
    expect(state).toEqual(defaultConversationState());
  });

  it("deve retornar default quando state é null", async () => {
    mockedFindUnique.mockResolvedValue({ state: null } as never);
    const state = await loadConversationState("conv-1");
    expect(state).toEqual(defaultConversationState());
  });

  it("deve retornar o estado quando válido", async () => {
    const saved: ConversationState = {
      intent: "appointment",
      step: "waiting_date",
      slots: { name: "João", service: "Barba", date: null, time: null },
      confirmed: false,
    };
    mockedFindUnique.mockResolvedValue({ state: saved } as never);

    const state = await loadConversationState("conv-1");
    expect(state).toEqual(saved);
  });

  it("deve retornar default quando state é inválido no banco", async () => {
    mockedFindUnique.mockResolvedValue({ state: { intent: "invalido" } } as never);
    const state = await loadConversationState("conv-1");
    expect(state).toEqual(defaultConversationState());
  });

  it("deve buscar apenas o campo state", async () => {
    mockedFindUnique.mockResolvedValue({ state: null } as never);
    await loadConversationState("conv-1");
    expect(mockedFindUnique).toHaveBeenCalledWith({
      where: { id: "conv-1" },
      select: { state: true },
    });
  });
});

describe("saveConversationState", () => {
  beforeEach(() => {
    mockedFindUnique.mockReset();
    mockedUpdate.mockReset();
  });

  it("deve persistir um estado válido", async () => {
    mockedUpdate.mockResolvedValue({} as never);
    const state: ConversationState = {
      intent: "appointment",
      step: "waiting_time",
      slots: { name: "João", service: "Barba", date: "2026-08-08", time: null },
      confirmed: false,
    };

    await saveConversationState("conv-1", state);

    expect(mockedUpdate).toHaveBeenCalledWith({
      where: { id: "conv-1" },
      data: { state },
    });
  });

  it("deve lançar erro para estado inválido e não chamar update", async () => {
    const invalid = {
      intent: "appointment",
      step: "step_invalido",
      slots: { name: "João", service: "Barba", date: null, time: null },
      confirmed: false,
    };

    await expect(
      saveConversationState("conv-1", invalid as unknown as ConversationState)
    ).rejects.toThrow("Estado de conversa inválido");

    expect(mockedUpdate).not.toHaveBeenCalled();
  });
});

describe("clearConversationState", () => {
  it("deve gravar state como null", async () => {
    mockedUpdate.mockResolvedValue({} as never);

    await clearConversationState("conv-1");

    expect(mockedUpdate).toHaveBeenCalledWith({
      where: { id: "conv-1" },
      data: { state: Prisma.DbNull },
    });
  });
});
