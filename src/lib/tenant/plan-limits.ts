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

const planLimits: Record<string, PlanLimits> = {
  STARTER: {
    maxUsers: 3,
    maxClients: 100,
    maxAppointments: 200,
    maxConversations: 500,
    maxUploads: 50,
    maxStorageMB: 100,
    maxApiKeys: 2,
    maxAIMessages: 500,
    features: ["basic_ai", "email_notifications", "basic_reports"],
  },
  PRO: {
    maxUsers: 10,
    maxClients: 1000,
    maxAppointments: 5000,
    maxConversations: 10000,
    maxUploads: 200,
    maxStorageMB: 500,
    maxApiKeys: 5,
    maxAIMessages: 5000,
    features: ["advanced_ai", "whatsapp", "email_notifications", "advanced_reports", "api_access"],
  },
  BUSINESS: {
    maxUsers: 9999,
    maxClients: 50000,
    maxAppointments: 99999,
    maxConversations: 99999,
    maxUploads: 1000,
    maxStorageMB: 2000,
    maxApiKeys: 20,
    maxAIMessages: 50000,
    features: ["advanced_ai", "whatsapp", "email_notifications", "advanced_reports", "api_access", "dedicated_support", "custom_integrations"],
  },
};

export function getPlanLimits(planType: string): PlanLimits {
  return planLimits[planType] || planLimits.STARTER;
}

export function hasFeature(planType: string, feature: string): boolean {
  const limits = getPlanLimits(planType);
  return limits.features.includes(feature);
}

export async function checkClientLimit(currentCount: number, planType: string): Promise<LimitCheck> {
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

export async function checkUserLimit(currentCount: number, planType: string): Promise<LimitCheck> {
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

export async function checkStorageLimit(currentUsageMB: number, planType: string): Promise<LimitCheck> {
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

export async function checkApiKeyLimit(currentCount: number, planType: string): Promise<LimitCheck> {
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

export function getPlanFeatureList(planType: string): string[] {
  return getPlanLimits(planType).features;
}

export function getPlanComparison(): Array<{ plan: string; label: string; limits: PlanLimits }> {
  return [
    { plan: "STARTER", label: "Starter", limits: planLimits.STARTER },
    { plan: "PRO", label: "Profissional", limits: planLimits.PRO },
    { plan: "BUSINESS", label: "Business", limits: planLimits.BUSINESS },
  ];
}
