import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    appointment: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("@/lib/security/encryption", () => ({
  decrypt: vi.fn(() => "decrypted-token"),
}));

vi.mock("@/lib/whatsapp/send-message", () => ({
  sendWhatsAppMessage: vi.fn(),
}));

vi.mock("@/lib/email/email-service", () => ({
  sendAppointmentReminderEmail: vi.fn(),
}));

vi.mock("@/lib/email/client", () => ({
  getAppUrl: vi.fn(() => "http://localhost:3000"),
}));

vi.mock("@/lib/logger", () => ({
  createLog: vi.fn(),
}));

import { prisma } from "@/lib/db/prisma";
import { decrypt } from "@/lib/security/encryption";
import { sendWhatsAppMessage } from "@/lib/whatsapp/send-message";
import { sendAppointmentReminderEmail } from "@/lib/email/email-service";
import { runAppointmentReminders } from "@/lib/reminders";

const now = new Date();

function makeAppointment(overrides: Record<string, unknown> = {}) {
  const in10Hours = new Date(now.getTime() + 10 * 60 * 60 * 1000);
  return {
    id: "appt-1",
    time: "14:30",
    date: in10Hours,
    name: "João Silva",
    service: "Corte",
    status: "confirmed",
    reminderSentAt: null,
    companyId: "company-1",
    clientId: "client-1",
    client: {
      id: "client-1",
      name: "João Silva",
      phone: "+5511999999999",
      email: "joao@teste.com",
    },
    company: {
      id: "company-1",
      name: "Barbearia Teste",
      settings: { autoReminders: true },
      whatsAppConfig: {
        status: "CONNECTED",
        accessToken: "encrypted",
        phoneNumberId: "123",
      },
    },
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("runAppointmentReminders", () => {
  it("envia lembrete por WhatsApp e email quando configurado", async () => {
    const appointment = makeAppointment();
    (prisma.appointment.findMany as any).mockResolvedValue([appointment]);
    (prisma.appointment.update as any).mockResolvedValue(appointment);

    const result = await runAppointmentReminders();

    expect(result.scanned).toBe(1);
    expect(result.sent).toBe(1);
    expect(decrypt).toHaveBeenCalledWith("encrypted");
    expect(sendWhatsAppMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "+5511999999999",
        message: expect.stringContaining("Corte"),
      })
    );
    expect(sendAppointmentReminderEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: "joao@teste.com" })
    );
    expect(prisma.appointment.update).toHaveBeenCalledWith({
      where: { id: "appt-1" },
      data: { reminderSentAt: expect.any(Date) },
    });
  });

  it("envia apenas por WhatsApp quando cliente não tem email", async () => {
    const appointment = makeAppointment({
      client: { id: "client-1", name: "João", phone: "+5511999999999", email: null },
    });
    (prisma.appointment.findMany as any).mockResolvedValue([appointment]);
    (prisma.appointment.update as any).mockResolvedValue(appointment);

    const result = await runAppointmentReminders();

    expect(result.sent).toBe(1);
    expect(sendWhatsAppMessage).toHaveBeenCalled();
    expect(sendAppointmentReminderEmail).not.toHaveBeenCalled();
    expect(result.details[0].channel).toBe("whatsapp");
  });

  it("ignora agendamento quando autoReminders está desligado", async () => {
    const appointment = makeAppointment({
      company: {
        id: "company-1",
        name: "Barbearia",
        settings: { autoReminders: false },
        whatsAppConfig: null,
      },
    });
    (prisma.appointment.findMany as any).mockResolvedValue([appointment]);

    const result = await runAppointmentReminders();

    expect(result.skipped).toBe(1);
    expect(result.sent).toBe(0);
    expect(sendWhatsAppMessage).not.toHaveBeenCalled();
  });

  it("ignora agendamento quando cliente não tem contato (sem phone e sem email)", async () => {
    const appointment = makeAppointment({
      client: { id: "client-1", name: "João", phone: null, email: null },
    });
    (prisma.appointment.findMany as any).mockResolvedValue([appointment]);

    const result = await runAppointmentReminders();

    expect(result.skipped).toBe(1);
    expect(result.sent).toBe(0);
  });

  it("marca falha quando envio lança erro", async () => {
    const appointment = makeAppointment({
      client: { id: "client-1", name: "João", phone: "+5511999999999", email: null },
    });
    (prisma.appointment.findMany as any).mockResolvedValue([appointment]);
    (sendWhatsAppMessage as any).mockRejectedValue(new Error("API error"));

    const result = await runAppointmentReminders();

    expect(result.failed).toBe(1);
    expect(result.sent).toBe(0);
    expect(result.details[0].error).toBe("API error");
    expect(prisma.appointment.update).not.toHaveBeenCalled();
  });

  it("filtra apenas agendamentos futuros dentro da janela e sem lembrete enviado", async () => {
    (prisma.appointment.findMany as any).mockResolvedValue([]);

    await runAppointmentReminders();

    const where = (prisma.appointment.findMany as any).mock.calls[0][0].where;
    expect(where.reminderSentAt).toBeNull();
    expect(where.deletedAt).toBeNull();
    expect(where.date.gte).toBeInstanceOf(Date);
    expect(where.date.lte).toBeInstanceOf(Date);
  });
});
