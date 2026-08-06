import { logger } from "@/lib/logger/structured";
import {
  getRateLimitStore,
  memoryStore,
} from "./store";

export interface RateLimitCheck {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

type Kind = "login" | "default" | "api" | "webhook";

const configs: Record<Kind, RateLimitConfig> = {
  login: {
    windowMs: 15 * 60 * 1000,
    maxRequests: 5,
  },
  default: {
    windowMs: 60 * 1000,
    maxRequests: 30,
  },
  api: {
    windowMs: 60 * 1000,
    maxRequests: 60,
  },
  webhook: {
    windowMs: 60 * 1000,
    maxRequests: 300,
  },
};

async function checkLimit(
  kind: Kind,
  key: string
): Promise<RateLimitCheck> {
  const config = configs[kind];

  try {
    const bucket = await getRateLimitStore().increment(key, config.windowMs);
    return {
      allowed: bucket.count <= config.maxRequests,
      remaining: Math.max(0, config.maxRequests - bucket.count),
      resetAt: bucket.resetAt,
    };
  } catch (error) {
    logger.warn(
      "Rate limit distribuído indisponível, usando armazenamento em memória",
      {
        action: "rate_limit_fallback_memory",
        error: error instanceof Error ? error.message : String(error),
        metadata: { kind, key },
      }
    );
    const bucket = await memoryStore.increment(key, config.windowMs);
    return {
      allowed: bucket.count <= config.maxRequests,
      remaining: Math.max(0, config.maxRequests - bucket.count),
      resetAt: bucket.resetAt,
    };
  }
}

export function checkLoginRateLimit(key: string): Promise<RateLimitCheck> {
  return checkLimit("login", key);
}

export function checkApiRateLimit(key: string): Promise<RateLimitCheck> {
  return checkLimit("api", key);
}

export function checkDefaultRateLimit(key: string): Promise<RateLimitCheck> {
  return checkLimit("default", key);
}

export function checkWebhookRateLimit(key: string): Promise<RateLimitCheck> {
  return checkLimit("webhook", key);
}

export async function resetLoginAttempts(key: string): Promise<void> {
  const config = configs.login;
  try {
    await getRateLimitStore().reset(key, config.windowMs);
  } catch (error) {
    logger.warn("Falha ao resetar rate limit no armazenamento distribuído", {
      action: "rate_limit_reset_failed",
      error: error instanceof Error ? error.message : String(error),
      metadata: { key },
    });
    await memoryStore.reset(key);
  }
}

export function getRateLimitHeaders(
  config: { remaining: number; resetAt: number }
): Record<string, string> {
  return {
    "X-RateLimit-Remaining": String(config.remaining),
    "X-RateLimit-Reset": String(
      Math.ceil((config.resetAt - Date.now()) / 1000)
    ),
  };
}
