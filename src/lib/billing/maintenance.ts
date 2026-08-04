import { prisma } from "@/lib/db/prisma";
import { createLog } from "@/lib/logger";

export interface MaintenanceResult {
  expiredTrials: number;
  suspended: number;
}

export async function processExpiredTrials(): Promise<MaintenanceResult> {
  const now = new Date();

  const expiredCompanies = await prisma.company.findMany({
    where: {
      subscriptionStatus: "TRIALING",
      trialEndsAt: { lt: now },
      deletedAt: null,
      status: { not: "SUSPENDED" },
    },
    select: { id: true, name: true, planType: true },
  });

  for (const company of expiredCompanies) {
    await prisma.company.update({
      where: { id: company.id },
      data: { status: "SUSPENDED" },
    });

    await prisma.subscription.updateMany({
      where: { companyId: company.id },
      data: { status: "PAST_DUE" },
    });

    await prisma.user.updateMany({
      where: { companyId: company.id },
      data: { isActive: false },
    });

    await createLog({
      action: "BILLING_BLOCKED",
      entity: "subscription",
      entityId: company.id,
      description: `Trial expirado — empresa ${company.name} suspensa automaticamente`,
      companyId: company.id,
    });
  }

  return {
    expiredTrials: expiredCompanies.length,
    suspended: expiredCompanies.length,
  };
}

export async function processPastDueCompanies(): Promise<MaintenanceResult> {
  const pastDue = await prisma.company.findMany({
    where: {
      subscriptionStatus: "PAST_DUE",
      deletedAt: null,
      status: { not: "SUSPENDED" },
    },
    select: { id: true, name: true },
  });

  for (const company of pastDue) {
    await prisma.company.update({
      where: { id: company.id },
      data: { status: "SUSPENDED" },
    });

    await prisma.user.updateMany({
      where: { companyId: company.id },
      data: { isActive: false },
    });

    await createLog({
      action: "BILLING_BLOCKED",
      entity: "subscription",
      entityId: company.id,
      description: `Pagamento pendente — empresa ${company.name} suspensa`,
      companyId: company.id,
    });
  }

  return {
    expiredTrials: 0,
    suspended: pastDue.length,
  };
}
