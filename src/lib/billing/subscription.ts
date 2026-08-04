import { prisma } from "@/lib/db/prisma";
import { createLog } from "@/lib/logger";
import type { LogAction } from "@/lib/logger";

export interface BillingDecision {
  allowed: boolean;
  status: string;
  reason?: string;
}

const ACTIVE_STATUSES = new Set(["ACTIVE", "TRIALING"]);

export async function getCompanyBilling(companyId: string) {
  const [company, subscription] = await Promise.all([
    prisma.company.findUnique({
      where: { id: companyId },
      select: {
        planType: true,
        subscriptionStatus: true,
        trialEndsAt: true,
      },
    }),
    prisma.subscription.findUnique({
      where: { companyId },
      include: { plan: { select: { code: true, name: true, price: true } } },
    }),
  ]);

  return {
    planType: subscription?.plan?.code ?? company?.planType ?? "FREE",
    status: subscription?.status ?? company?.subscriptionStatus ?? "TRIALING",
    trialEndsAt: company?.trialEndsAt ?? null,
    nextBillingDate: subscription?.nextBillingDate ?? null,
    expiresAt: subscription?.expiresAt ?? null,
  };
}

export async function enforceBilling(companyId: string): Promise<BillingDecision> {
  const billing = await getCompanyBilling(companyId);

  if (billing.status === "ACTIVE") {
    return { allowed: true, status: billing.status };
  }

  if (billing.status === "TRIALING") {
    if (billing.trialEndsAt && billing.trialEndsAt < new Date()) {
      return {
        allowed: false,
        status: billing.status,
        reason: "Período de teste expirado. Renove sua assinatura.",
      };
    }
    return { allowed: true, status: billing.status };
  }

  return {
    allowed: false,
    status: billing.status,
    reason:
      billing.status === "PAST_DUE"
        ? "Pagamento pendente. Atualize sua forma de pagamento."
        : "Assinatura cancelada ou incompleta.",
  };
}

export interface CreateSubscriptionInput {
  companyId: string;
  planId: string;
  planCode: string;
  status?: "ACTIVE" | "TRIALING" | "INCOMPLETE";
  couponId?: string | null;
  trialDays?: number;
  amount: number;
  logAction?: LogAction;
  userId?: string;
  description?: string;
}

export async function createOrUpdateSubscription(
  input: CreateSubscriptionInput
): Promise<{ subscription: { id: string; status: string; nextBillingDate: Date | null } }> {
  const now = new Date();
  const nextBillingDate = new Date(now);
  nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);

  const trialDays = input.trialDays ?? 0;
  const trialEndsAt =
    trialDays > 0 ? new Date(now.getTime() + trialDays * 86400000) : null;

  const subscription = await prisma.subscription.upsert({
    where: { companyId: input.companyId },
    update: {
      planId: input.planId,
      status: input.status ?? "ACTIVE",
      nextBillingDate,
      expiresAt: input.status === "ACTIVE" ? nextBillingDate : null,
      canceledAt: null,
      ...(input.couponId ? { couponId: input.couponId } : { couponId: null }),
    },
    create: {
      companyId: input.companyId,
      planId: input.planId,
      status: input.status ?? "ACTIVE",
      startedAt: now,
      nextBillingDate,
      expiresAt: input.status === "ACTIVE" ? nextBillingDate : null,
      couponId: input.couponId ?? null,
    },
    select: { id: true, status: true, nextBillingDate: true },
  });

  await prisma.company.update({
    where: { id: input.companyId },
    data: {
      planType: input.planCode as never,
      subscriptionStatus: input.status ?? "ACTIVE",
      trialEndsAt,
    },
  });

  await recordBilling({
    companyId: input.companyId,
    subscriptionId: subscription.id,
    action: input.logAction ?? "SUBSCRIPTION_CREATED",
    amount: input.amount,
    status: input.status ?? "ACTIVE",
    description: input.description ?? `Assinatura do plano ${input.planCode}`,
    userId: input.userId,
  });

  return { subscription };
}

export interface RecordBillingInput {
  companyId: string;
  subscriptionId?: string | null;
  action: LogAction;
  amount?: number;
  currency?: string;
  status?: string;
  description?: string;
  metadata?: Record<string, unknown>;
  userId?: string;
}

export async function recordBilling(input: RecordBillingInput): Promise<void> {
  await prisma.billingHistory.create({
    data: {
      companyId: input.companyId,
      subscriptionId: input.subscriptionId ?? null,
      action: input.action,
      amount: input.amount ?? 0,
      currency: input.currency ?? "BRL",
      status: input.status ?? "completed",
      description: input.description,
      metadata: input.metadata ? (JSON.parse(JSON.stringify(input.metadata)) as object) : undefined,
    },
  });

  await createLog({
    action: input.action,
    entity: "subscription",
    entityId: input.subscriptionId ?? input.companyId,
    description: input.description ?? `Registro financeiro (${input.action})`,
    companyId: input.companyId,
    userId: input.userId,
  });
}

export async function getBillingHistory(companyId: string, limit = 20) {
  return prisma.billingHistory.findMany({
    where: { companyId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
