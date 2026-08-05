import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    appointment: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("@/lib/auth/api-guard", () => ({
  requirePermission: vi.fn(async () => ({
    user: { id: "user-1", companyId: "company-1" },
    response: undefined,
  })),
}));

vi.mock("@/lib/logger", () => ({
  createLog: vi.fn(),
}));

import { prisma } from "@/lib/db/prisma";
import { createLog } from "@/lib/logger";
import { PATCH, DELETE, GET } from "@/app/api/schedule/[id]/route";

function makeRequest(body?: unknown) {
  return {
    json: async () => body,
  } as any;
}

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

function makeAppointment(overrides: Record<string, unknown> = {}) {
  return {
    id: "appt-1",
    time: "14:00",
    name: "João",
    service: "Corte",
    status: "pending",
    companyId: "company-1",
    deletedAt: null,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  (prisma.appointment.findFirst as any).mockResolvedValue(makeAppointment());
});

describe("GET /api/schedule/[id]", () => {
  it("retorna 404 quando agendamento não pertence à empresa", async () => {
    (prisma.appointment.findFirst as any).mockResolvedValue(null);
    const res = await GET(makeRequest(), makeParams("appt-1"));
    expect(res.status).toBe(404);
    expect((prisma.appointment.findFirst as any).mock.calls[0][0].where.companyId).toBe("company-1");
  });

  it("retorna o agendamento quando encontrado", async () => {
    const res = await GET(makeRequest(), makeParams("appt-1"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.name).toBe("João");
  });
});

describe("PATCH /api/schedule/[id]", () => {
  it("confirma agendamento pendente", async () => {
    (prisma.appointment.update as any).mockResolvedValue(makeAppointment({ status: "confirmed" }));

    const res = await PATCH(makeRequest({ status: "confirmed" }), makeParams("appt-1"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.status).toBe("confirmed");
    expect(prisma.appointment.update).toHaveBeenCalledWith({
      where: { id: "appt-1" },
      data: { status: "confirmed" },
    });
    expect(createLog).toHaveBeenCalledWith(
      expect.objectContaining({ action: "USER_UPDATE", companyId: "company-1" })
    );
  });

  it("rejeita status inválido", async () => {
    const res = await PATCH(makeRequest({ status: "foo" }), makeParams("appt-1"));
    expect(res.status).toBe(400);
    expect(prisma.appointment.update).not.toHaveBeenCalled();
  });

  it("retorna 404 se agendamento não existe", async () => {
    (prisma.appointment.findFirst as any).mockResolvedValue(null);
    const res = await PATCH(makeRequest({ status: "confirmed" }), makeParams("appt-1"));
    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/schedule/[id]", () => {
  it("faz soft-delete e loga DATA_DELETE", async () => {
    (prisma.appointment.update as any).mockResolvedValue(makeAppointment({ deletedAt: new Date() }));

    const res = await DELETE(makeRequest(), makeParams("appt-1"));
    expect(res.status).toBe(200);
    expect(prisma.appointment.update).toHaveBeenCalledWith({
      where: { id: "appt-1" },
      data: { deletedAt: expect.any(Date) },
    });
    expect(createLog).toHaveBeenCalledWith(
      expect.objectContaining({ action: "DATA_DELETE", entityId: "appt-1" })
    );
  });

  it("retorna 404 se agendamento não existe", async () => {
    (prisma.appointment.findFirst as any).mockResolvedValue(null);
    const res = await DELETE(makeRequest(), makeParams("appt-1"));
    expect(res.status).toBe(404);
  });
});
