import { logger } from "@/lib/logger/structured";

type CircuitState = "CLOSED" | "OPEN" | "HALF_OPEN";

interface CircuitBreakerConfig {
  failureThreshold: number;
  successThreshold: number;
  openTimeoutMs: number;
  name: string;
}

const defaultConfig: CircuitBreakerConfig = {
  failureThreshold: 5,
  successThreshold: 2,
  openTimeoutMs: 30000,
  name: "unknown",
};

export class CircuitBreaker {
  private state: CircuitState = "CLOSED";
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime = 0;
  private config: CircuitBreakerConfig;

  constructor(config: Partial<CircuitBreakerConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  getState(): CircuitState {
    if (this.state === "OPEN") {
      if (Date.now() - this.lastFailureTime >= this.config.openTimeoutMs) {
        logger.info(`Circuit ${this.config.name} transitioning OPEN -> HALF_OPEN`);
        this.state = "HALF_OPEN";
        this.successCount = 0;
      }
    }
    return this.state;
  }

  async call<T>(fn: () => Promise<T>): Promise<T> {
    const state = this.getState();

    if (state === "OPEN") {
      const error = new Error(`Circuit breaker OPEN: ${this.config.name}`);
      logger.warn(error.message);
      throw error;
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (err) {
      this.onFailure();
      throw err;
    }
  }

  private onSuccess(): void {
    if (this.state === "HALF_OPEN") {
      this.successCount++;
      if (this.successCount >= this.config.successThreshold) {
        logger.info(`Circuit ${this.config.name} transitioning HALF_OPEN -> CLOSED`);
        this.state = "CLOSED";
        this.failureCount = 0;
        this.successCount = 0;
      }
    } else {
      this.failureCount = 0;
    }
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (
      this.failureCount >= this.config.failureThreshold &&
      this.state !== "OPEN"
    ) {
      logger.warn(
        `Circuit ${this.config.name} transitioning ${this.state} -> OPEN (${this.failureCount} failures)`
      );
      this.state = "OPEN";
    }
  }

  reset(): void {
    this.state = "CLOSED";
    this.failureCount = 0;
    this.successCount = 0;
  }
}

export const dbCircuitBreaker = new CircuitBreaker({
  name: "database",
  failureThreshold: 5,
  openTimeoutMs: 30000,
});

export const openaiCircuitBreaker = new CircuitBreaker({
  name: "openai",
  failureThreshold: 3,
  openTimeoutMs: 60000,
});

export const stripeCircuitBreaker = new CircuitBreaker({
  name: "stripe",
  failureThreshold: 5,
  openTimeoutMs: 30000,
});
