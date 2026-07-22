import { logger } from "@/lib/logger/structured";

interface RetryConfig {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
  retryableErrors: (err: Error) => boolean;
}

const defaultConfig: RetryConfig = {
  maxAttempts: 3,
  baseDelayMs: 200,
  maxDelayMs: 5000,
  retryableErrors: (err) => {
    const msg = err.message.toLowerCase();
    return (
      msg.includes("timeout") ||
      msg.includes("deadlock") ||
      msg.includes("connection") ||
      msg.includes("econnrefused") ||
      msg.includes("econnreset") ||
      msg.includes("etimedout") ||
      msg.includes("5xx") ||
      msg.includes("rate limit") ||
      msg.includes("too many requests") ||
      msg.includes("service unavailable") ||
      msg.includes("internal server error")
    );
  },
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function calculateDelay(attempt: number, config: RetryConfig): number {
  const delay = config.baseDelayMs * Math.pow(2, attempt - 1);
  const jitter = Math.random() * 0.3 * delay;
  return Math.min(delay + jitter, config.maxDelayMs);
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  operationName: string,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const cfg = { ...defaultConfig, ...config };

  for (let attempt = 1; attempt <= cfg.maxAttempts; attempt++) {
    try {
      const start = Date.now();
      const result = await fn();
      const duration = Date.now() - start;

      if (attempt > 1) {
        logger.info(`Retry succeeded for ${operationName}`, {
          action: "retry_success",
          duration,
          metadata: { attempt },
        });
      }

      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      const isRetryable = cfg.retryableErrors(error);

      logger.warn(`Attempt ${attempt}/${cfg.maxAttempts} failed for ${operationName}`, {
        action: "retry_attempt",
        error: error.message,
        metadata: { attempt, isRetryable },
      });

      if (attempt === cfg.maxAttempts || !isRetryable) {
        throw error;
      }

      const delay = calculateDelay(attempt, cfg);
      await sleep(delay);
    }
  }

  throw new Error(`Unreachable: retry for ${operationName} failed`);
}

export async function withTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number,
  operationName: string
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const result = await Promise.race([
      fn(),
      new Promise<never>((_, reject) => {
        controller.signal.addEventListener("abort", () => {
          reject(new Error(`Timeout after ${timeoutMs}ms: ${operationName}`));
        });
      }),
    ]);
    return result;
  } finally {
    clearTimeout(timeoutId);
  }
}
