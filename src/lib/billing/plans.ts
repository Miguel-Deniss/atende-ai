import { prisma } from "@/lib/db/prisma";

export interface PlanDefinition {
  code: string;
  name: string;
  price: number;
  trialDays: number;
  sortOrder: number;
  limits: Record<string, number>;
  features: string[];
}

export const PLAN_DEFINITIONS: PlanDefinition[] = [
  {
    code: "FREE",
    name: "Gratuito",
    price: 0,
    trialDays: 0,
    sortOrder: 0,
    limits: {
      maxUsers: 1,
      maxClients: 20,
      maxAppointments: 50,
      maxConversations: 100,
      maxUploads: 5,
      maxStorageMB: 50,
      maxAIMessages: 50,
    },
    features: ["basic_ai"],
  },
  {
    code: "STARTER",
    name: "Starter",
    price: 5900,
    trialDays: 14,
    sortOrder: 1,
    limits: {
      maxUsers: 3,
      maxClients: 100,
      maxAppointments: 200,
      maxConversations: 500,
      maxUploads: 50,
      maxStorageMB: 100,
      maxAIMessages: 500,
    },
    features: ["basic_ai", "email_notifications", "basic_reports"],
  },
  {
    code: "PRO",
    name: "Profissional",
    price: 11900,
    trialDays: 14,
    sortOrder: 2,
    limits: {
      maxUsers: 10,
      maxClients: 1000,
      maxAppointments: 5000,
      maxConversations: 10000,
      maxUploads: 200,
      maxStorageMB: 500,
      maxAIMessages: 5000,
    },
    features: [
      "advanced_ai",
      "whatsapp",
      "email_notifications",
      "advanced_reports",
      "api_access",
    ],
  },
  {
    code: "BUSINESS",
    name: "Business",
    price: 24900,
    trialDays: 14,
    sortOrder: 3,
    limits: {
      maxUsers: 9999,
      maxClients: 50000,
      maxAppointments: 99999,
      maxConversations: 99999,
      maxUploads: 1000,
      maxStorageMB: 2000,
      maxAIMessages: 50000,
    },
    features: [
      "advanced_ai",
      "whatsapp",
      "email_notifications",
      "advanced_reports",
      "api_access",
      "dedicated_support",
      "custom_integrations",
    ],
  },
  {
    code: "ENTERPRISE",
    name: "Enterprise",
    price: 59900,
    trialDays: 14,
    sortOrder: 4,
    limits: {
      maxUsers: 99999,
      maxClients: 999999,
      maxAppointments: 999999,
      maxConversations: 999999,
      maxUploads: 9999,
      maxStorageMB: 99999,
      maxAIMessages: 999999,
    },
    features: [
      "advanced_ai",
      "whatsapp",
      "email_notifications",
      "advanced_reports",
      "api_access",
      "dedicated_support",
      "custom_integrations",
      "custom_models",
    ],
  },
];

export async function ensurePlans(): Promise<void> {
  for (const def of PLAN_DEFINITIONS) {
    await prisma.plan.upsert({
      where: { code: def.code },
      update: {
        name: def.name,
        price: def.price,
        trialDays: def.trialDays,
        sortOrder: def.sortOrder,
        limits: def.limits as object,
        features: def.features,
        isActive: true,
      },
      create: {
        code: def.code,
        name: def.name,
        price: def.price,
        trialDays: def.trialDays,
        sortOrder: def.sortOrder,
        limits: def.limits as object,
        features: def.features,
        isActive: true,
      },
    });
  }
}

export async function listActivePlans() {
  await ensurePlans();

  return prisma.plan.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });
}

export async function getPlanByCode(code: string) {
  const plan = await prisma.plan.findUnique({ where: { code } });
  if (plan) return plan;

  const def = PLAN_DEFINITIONS.find((p) => p.code === code);
  if (!def) return null;

  return prisma.plan.create({
    data: {
      code: def.code,
      name: def.name,
      price: def.price,
      trialDays: def.trialDays,
      sortOrder: def.sortOrder,
      limits: def.limits as object,
      features: def.features,
      isActive: true,
    },
  });
}
