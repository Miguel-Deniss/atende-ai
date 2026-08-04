import { prisma } from "@/lib/db/prisma";
import { createLog } from "@/lib/logger";

const BOOKING_WINDOW_DAYS = 30;
const MINUTES_PER_SLOT = 30;

export interface PublicCompany {
  companyId: string;
  slug: string;
  name: string;
  phone: string | null;
  address: string | null;
  hours: string | null;
  welcomeMessage: string | null;
  services: { id: string; name: string; price: string }[];
  bookingEnabled: boolean;
}

export async function getPublicCompany(slug: string): Promise<PublicCompany | null> {
  const company = await prisma.company.findFirst({
    where: { slug, deletedAt: null, status: "ACTIVE" },
    include: {
      settings: true,
      aiConfig: { include: { services: { orderBy: { createdAt: "asc" } } } },
    },
  });

  if (!company) return null;

  return {
    companyId: company.id,
    slug: company.slug,
    name: company.name,
    phone: company.phone,
    address: company.address,
    hours: company.hours,
    welcomeMessage: company.welcomeMessage ?? company.aiConfig?.welcomeMessage ?? null,
    services: (company.aiConfig?.services ?? []).map((s) => ({
      id: s.id,
      name: s.name,
      price: s.price,
    })),
    bookingEnabled: company.settings?.publicBookingEnabled ?? false,
  };
}

export function getAvailableDates(start: Date, end: Date): string[] {
  const dates: string[] = [];
  const current = new Date(start);
  while (current <= end) {
    dates.push(toDateKey(current));
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseHours(hoursRaw: string | null): string[] {
  if (!hoursRaw) return [];
  const times: string[] = [];
  const raw = hoursRaw.toLowerCase();
  const pattern = /(\d{1,2})[h:.](\d{2})?\s*(?:às|as|-|–|a)?\s*(\d{1,2})[h:.](\d{2})?/g;
  let match: RegExpExecArray | null;
  let hour = 8;
  while ((match = pattern.exec(raw)) !== null) {
    const start = Number(match[1]);
    const end = Number(match[3]);
    if (start >= 0 && start <= 23 && end > start && end <= 24) {
      for (let h = start; h < end; h++) {
        times.push(`${String(h).padStart(2, "0")}:00`);
        times.push(`${String(h).padStart(2, "0")}:30`);
      }
      hour = end;
      return times;
    }
    hour = Math.max(hour, end);
  }
  return times;
}

export async function getAvailableSlots(
  companyId: string,
  dateKey: string,
  hoursRaw: string | null
): Promise<string[]> {
  const slots = parseHours(hoursRaw);
  if (slots.length === 0) return [];

  const start = new Date(dateKey + "T00:00:00.000Z");
  const end = new Date(dateKey + "T23:59:59.999Z");

  const taken = await prisma.appointment.findMany({
    where: {
      companyId,
      deletedAt: null,
      date: { gte: start, lte: end },
    },
    select: { time: true },
  });
  const takenTimes = new Set(taken.map((a) => a.time));

  const now = new Date();
  const isToday = dateKey === toDateKey(now);

  return slots.filter((slot) => {
    if (takenTimes.has(slot)) return false;
    if (isToday) {
      const [h, m] = slot.split(":").map(Number);
      const slotDate = new Date(now);
      slotDate.setHours(h, m, 0, 0);
      if (slotDate <= now) return false;
    }
    return true;
  });
}

export interface PublicBookingInput {
  name: string;
  phone: string;
  email?: string;
  date: string;
  time: string;
  service: string;
}

export async function createPublicBooking(
  companyId: string,
  slug: string,
  input: PublicBookingInput
): Promise<{ success: boolean; message: string; appointmentId?: string }> {
  const company = await prisma.company.findFirst({
    where: { slug, deletedAt: null, status: "ACTIVE" },
    include: { settings: true },
  });

  if (!company) {
    return { success: false, message: "Empresa não encontrada" };
  }
  if (!company.settings?.publicBookingEnabled) {
    return { success: false, message: "Agendamento online indisponível para esta empresa" };
  }

  const available = await getAvailableSlots(companyId, input.date, company.hours);
  if (!available.includes(input.time)) {
    return { success: false, message: "Horário indisponível. Escolha outro horário." };
  }

  const existingClient = await prisma.client.findFirst({
    where: { companyId, phone: input.phone },
  });

  const client = existingClient
    ? await prisma.client.update({
        where: { id: existingClient.id },
        data: { name: input.name, email: input.email ?? existingClient.email, lastService: input.service },
      })
    : await prisma.client.create({
        data: {
          companyId,
          name: input.name,
          phone: input.phone,
          email: input.email ?? null,
          lastService: input.service,
        },
      });

  const appointment = await prisma.appointment.create({
    data: {
      companyId,
      clientId: client.id,
      name: input.name,
      date: new Date(input.date + "T12:00:00.000Z"),
      time: input.time,
      service: input.service,
      status: "pending",
    },
  });

  await createLog({
    action: "AI_APPOINTMENT_CREATE",
    entity: "appointment",
    entityId: appointment.id,
    description: `Agendamento online: ${input.name} - ${input.service} em ${input.date} às ${input.time}`,
    companyId,
  });

  return { success: true, message: "Agendamento realizado com sucesso!", appointmentId: appointment.id };
}
