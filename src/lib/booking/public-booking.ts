import { prisma } from "@/lib/db/prisma";
import { createLog } from "@/lib/logger";
import { Prisma } from "@prisma/client";
import { normalizeBrazilianPhone } from "@/lib/clients/phone";

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
  while ((match = pattern.exec(raw)) !== null) {
    const startMinutes = Number(match[1]) * 60 + Number(match[2] ?? 0);
    const endMinutes = Number(match[3]) * 60 + Number(match[4] ?? 0);
    if (
      startMinutes >= 0 &&
      startMinutes < 24 * 60 &&
      endMinutes > startMinutes &&
      endMinutes <= 24 * 60
    ) {
      for (let minute = startMinutes; minute < endMinutes; minute += MINUTES_PER_SLOT) {
        const hour = Math.floor(minute / 60);
        const minutes = minute % 60;
        times.push(`${String(hour).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`);
      }
      return times;
    }
  }
  return times;
}

export function isBookingDateAllowed(dateKey: string, now = new Date()): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return false;

  const [year, month, day] = dateKey.split("-").map(Number);
  const candidate = new Date(year, month - 1, day);
  if (
    candidate.getFullYear() !== year ||
    candidate.getMonth() !== month - 1 ||
    candidate.getDate() !== day
  ) {
    return false;
  }

  const firstDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const lastDay = new Date(firstDay);
  lastDay.setDate(lastDay.getDate() + BOOKING_WINDOW_DAYS - 1);
  return candidate >= firstDay && candidate <= lastDay;
}

export async function getAvailableSlots(
  companyId: string,
  dateKey: string,
  hoursRaw: string | null
): Promise<string[]> {
  if (!isBookingDateAllowed(dateKey)) return [];

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
    where: { id: companyId, slug, deletedAt: null, status: "ACTIVE" },
    include: {
      settings: true,
      aiConfig: { include: { services: true } },
    },
  });

  if (!company) {
    return { success: false, message: "Empresa não encontrada" };
  }
  if (!company.settings?.publicBookingEnabled) {
    return { success: false, message: "Agendamento online indisponível para esta empresa" };
  }

  const selectedService = company.aiConfig?.services.find(
    (service) => service.id === input.service || service.name === input.service
  );
  if (!selectedService) {
    return { success: false, message: "Serviço inválido para esta empresa" };
  }

  const available = await getAvailableSlots(companyId, input.date, company.hours);
  if (!available.includes(input.time)) {
    return { success: false, message: "Horário indisponível. Escolha outro horário." };
  }

  const phone = normalizeBrazilianPhone(input.phone);
  let appointment;
  try {
    appointment = await prisma.$transaction(
      async (tx) => {
        const client = await tx.client.upsert({
          where: { companyId_phone: { companyId, phone } },
          update: {
            name: input.name,
            email: input.email,
            lastService: selectedService.name,
            deletedAt: null,
          },
          create: {
            companyId,
            name: input.name,
            phone,
            email: input.email ?? null,
            lastService: selectedService.name,
          },
        });

        return tx.appointment.create({
          data: {
            companyId,
            clientId: client.id,
            name: input.name,
            date: new Date(input.date + "T12:00:00.000Z"),
            time: input.time,
            service: selectedService.name,
            status: "pending",
          },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    );
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { success: false, message: "Horário indisponível. Escolha outro horário." };
    }
    throw error;
  }

  await createLog({
    action: "AI_APPOINTMENT_CREATE",
    entity: "appointment",
    entityId: appointment.id,
    description: `Agendamento online: ${input.name} - ${selectedService.name} em ${input.date} às ${input.time}`,
    companyId,
  });

  return {
    success: true,
    message: "Agendamento realizado com sucesso!",
    appointmentId: appointment.id,
  };
}
