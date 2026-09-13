export interface PlanLimits {
  maxUsers: number;
  maxClients: number;
  maxAppointments: number;
  maxConversations: number;
  maxUploads: number;
  maxStorageMB: number;
  maxApiKeys: number;
  maxAIMessages: number;
  features: string[];
}

export interface LimitCheck {
  allowed: boolean;
  current: number;
  limit: number;
  feature?: string;
  message: string;
}

const planLimits = Object.fromEntries(
  PLAN_DEFINITIONS.map((plan) => [
    plan.code,
    { ...plan.limits, features: plan.features } as PlanLimits,
  ])
) as Record<string, PlanLimits>;

export function getPlanLimits(planType: string): PlanLimits {
  return planLimits[planType] || planLimits.STARTER;
}

export function hasFeature(planType: string, feature: string): boolean {
  const limits = getPlanLimits(planType);
  return limits.features.includes(feature);
}

export function checkClientLimit(currentCount: number, planType: string): LimitCheck {
  const limits = getPlanLimits(planType);
  const allowed = currentCount < limits.maxClients;
  return {
    allowed,
    current: currentCount,
    limit: limits.maxClients,
    message: allowed
      ? "Limite de clientes dentro do plano"
      : `Limite de clientes atingido (${limits.maxClients}). Faça upgrade do plano.`,
  };
}

export function checkUserLimit(currentCount: number, planType: string): LimitCheck {
  const limits = getPlanLimits(planType);
  const allowed = currentCount < limits.maxUsers;
  return {
    allowed,
    current: currentCount,
    limit: limits.maxUsers,
    message: allowed
      ? "Limite de usuários dentro do plano"
      : `Limite de usuários atingido (${limits.maxUsers}). Faça upgrade do plano.`,
  };
}

export function checkStorageLimit(currentUsageMB: number, planType: string): LimitCheck {
  const limits = getPlanLimits(planType);
  const allowed = currentUsageMB < limits.maxStorageMB;
  return {
    allowed,
    current: currentUsageMB,
    limit: limits.maxStorageMB,
    message: allowed
      ? "Armazenamento dentro do plano"
      : `Limite de armazenamento atingido (${limits.maxStorageMB}MB). Faça upgrade do plano.`,
  };
}

export function checkApiKeyLimit(currentCount: number, planType: string): LimitCheck {
  const limits = getPlanLimits(planType);
  const allowed = currentCount < limits.maxApiKeys;
  return {
    allowed,
    current: currentCount,
    limit: limits.maxApiKeys,
    message: allowed
      ? "Limite de API keys dentro do plano"
      : `Limite de API keys atingido (${limits.maxApiKeys}). Faça upgrade do plano.`,
  };
}

export function checkConversationLimit(currentCount: number, planType: string): LimitCheck {
  const limit = getPlanLimits(planType).maxConversations;
  const allowed = currentCount < limit;
  return {
    allowed,
    current: currentCount,
    limit,
    message: allowed
      ? "Limite de conversas dentro do plano"
      : `Limite de conversas atingido (${limit}). Faça upgrade do plano.`,
  };
}

export function checkAIMessageLimit(currentCount: number, planType: string): LimitCheck {
  const limit = getPlanLimits(planType).maxAIMessages;
  const allowed = currentCount < limit;
  return {
    allowed,
    current: currentCount,
    limit,
    message: allowed
      ? "Limite mensal de IA dentro do plano"
      : `Limite mensal de mensagens de IA atingido (${limit}). Faça upgrade do plano.`,
  };
}

export function getPlanFeatureList(planType: string): string[] {
  return getPlanLimits(planType).features;
}

export function getPlanComparison(): Array<{ plan: string; label: string; limits: PlanLimits }> {
  return [
    { plan: "FREE", label: "Gratuito", limits: planLimits.FREE },
    { plan: "STARTER", label: "Starter", limits: planLimits.STARTER },
    { plan: "PRO", label: "Profissional", limits: planLimits.PRO },
    { plan: "BUSINESS", label: "Business", limits: planLimits.BUSINESS },
    { plan: "ENTERPRISE", label: "Enterprise", limits: planLimits.ENTERPRISE },
  ];
}
import { PLAN_DEFINITIONS } from "@/lib/billing/plans";
