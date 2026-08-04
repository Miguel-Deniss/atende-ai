import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    company: {
      findFirst: vi.fn(),
    },
    appointment: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    client: {
      findFirst: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock("@/lib/logger", () => ({
  createLog: vi.fn(),
}));

import { prisma } from "@/lib/db/prisma";
import { createLog } from "@/lib/logger";
import {
  getPublicCompany,
  getAvailableSlots,
  createPublicBooking,
  getAvailableDates,
} from "@/lib/booking/public-booking";

const now = new Date();

function makeCompany(overrides: Record<string, unknown> = {}) {
  return {
    id: "company-1",
    slug: "barbearia-teste",
    name: "Barbearia Teste",
    phone: "(11) 99999-9999",
    address: "Rua X, 123",
    hours: "08:00 às 18:00",
    welcomeMessage: "Bem-vindo!",
    deletedAt: null,
    status: "ACTIVE",
    settings: { publicBookingEnabled: true },
    aiConfig: {
      welcomeMessage: null,
      services: [
        { id: "s1", name: "Corte", price: "50" },
        { id: "s2", name: "Barba", price: "35" },
      ],
    },
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getPublicCompany", () => {
  it("retorna dados públicos da empresa", async () => {
    (prisma.company.findFirst as any).mockResolvedValue(makeCompany());

    const company = await getPublicCompany("barbearia-teste");

    expect(company).not.toBeNull();
    expect(company?.name).toBe("Barbearia Teste");
    expect(company?.services).toHaveLength(2);
    expect(company?.bookingEnabled).toBe(true);
    expect((prisma.company.findFirst as any).mock.calls[0][0].where.deletedAt).toBeNull();
    expect((prisma.company.findFirst as any).mock.calls[0][0].where.status).toBe("ACTIVE");
  });

  it("retorna null quando empresa não existe", async () => {
    (prisma.company.findFirst as any).mockResolvedValue(null);

    expect(await getPublicCompany("nao-existe")).toBeNull();
  });

  it("desabilita booking quando settings ausentes", async () => {
    (prisma.company.findFirst as any).mockResolvedValue(makeCompany({ settings: null }));

    const company = await getPublicCompany("barbearia-teste");
    expect(company?.bookingEnabled).toBe(false);
  });
});

describe("getAvailableDates", () => {
  it("gera lista de datas dentro do intervalo", () => {
    const start = new Date(2026, 0, 1);
    const end = new Date(2026, 0, 3);
    const dates = getAvailableDates(start, end);
    expect(dates).toEqual(["2026-01-01", "2026-01-02", "2026-01-03"]);
  });
});

describe("getAvailableSlots", () => {
  it("gera slots das 08h às 18h e remove horários ocupados", async () => {
    (prisma.appointment.findMany as any).mockResolvedValue([{ time: "10:00" }]);

    const slots = await getAvailableSlots("company-1", "2026-01-10", "08:00 às 18:00");

    expect(slots).toContain("08:00");
    expect(slots).toContain("17:30");
    expect(slots).not.toContain("10:00");
    expect(slots).not.toContain("18:00");
    expect((prisma.appointment.findMany as any).mock.calls[0][0].where.companyId).toBe("company-1");
  });

  it("retorna lista vazia quando não há horários configurados", async () => {
    const slots = await getAvailableSlots("company-1", "2026-01-10", null);
    expect(slots).toEqual([]);
  });
});

describe("createPublicBooking", () => {
  const input = {
    name: "João",
    phone: "+5511999999999",
    date: "2026-01-10",
    time: "14:30",
    service: "Corte",
  };

  it("cria cliente novo e agendamento pendente", async () => {
    (prisma.company.findFirst as any).mockResolvedValue(makeCompany());
    (prisma.appointment.findMany as any).mockResolvedValue([]);
    (prisma.client.findFirst as any).mockResolvedValue(null);
    (prisma.client.create as any).mockResolvedValue({ id: "client-1" });
    (prisma.appointment.create as any).mockResolvedValue({ id: "appt-1" });

    const result = await createPublicBooking("company-1", "barbearia-teste", input);

    expect(result.success).toBe(true);
    expect(result.appointmentId).toBe("appt-1");
    expect(prisma.client.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ phone: input.phone }) })
    );
    expect(prisma.appointment.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: "pending", clientId: "client-1" }) })
    );
    expect(createLog).toHaveBeenCalled();
  });

  it("reutiliza cliente existente pelo telefone", async () => {
    (prisma.company.findFirst as any).mockResolvedValue(makeCompany());
    (prisma.appointment.findMany as any).mockResolvedValue([]);
    (prisma.client.findFirst as any).mockResolvedValue({ id: "client-1", email: null });
    (prisma.client.update as any).mockResolvedValue({ id: "client-1" });
    (prisma.appointment.create as any).mockResolvedValue({ id: "appt-1" });

    await createPublicBooking("company-1", "barbearia-teste", input);

    expect(prisma.client.update).toHaveBeenCalled();
    expect(prisma.client.create).not.toHaveBeenCalled();
  });

  it("rejeita quando booking está desabilitado", async () => {
    (prisma.company.findFirst as any).mockResolvedValue(
      makeCompany({ settings: { publicBookingEnabled: false } })
    );

    const result = await createPublicBooking("company-1", "barbearia-teste", input);

    expect(result.success).toBe(false);
    expect(result.message).toContain("indisponível");
    expect(prisma.appointment.create).not.toHaveBeenCalled();
  });

  it("rejeita horário já ocupado", async () => {
    (prisma.company.findFirst as any).mockResolvedValue(makeCompany());
    (prisma.appointment.findMany as any).mockResolvedValue([{ time: "14:30" }]);

    const result = await createPublicBooking("company-1", "barbearia-teste", input);

    expect(result.success).toBe(false);
    expect(result.message).toContain("Horário indisponível");
    expect(prisma.appointment.create).not.toHaveBeenCalled();
  });
});
