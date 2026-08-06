import { describe, it, expect, beforeEach } from "vitest";
import {
  checkLoginRateLimit,
  checkApiRateLimit,
  checkDefaultRateLimit,
  resetLoginAttempts,
  getRateLimitHeaders,
} from "@/lib/rate-limit";

describe("Rate Limit", () => {
  beforeEach(async () => {
    await resetLoginAttempts("test-key");
  });

  it("should allow requests under the limit", async () => {
    const result = await checkLoginRateLimit("user-1");
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBeGreaterThanOrEqual(4);
  });

  it("should block requests exceeding the login limit", async () => {
    const key = "brute-force-user";

    for (let i = 0; i < 5; i++) {
      const result = await checkLoginRateLimit(key);
      expect(result.allowed).toBe(true);
    }

    const blocked = await checkLoginRateLimit(key);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  it("should decrement remaining count", async () => {
    const key = "rate-test";
    const first = await checkLoginRateLimit(key);
    expect(first.remaining).toBe(4);

    const second = await checkLoginRateLimit(key);
    expect(second.remaining).toBe(3);
  });

  it("should reset after window expires", async () => {
    const key = "window-test";

    for (let i = 0; i < 5; i++) {
      await checkLoginRateLimit(key);
    }

    let blocked = await checkLoginRateLimit(key);
    expect(blocked.allowed).toBe(false);

    await resetLoginAttempts(key);

    const reset = await checkLoginRateLimit(key);
    expect(reset.allowed).toBe(true);
    expect(reset.remaining).toBe(4);
  });

  it("should handle multiple keys independently", async () => {
    for (let i = 0; i < 5; i++) {
      await checkLoginRateLimit("user-a");
    }
    expect((await checkLoginRateLimit("user-a")).allowed).toBe(false);

    const userB = await checkLoginRateLimit("user-b");
    expect(userB.allowed).toBe(true);
    expect(userB.remaining).toBe(4);
  });

  it("should apply default rate limit", async () => {
    const key = "default-test";
    for (let i = 0; i < 30; i++) {
      expect((await checkDefaultRateLimit(key)).allowed).toBe(true);
    }
    const blocked = await checkDefaultRateLimit(key);
    expect(blocked.remaining).toBe(0);
  });

  it("should apply api rate limit", async () => {
    const key = "api-test";
    for (let i = 0; i < 60; i++) {
      expect((await checkApiRateLimit(key)).allowed).toBe(true);
    }
    expect((await checkApiRateLimit(key)).allowed).toBe(false);
  });

  it("getRateLimitHeaders should return correct headers", () => {
    const headers = getRateLimitHeaders({ remaining: 5, resetAt: Date.now() + 60000 });
    expect(headers["X-RateLimit-Remaining"]).toBe("5");
    expect(Number(headers["X-RateLimit-Reset"])).toBeGreaterThan(0);
    expect(Number(headers["X-RateLimit-Reset"])).toBeLessThanOrEqual(60);
  });
});
