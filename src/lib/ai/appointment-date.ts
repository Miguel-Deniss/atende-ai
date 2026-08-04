import { normalizeText } from "./text";

const WEEKDAYS = [
  "domingo",
  "segunda-feira",
  "terca-feira",
  "quarta-feira",
  "quinta-feira",
  "sexta-feira",
  "sabado",
];

function startOfDay(value: Date): Date {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function addDays(value: Date, days: number): Date {
  const date = new Date(value);
  date.setDate(date.getDate() + days);
  return date;
}

export function resolveAppointmentDate(
  raw: string,
  base: Date = new Date()
): Date | null {
  const value = normalizeText(raw);
  if (!value) return null;

  const today = startOfDay(base);

  if (value === "hoje") return today;
  if (value === "amanha") return addDays(today, 1);
  if (value === "depois de amanha") return addDays(today, 2);

  const iso = value.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (iso) {
    const year = Number(iso[1]);
    const month = Number(iso[2]);
    const day = Number(iso[3]);
    if (month < 1 || month > 12 || day < 1 || day > 31) return null;
    const date = new Date(year, month - 1, day);
    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      return null;
    }
    return date;
  }

  const dia = value.match(/^dia\s+(\d{1,2})$/);
  if (dia) {
    const day = Number(dia[1]);
    if (day < 1 || day > 31) return null;
    let candidate = new Date(today.getFullYear(), today.getMonth(), day);
    if (candidate < today) {
      candidate = new Date(today.getFullYear(), today.getMonth() + 1, day);
    }
    return candidate;
  }

  const weekday = WEEKDAYS.indexOf(value);
  if (weekday >= 0) {
    let diff = weekday - today.getDay();
    if (diff < 0) diff += 7;
    return addDays(today, diff);
  }

  return null;
}
