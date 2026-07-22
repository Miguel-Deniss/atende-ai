import { describe, it, expect, vi, beforeEach } from "vitest";
import { CircuitBreaker } from "@/lib/resilience/circuit-breaker";

describe("CircuitBreaker", () => {
  let cb: CircuitBreaker;

  beforeEach(() => {
    cb = new CircuitBreaker({
      name: "test",
      failureThreshold: 3,
      successThreshold: 2,
      openTimeoutMs: 50000,
    });
  });

  it("should start in CLOSED state", () => {
    expect(cb.getState()).toBe("CLOSED");
  });

  it("should transition to OPEN after threshold failures", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("fail"));

    for (let i = 0; i < 3; i++) {
      await expect(cb.call(fn)).rejects.toThrow("fail");
    }

    expect(cb.getState()).toBe("OPEN");
  });

  it("should throw CircuitBreakerError when OPEN", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("fail"));
    for (let i = 0; i < 3; i++) {
      await expect(cb.call(fn)).rejects.toThrow("fail");
    }

    const successFn = vi.fn().mockResolvedValue("ok");
    await expect(cb.call(successFn)).rejects.toThrow("Circuit breaker OPEN");
    expect(successFn).not.toHaveBeenCalled();
  });

  it("should transition to HALF_OPEN after timeout", async () => {
    cb = new CircuitBreaker({
      name: "test",
      failureThreshold: 2,
      successThreshold: 1,
      openTimeoutMs: 50,
    });

    const fn = vi.fn().mockRejectedValue(new Error("fail"));
    for (let i = 0; i < 2; i++) {
      await expect(cb.call(fn)).rejects.toThrow("fail");
    }

    expect(cb.getState()).toBe("OPEN");

    await new Promise((resolve) => setTimeout(resolve, 60));

    expect(cb.getState()).toBe("HALF_OPEN");
  });

  it("should transition back to CLOSED after success threshold in HALF_OPEN", async () => {
    cb = new CircuitBreaker({
      name: "test",
      failureThreshold: 1,
      successThreshold: 2,
      openTimeoutMs: 50,
    });

    const failFn = vi.fn().mockRejectedValue(new Error("fail"));
    await expect(cb.call(failFn)).rejects.toThrow("fail");

    expect(cb.getState()).toBe("OPEN");

    await new Promise((resolve) => setTimeout(resolve, 60));

    const successFn = vi.fn().mockResolvedValue("ok");
    await cb.call(successFn);
    expect(cb.getState()).toBe("HALF_OPEN");

    await cb.call(successFn);
    expect(cb.getState()).toBe("CLOSED");
  });

  it("should reopen on failure during HALF_OPEN", async () => {
    cb = new CircuitBreaker({
      name: "test",
      failureThreshold: 1,
      successThreshold: 2,
      openTimeoutMs: 50,
    });

    const failFn = vi.fn().mockRejectedValue(new Error("fail"));
    await expect(cb.call(failFn)).rejects.toThrow("fail");

    await new Promise((resolve) => setTimeout(resolve, 60));

    expect(cb.getState()).toBe("HALF_OPEN");

    await expect(cb.call(failFn)).rejects.toThrow("fail");
    expect(cb.getState()).toBe("OPEN");
  });

  it("should reset to CLOSED state", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("fail"));
    for (let i = 0; i < 3; i++) {
      await expect(cb.call(fn)).rejects.toThrow("fail");
    }
    expect(cb.getState()).toBe("OPEN");

    cb.reset();
    expect(cb.getState()).toBe("CLOSED");
  });
});
