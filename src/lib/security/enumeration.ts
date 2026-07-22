import { logger } from "@/lib/logger/structured";

const RATE_WINDOW_MS = 60000;
const MAX_ATTEMPTS = 10;

const requestCounts = new Map<string, { count: number; resetAt: number }>();

export async function checkEnumerationRate(
  identifier: string,
  endpoint: string
): Promise<boolean> {
  const now = Date.now();
  const key = `${endpoint}:${identifier}`;
  let entry = requestCounts.get(key);

  if (!entry || entry.resetAt < now) {
    entry = { count: 0, resetAt: now + RATE_WINDOW_MS };
    requestCounts.set(key, entry);
  }

  entry.count++;

  if (entry.count > MAX_ATTEMPTS) {
    logger.warn(`Potential enumeration attack detected`, {
      action: "enumeration_detected",
      metadata: { identifier, endpoint, count: entry.count },
    });
    return false;
  }

  return true;
}

export function getGenericNotFoundMessage(resourceType: string): string {
  return `${resourceType} não encontrado(a)`;
}

export function getGenericErrorMessage(): string {
  return "Ocorreu um erro. Tente novamente.";
}
