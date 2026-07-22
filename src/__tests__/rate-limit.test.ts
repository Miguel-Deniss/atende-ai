import { describe, it, expect, beforeEach } from "vitest";
import {
  checkLoginRateLimit,
  checkApiRateLimit,
  checkDefaultRateLimit,
  resetLoginAttempts,
  getRateLimitHeaders,
} from "@/lib/rate-limit";

describe("Rate Limit", () => {
  beforeEach(() => {
    resetLoginAttempts("test-key");
  });

  it("should allow requests under the limit", () => {
    const result = checkLoginRateLimit("user-1");
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBeGreaterThanOrEqual(4);
  });

  it("should block requests exceeding the login limit", () => {
    const key = "brute-force-user";

    for (let i = 0; i < 5; i++) {
      const result = checkLoginRateLimit(key);
      if (i < 5) {
        expect(result.allowed).toBe(true);
      }
    }

    const blocked = checkLoginRateLimit(key);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  it("should decrement remaining count", () => {
    const key = "rate-test";
    const first = checkLoginRateLimit(key);
    expect(first.remaining).toBe(4);

    const second = checkLoginRateLimit(key);
    expect(second.remaining).toBe(3);
  });

  it("should reset after window expires", async () => {
    const key = "window-test";

    for (let i = 0; i < 5; i++) {
      checkLoginRateLimit(key);
    }

    let blocked = checkLoginRateLimit(key);
    expect(blocked.allowed).toBe(false);

    resetLoginAttempts(key);

    const reset = checkLoginRateLimit(key);
    expect(reset.allowed).toBe(true);
    expect(reset.remaining).toBe(4);
  });

  it("should handle multiple keys independently", () => {
    for (let i = 0; i < 5; i++) {
      checkLoginRateLimit("user-a");
    }
    expect(checkLoginRateLimit("user-a").allowed).toBe(false);

    const userB = checkLoginRateLimit("user-b");
    expect(userB.allowed).toBe(true);
    expect(userB.remaining).toBe(4);
  });

  it("should apply default rate limit", () => {
    const key = "default-test";
    for (let i = 0; i < 30; i++) {
      expect(checkDefaultRateLimit(key).allowed).toBe(true);
    }
    const blocked = checkDefaultRateLimit(key);
    expect(blocked.remaining).toBe(0);
  });

  it("should apply api rate limit", () => {
    const key = "api-test";
    for (let i = 0; i < 60; i++) {
      expect(checkApiRateLimit(key).allowed).toBe(true);
    }
    expect(checkApiRateLimit(key).allowed).toBe(false);
  });

  it("getRateLimitHeaders should return correct headers", () => {
    const headers = getRateLimitHeaders({ remaining: 5, resetAt: Date.now() + 60000 });
    expect(headers["X-RateLimit-Remaining"]).toBe("5");
    expect(Number(headers["X-RateLimit-Reset"])).toBeGreaterThan(0);
    expect(Number(headers["X-RateLimit-Reset"])).toBeLessThanOrEqual(60);
  });
});
