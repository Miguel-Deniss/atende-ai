import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    conversation: {
      findUnique: vi.fn(),
    },
    appointment: {
      create: vi.fn(),
    },
    message: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock("@/lib/logger", () => ({
  createLog: vi.fn(async () => {}),
}));

import { prisma } from "@/lib/db/prisma";
import { createLog } from "@/lib/logger";
import { createDefaultDeps, type ConversationManagerDeps } from "@/lib/ai/conversation-manager";

const mockedFindUnique = vi.mocked(prisma.conversation.findUnique);
const mockedCreate = vi.mocked(prisma.appointment.create);
const mockedCreateLog = vi.mocked(createLog);
const mockedFindMany = vi.mocked(prisma.message.findMany);

let deps: ConversationManagerDeps;

beforeEach(() => {
  mockedFindUnique.mockReset();
  mockedCreate.mockReset();
  mockedCreateLog.mockReset();
  mockedFindMany.mockReset();
  deps = createDefaultDeps();
});

describe("createDefaultDeps.loadRecentMessages", () => {
  it("deve buscar as últimas mensagens em ordem desc com take e reverter para ordem cronológica", async () => {
    mockedFindMany.mockResolvedValue([
      { role: "user", content: "amanha" },
      { role: "assistant", content: "Qual dia?" },
      { role: "user", content: "Quero agendar o Corte" },
    ] as never);

    const result = await deps.loadRecentMessages("conv-1", 3);

    expect(mockedFindMany).toHaveBeenCalledWith({
      where: { conversationId: "conv-1" },
      orderBy: { createdAt: "desc" },
      take: 3,
    });

    expect(result).toEqual([
      { role: "user", content: "Quero agendar o Corte" },
      { role: "assistant", content: "Qual dia?" },
      { role: "user", content: "amanha" },
    ]);
  });

  it("deve retornar apenas o limite de mensagens quando há mais no banco", async () => {
    const all = Array.from({ length: 7 }, (_, i) => ({
      role: "user" as const,
      content: "msg-" + (i + 1),
    }));

    mockedFindMany.mockResolvedValue(all.slice(-3).reverse() as never);

    const result = await deps.loadRecentMessages("conv-1", 3);

    expect(result.map(m => m.content)).toEqual(["msg-5", "msg-6", "msg-7"]);
  });
});

describe("createDefaultDeps.persistAppointment", () => {
  it("deve criar o agendamento com data resolvida e vincular o cliente", async () => {
    mockedFindUnique.mockResolvedValue({
      companyId: "company-1",
      clientId: "client-1",
    } as never);
    mockedCreate.mockResolvedValue({ id: "appt-1" } as never);

    await deps.persistAppointment?.(
      { service: "Barba", date: "2026-08-08", time: "09:00", name: "João" },
      "conv-1"
    );

    expect(mockedFindUnique).toHaveBeenCalledWith({
      where: { id: "conv-1" },
      select: { companyId: true, clientId: true },
    });

    expect(mockedCreate).toHaveBeenCalledWith({
      data: {
        time: "09:00",
        date: new Date(2026, 7, 8),
        name: "João",
        service: "Barba",
        status: "pending",
        companyId: "company-1",
        clientId: "client-1",
      },
    });

    expect(mockedCreateLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "AI_APPOINTMENT_CREATE",
        entity: "appointment",
        entityId: "appt-1",
        companyId: "company-1",
      })
    );
  });

  it("deve criar o agendamento sem clientId quando a conversa nao tem cliente", async () => {
    mockedFindUnique.mockResolvedValue({
      companyId: "company-1",
      clientId: null,
    } as never);
    mockedCreate.mockResolvedValue({ id: "appt-2" } as never);

    await deps.persistAppointment?.(
      { service: "Corte", date: "2026-08-09", time: "15:30", name: "Maria" },
      "conv-2"
    );

    expect(mockedCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({ clientId: undefined }),
    });
  });

  it("deve resolver datas relativas", async () => {
    mockedFindUnique.mockResolvedValue({
      companyId: "company-1",
      clientId: null,
    } as never);
    mockedCreate.mockResolvedValue({ id: "appt-3" } as never);

    await deps.persistAppointment?.(
      { service: "Barba", date: "amanha", time: "10:00", name: "João" },
      "conv-3"
    );

    expect(mockedCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({ date: expect.any(Date) }),
    });
  });

  it("deve lançar erro quando a conversa não existe", async () => {
    mockedFindUnique.mockResolvedValue(null as never);

    await expect(
      deps.persistAppointment?.(
        { service: "Barba", date: "2026-08-08", time: "09:00", name: "João" },
        "conv-inexistente"
      )
    ).rejects.toThrow("Conversa nao encontrada");

    expect(mockedCreate).not.toHaveBeenCalled();
  });

  it("deve lançar erro quando a data não pode ser resolvida", async () => {
    mockedFindUnique.mockResolvedValue({
      companyId: "company-1",
      clientId: null,
    } as never);

    await expect(
      deps.persistAppointment?.(
        { service: "Barba", date: "data invalida", time: "09:00", name: "João" },
        "conv-1"
      )
    ).rejects.toThrow("resolver a data");

    expect(mockedCreate).not.toHaveBeenCalled();
  });

  it("deve lançar erro quando o horario é inválido", async () => {
    mockedFindUnique.mockResolvedValue({
      companyId: "company-1",
      clientId: null,
    } as never);

    await expect(
      deps.persistAppointment?.(
        { service: "Barba", date: "2026-08-08", time: "nove horas", name: "João" },
        "conv-1"
      )
    ).rejects.toThrow("Horario do agendamento invalido");

    expect(mockedCreate).not.toHaveBeenCalled();
  });
});
