import { describe, it, expect, vi } from "vitest";
import { withRetry, withTimeout } from "@/lib/resilience/retry";

describe("withRetry", () => {
  it("should succeed on first attempt", async () => {
    const fn = vi.fn().mockResolvedValue("ok");
    const result = await withRetry(fn, "test", { maxAttempts: 3 });
    expect(result).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("should retry on failure", async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error("timeout"))
      .mockResolvedValueOnce("ok");

    const result = await withRetry(fn, "test", {
      maxAttempts: 3,
      baseDelayMs: 10,
    });
    expect(result).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("should throw after max attempts", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("connection timeout"));

    await expect(
      withRetry(fn, "test", { maxAttempts: 2, baseDelayMs: 10 })
    ).rejects.toThrow("connection timeout");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("should not retry non-retryable errors", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("validation error"));

    await expect(
      withRetry(fn, "test", { maxAttempts: 3, baseDelayMs: 10 })
    ).rejects.toThrow("validation error");
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

describe("withTimeout", () => {
  it("should resolve before timeout", async () => {
    const result = await withTimeout(
      () => Promise.resolve("ok"),
      1000,
      "test"
    );
    expect(result).toBe("ok");
  });

  it("should reject on timeout", async () => {
    await expect(
      withTimeout(
        () => new Promise((resolve) => setTimeout(resolve, 5000)),
        50,
        "test"
      )
    ).rejects.toThrow("Timeout");
  });
});
