import { prisma } from "@/lib/db/prisma";

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

const defaultConfig: RateLimitConfig = {
  windowMs: 60 * 1000,
  maxRequests: 30,
};

const loginConfig: RateLimitConfig = {
  windowMs: 15 * 60 * 1000,
  maxRequests: 5,
};

const apiConfig: RateLimitConfig = {
  windowMs: 60 * 1000,
  maxRequests: 60,
};

const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const apiAttempts = new Map<string, { count: number; resetAt: number }>();

function checkLimit(
  store: Map<string, { count: number; resetAt: number }>,
  key: string,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  let entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    entry = { count: 0, resetAt: now + config.windowMs };
    store.set(key, entry);
  }

  entry.count++;

  return {
    allowed: entry.count <= config.maxRequests,
    remaining: Math.max(0, config.maxRequests - entry.count),
    resetAt: entry.resetAt,
  };
}

export function checkLoginRateLimit(
  key: string
): { allowed: boolean; remaining: number; resetAt: number } {
  return checkLimit(loginAttempts, key, loginConfig);
}

export function checkApiRateLimit(
  key: string
): { allowed: boolean; remaining: number; resetAt: number } {
  return checkLimit(apiAttempts, key, apiConfig);
}

export function checkDefaultRateLimit(
  key: string
): { allowed: boolean; remaining: number; resetAt: number } {
  return checkLimit(apiAttempts, key, defaultConfig);
}

export function resetLoginAttempts(key: string): void {
  loginAttempts.delete(key);
}

export function getRateLimitHeaders(
  config: { remaining: number; resetAt: number }
): Record<string, string> {
  return {
    "X-RateLimit-Remaining": String(config.remaining),
    "X-RateLimit-Reset": String(Math.ceil((config.resetAt - Date.now()) / 1000)),
  };
}
