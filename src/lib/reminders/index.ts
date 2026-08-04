import { prisma } from "@/lib/db/prisma";
import { createLog } from "@/lib/logger";
import { decrypt } from "@/lib/security/encryption";
import { sendWhatsAppMessage } from "@/lib/whatsapp/send-message";
import { sendAppointmentReminderEmail } from "@/lib/email/email-service";
import { getAppUrl } from "@/lib/email/client";

export interface ReminderRunResult {
  scanned: number;
  sent: number;
  failed: number;
  skipped: number;
  details: {
    appointmentId: string;
    customerName: string;
    channel: "whatsapp" | "email" | "both" | "none";
    error?: string;
  }[];
}

const REMINDER_WINDOW_HOURS = 24;
const MIN_HOURS_BEFORE = 2;

function formatDateBR(date: Date): string {
  return date.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function buildReminderText(params: {
  companyName: string;
  service: string;
  time: string;
  date: string;
}): string {
  return (
    `Olá! 👋 Lembrete do seu horário em *${params.companyName}*.\n\n` +
    `Serviço: *${params.service}*\n` +
    `Data: *${params.date}*\n` +
    `Horário: *${params.time}*\n\n` +
    `Estamos esperando por você! Se precisar remarcar, responda esta mensagem.`
  );
}

export async function runAppointmentReminders(): Promise<ReminderRunResult> {
  const result: ReminderRunResult = { scanned: 0, sent: 0, failed: 0, skipped: 0, details: [] };

  const now = new Date();
  const windowStart = new Date(now.getTime() + MIN_HOURS_BEFORE * 60 * 60 * 1000);
  const windowEnd = new Date(now.getTime() + REMINDER_WINDOW_HOURS * 60 * 60 * 1000);

  const appointments = await prisma.appointment.findMany({
    where: {
      deletedAt: null,
      reminderSentAt: null,
      date: { gte: windowStart, lte: windowEnd },
    },
    include: {
      company: {
        include: {
          settings: true,
          whatsAppConfig: true,
        },
      },
      client: true,
    },
  });

  result.scanned = appointments.length;

  for (const appointment of appointments) {
    const settings = appointment.company.settings;
    if (!settings?.autoReminders) {
      result.skipped++;
      continue;
    }

    const hasWhatsApp =
      appointment.company.whatsAppConfig?.status === "CONNECTED" &&
      appointment.client?.phone != null;
    const hasEmail = appointment.client?.email != null;

    if (!hasWhatsApp && !hasEmail) {
      result.skipped++;
      continue;
    }

    const reminder = buildReminderText({
      companyName: appointment.company.name,
      service: appointment.service,
      time: appointment.time,
      date: formatDateBR(appointment.date),
    });

    try {
      if (hasWhatsApp && appointment.company.whatsAppConfig && appointment.client?.phone) {
        const accessToken = decrypt(appointment.company.whatsAppConfig.accessToken);
        await sendWhatsAppMessage({
          phoneNumberId: appointment.company.whatsAppConfig.phoneNumberId,
          accessToken,
          to: appointment.client.phone,
          message: reminder,
        });
      }

      if (hasEmail && appointment.client?.email) {
        const rescheduleUrl = `${getAppUrl()}/dashboard/schedule?appointment=${appointment.id}`;
        await sendAppointmentReminderEmail({
          to: appointment.client.email,
          customerName: appointment.client.name ?? appointment.name,
          companyName: appointment.company.name,
          service: appointment.service,
          date: formatDateBR(appointment.date),
          time: appointment.time,
          rescheduleUrl,
          companyId: appointment.companyId,
        });
      }

      await prisma.appointment.update({
        where: { id: appointment.id },
        data: { reminderSentAt: new Date() },
      });

      const channel = hasWhatsApp && hasEmail ? "both" : hasWhatsApp ? "whatsapp" : "email";
      result.sent++;
      result.details.push({ appointmentId: appointment.id, customerName: appointment.name, channel });

      await createLog({
        action: "EMAIL_SENT",
        entity: "appointment",
        entityId: appointment.id,
        description: `Lembrete de agendamento enviado (${channel}) para ${appointment.name}: ${appointment.service} em ${formatDateBR(appointment.date)} às ${appointment.time}`,
        companyId: appointment.companyId,
      });
    } catch (error) {
      result.failed++;
      const message = error instanceof Error ? error.message : String(error);
      result.details.push({
        appointmentId: appointment.id,
        customerName: appointment.name,
        channel: hasWhatsApp && hasEmail ? "both" : hasWhatsApp ? "whatsapp" : "email",
        error: message,
      });

      await createLog({
        action: "EMAIL_FAILED",
        entity: "appointment",
        entityId: appointment.id,
        description: `Falha ao enviar lembrete para ${appointment.name}: ${message}`,
        companyId: appointment.companyId,
      });
    }
  }

  return result;
}
