import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/logger/structured";
import { dbCircuitBreaker } from "@/lib/resilience/circuit-breaker";

interface HealthCheck {
  name: string;
  status: "healthy" | "degraded" | "unhealthy";
  latency: number;
  error?: string;
}

async function checkDatabase(): Promise<HealthCheck> {
  const start = Date.now();
  try {
    await dbCircuitBreaker.call(async () => {
      await prisma.$queryRaw`SELECT 1`;
    });
    return { name: "database", status: "healthy", latency: Date.now() - start };
  } catch (err) {
    return {
      name: "database",
      status: "unhealthy",
      latency: Date.now() - start,
      error: err instanceof Error ? err.message : "Unknown",
    };
  }
}

async function checkOpenAI(): Promise<HealthCheck> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return { name: "openai", status: "degraded", latency: 0, error: "not_configured" };
  }

  const start = Date.now();
  try {
    const res = await fetch("https://api.openai.com/v1/models", {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) throw new Error(`OpenAI API returned ${res.status}`);
    return { name: "openai", status: "healthy", latency: Date.now() - start };
  } catch (err) {
    return {
      name: "openai",
      status: "degraded",
      latency: Date.now() - start,
      error: err instanceof Error ? err.message : "Unknown",
    };
  }
}

async function checkStripe(): Promise<HealthCheck> {
  const apiKey = process.env.STRIPE_SECRET_KEY;
  if (!apiKey) {
    return { name: "stripe", status: "degraded", latency: 0, error: "not_configured" };
  }

  const start = Date.now();
  try {
    const stripe = new (require("stripe"))(apiKey);
    await stripe.balance.retrieve();
    return { name: "stripe", status: "healthy", latency: Date.now() - start };
  } catch (err) {
    return {
      name: "stripe",
      status: "degraded",
      latency: Date.now() - start,
      error: err instanceof Error ? err.message : "Unknown",
    };
  }
}

async function checkSMTP(): Promise<HealthCheck> {
  const host = process.env.SMTP_HOST;
  if (!host) {
    return { name: "smtp", status: "degraded", latency: 0, error: "not_configured" };
  }

  const start = Date.now();
  try {
    const net = await import("net");
    await new Promise<void>((resolve, reject) => {
      const sock = net.createConnection(
        parseInt(process.env.SMTP_PORT || "587"),
        host,
        () => {
          sock.end();
          resolve();
        }
      );
      sock.on("error", reject);
      sock.setTimeout(3000, () => {
        sock.destroy();
        reject(new Error("SMTP connection timeout"));
      });
    });
    return { name: "smtp", status: "healthy", latency: Date.now() - start };
  } catch (err) {
    return {
      name: "smtp",
      status: "degraded",
      latency: Date.now() - start,
      error: err instanceof Error ? err.message : "Unknown",
    };
  }
}

async function checkStorage(): Promise<HealthCheck> {
  const start = Date.now();
  try {
    const fs = await import("fs/promises");
    const uploadDir = process.env.UPLOAD_DIR || "uploads";
    await fs.access(uploadDir).catch(() => fs.mkdir(uploadDir, { recursive: true }));
    return { name: "storage", status: "healthy", latency: Date.now() - start };
  } catch (err) {
    return {
      name: "storage",
      status: "unhealthy",
      latency: Date.now() - start,
      error: err instanceof Error ? err.message : "Unknown",
    };
  }
}

export async function GET() {
  const requestId = crypto.randomUUID();
  const start = Date.now();

  const checks = await Promise.allSettled([
    checkDatabase(),
    checkOpenAI(),
    checkStripe(),
    checkSMTP(),
    checkStorage(),
  ]);

  const results: HealthCheck[] = checks.map((r) =>
    r.status === "fulfilled"
      ? r.value
      : {
          name: "unknown",
          status: "unhealthy" as const,
          latency: 0,
          error: r.reason?.message || "Check failed",
        }
  );

  const overallStatus = results.every((r) => r.status === "healthy")
    ? "healthy"
    : results.some((r) => r.status === "unhealthy")
      ? "unhealthy"
      : "degraded";

  const memoryUsage = process.memoryUsage();
  const cpuUsage = process.cpuUsage();

  logger.info(`Health check completed: ${overallStatus}`, {
    action: "health_check",
    duration: Date.now() - start,
    requestId,
    metadata: { checks: results.map((r) => r.name) },
  });

  const response = {
    status: overallStatus,
    version: process.env.npm_package_version || "0.1.0",
    requestId,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
    node: process.version,
    platform: process.platform,
    responseTime: `${Date.now() - start}ms`,
    checks: results,
    memory: {
      heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
      heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`,
      rss: `${Math.round(memoryUsage.rss / 1024 / 1024)} MB`,
    },
    cpu: {
      user: `${Math.round(cpuUsage.user / 1000)}ms`,
      system: `${Math.round(cpuUsage.system / 1000)}ms`,
    },
  };

  const statusCode = overallStatus === "healthy" ? 200 : overallStatus === "degraded" ? 200 : 503;

  return NextResponse.json(response, {
    status: statusCode,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "X-Request-Id": requestId,
    },
  });
}
