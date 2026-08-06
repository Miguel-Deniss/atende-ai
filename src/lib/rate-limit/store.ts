import { prisma } from "@/lib/db/prisma";

export interface RateLimitBucket {
  count: number;
  resetAt: number;
}

export interface RateLimitStore {
  increment(
    key: string,
    windowMs: number,
    now?: number
  ): Promise<RateLimitBucket>;
  reset(key: string, windowMs: number, now?: number): Promise<void>;
}

class MemoryStore implements RateLimitStore {
  private buckets = new Map<string, RateLimitBucket>();

  async increment(
    key: string,
    windowMs: number,
    now = Date.now()
  ): Promise<RateLimitBucket> {
    let bucket = this.buckets.get(key);
    if (!bucket || bucket.resetAt < now) {
      bucket = { count: 0, resetAt: now + windowMs };
      this.buckets.set(key, bucket);
    }
    bucket.count++;
    return bucket;
  }

  async reset(key: string): Promise<void> {
    this.buckets.delete(key);
  }
}

class DatabaseStore implements RateLimitStore {
  private lastSweep = 0;

  async increment(
    key: string,
    windowMs: number,
    now = Date.now()
  ): Promise<RateLimitBucket> {
    const bucketIndex = Math.floor(now / windowMs);
    const rowKey = `${key}:${bucketIndex}`;
    const resetAt = new Date((bucketIndex + 1) * windowMs);

    const row = await prisma.rateLimit.upsert({
      where: { key: rowKey },
      create: { key: rowKey, count: 1, resetAt },
      update: { count: { increment: 1 } },
    });

    this.sweep(now);

    return { count: row.count, resetAt: row.resetAt.getTime() };
  }

  async reset(key: string, windowMs: number, now = Date.now()): Promise<void> {
    const bucketIndex = Math.floor(now / windowMs);
    await prisma.rateLimit.deleteMany({
      where: { key: { startsWith: `${key}:${bucketIndex}` } },
    });
  }

  private sweep(now: number): void {
    if (now - this.lastSweep < 60_000) return;
    this.lastSweep = now;
    prisma.rateLimit
      .deleteMany({ where: { resetAt: { lt: new Date(now) } } })
      .catch(() => {});
  }
}

export const memoryStore = new MemoryStore();

const databaseStore = new DatabaseStore();

export function getRateLimitStore(): RateLimitStore {
  return process.env.RATE_LIMIT_STORE === "database"
    ? databaseStore
    : memoryStore;
}
