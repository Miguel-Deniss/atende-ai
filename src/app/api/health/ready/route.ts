import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET(request: NextRequest) {
  const expected = process.env.HEALTHCHECK_SECRET || process.env.CRON_SECRET;
  if (!expected || request.headers.get("authorization") !== `Bearer ${expected}`) {
    return new Response(null, { status: 404 });
  }

  const startedAt = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return Response.json(
      {
        status: "ready",
        database: "healthy",
        dependencies: {
          openai: Boolean(process.env.OPENAI_API_KEY),
          stripe: Boolean(process.env.STRIPE_SECRET_KEY),
          email: Boolean(process.env.RESEND_API_KEY),
          whatsapp: Boolean(process.env.META_APP_SECRET && process.env.META_WEBHOOK_VERIFY_TOKEN),
        },
        responseTimeMs: Date.now() - startedAt,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return Response.json(
      { status: "unavailable", database: "unhealthy" },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }
}
