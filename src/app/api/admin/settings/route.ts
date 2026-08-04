import { successResponse, errorResponse } from "@/lib/auth/api-response";
import { requireRole } from "@/lib/auth/api-guard";
import { prisma } from "@/lib/db/prisma";
import { PLAN_DEFINITIONS } from "@/lib/billing/plans";

export async function GET() {
  try {
    const { response } = await requireRole(["SUPER_ADMIN"]);
    if (response) return response;

    const [plans, webhookEvents, apiKeys] = await Promise.all([
      prisma.plan.findMany({
        orderBy: { sortOrder: "asc" },
        select: {
          code: true,
          name: true,
          price: true,
          trialDays: true,
          isActive: true,
          _count: { select: { subscriptions: true } },
        },
      }),
      prisma.webhookEvent.groupBy({
        by: ["provider", "status"],
        _count: { _all: true },
      }),
      prisma.apiKey.count(),
    ]);

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
      (process.env.NODE_ENV === "development" ? "http://localhost:3000" : "");

    const integrations = {
      stripe: {
        configured: !!(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET),
        webhook: `${baseUrl}/api/webhooks/stripe`,
      },
      whatsapp: {
        configured: !!(process.env.WHATSAPP_ACCESS_TOKEN || process.env.WHATSAPP_API_URL),
        webhook: `${baseUrl}/api/webhooks/whatsapp`,
      },
      resend: {
        configured: !!process.env.RESEND_API_KEY,
      },
      openai: {
        configured: !!process.env.OPENAI_API_KEY,
      },
    };

    const webhookSummary = webhookEvents.reduce(
      (acc: Record<string, Record<string, number>>, w) => {
        if (!acc[w.provider]) acc[w.provider] = {};
        acc[w.provider][w.status] = w._count._all;
        return acc;
      },
      {}
    );

    return successResponse({
      environment: process.env.NODE_ENV === "development" ? "development" : "production",
      nodeEnv: process.env.NODE_ENV,
      baseUrl,
      appVersion: process.env.npm_package_version ?? "unknown",
      plans,
      planDefinitions: PLAN_DEFINITIONS,
      integrations,
      webhookSummary,
      apiKeyCount: apiKeys,
      config: {
        appUrl: !!process.env.NEXT_PUBLIC_APP_URL,
        databaseUrl: !!process.env.DATABASE_URL,
        jwtSecret: !!process.env.JWT_SECRET,
        sessionSecret: !!process.env.SESSION_SECRET,
      },
    });
  } catch {
    return errorResponse("Erro interno do servidor", 500);
  }
}
