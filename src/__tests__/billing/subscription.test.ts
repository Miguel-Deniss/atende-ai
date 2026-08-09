import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    subscription: {
      upsert: vi.fn(),
      updateMany: vi.fn(),
    },
    company: {
      update: vi.fn(),
    },
    billingHistory: {
      create: vi.fn(),
    },
  },
}));

vi.mock("@/lib/logger", () => ({
  createLog: vi.fn(async () => {}),
}));

import { prisma } from "@/lib/db/prisma";
import { createOrUpdateSubscription, updateSubscriptionStatus } from "@/lib/billing/subscription";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("createOrUpdateSubscription", () => {
  it("cria assinatura ativa e sincroniza a empresa", async () => {
    (prisma.subscription.upsert as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "sub_1",
      status: "ACTIVE",
      nextBillingDate: new Date(),
    });

    const result = await createOrUpdateSubscription({
      companyId: "c1",
      planId: "plan_1",
      planCode: "PRO",
      status: "ACTIVE",
      amount: 11900,
      trialDays: 0,
      description: "Assinatura do plano PRO",
    });

    expect(result.subscription.id).toBe("sub_1");
    expect(prisma.company.update).toHaveBeenCalledWith({
      where: { id: "c1" },
      data: expect.objectContaining({
        planType: "PRO",
        subscriptionStatus: "ACTIVE",
      }),
    });
    expect(prisma.billingHistory.create).toHaveBeenCalled();
  });

  it("persiste stripeCustomerId e stripeSubscriptionId na empresa", async () => {
    (prisma.subscription.upsert as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "sub_1",
      status: "ACTIVE",
      nextBillingDate: new Date(),
    });

    await createOrUpdateSubscription({
      companyId: "c1",
      planId: "plan_1",
      planCode: "STARTER",
      status: "ACTIVE",
      amount: 5900,
      trialDays: 0,
      stripeCustomerId: "cus_1",
      stripeSubscriptionId: "sub_stripe",
    });

    expect(prisma.company.update).toHaveBeenCalledWith({
      where: { id: "c1" },
      data: expect.objectContaining({
        stripeCustomerId: "cus_1",
        stripeSubscriptionId: "sub_stripe",
      }),
    });
  });

  it("calcula trialEndsAt a partir de trialDays quando não informado", async () => {
    (prisma.subscription.upsert as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "sub_1",
      status: "TRIALING",
      nextBillingDate: new Date(),
    });

    await createOrUpdateSubscription({
      companyId: "c1",
      planId: "plan_1",
      planCode: "PRO",
      status: "TRIALING",
      amount: 0,
      trialDays: 14,
    });

    const updateCall = vi.mocked(prisma.company.update).mock.calls[0][0] as {
      data: { trialEndsAt: Date };
    };
    expect(updateCall.data.trialEndsAt.getTime()).toBeGreaterThan(Date.now());
  });
});

describe("updateSubscriptionStatus", () => {
  it("atualiza status da subscription e da empresa", async () => {
    await updateSubscriptionStatus({
      companyId: "c1",
      status: "PAST_DUE",
      logAction: "PAYMENT_FAILURE",
      description: "Pagamento falhou",
    });

    expect(prisma.subscription.updateMany).toHaveBeenCalledWith({
      where: { companyId: "c1" },
      data: expect.objectContaining({ status: "PAST_DUE" }),
    });
    expect(prisma.company.update).toHaveBeenCalledWith({
      where: { id: "c1" },
      data: expect.objectContaining({ subscriptionStatus: "PAST_DUE" }),
    });
    expect(prisma.billingHistory.create).toHaveBeenCalled();
  });

  it("marca CANCELED com canceledAt quando status é CANCELED", async () => {
    const canceledAt = new Date();
    await updateSubscriptionStatus({
      companyId: "c1",
      status: "CANCELED",
      canceledAt,
      logAction: "SUBSCRIPTION_CANCEL",
    });

    const updateCall = vi.mocked(prisma.subscription.updateMany).mock.calls[0][0] as {
      data: { canceledAt: Date };
    };
    expect(updateCall.data.canceledAt).toBe(canceledAt);
  });

  it("não promove planType quando status é INCOMPLETE mesmo com plano informado", async () => {
    await updateSubscriptionStatus({
      companyId: "c1",
      status: "INCOMPLETE",
      planId: "plan_1",
      planCode: "PRO",
      logAction: "SUBSCRIPTION_RENEWED",
    });

    const subUpdate = vi.mocked(prisma.subscription.updateMany).mock.calls[0][0] as {
      data: Record<string, unknown>;
    };
    expect(subUpdate.data.status).toBe("INCOMPLETE");
    expect(subUpdate.data.planId).toBeUndefined();

    const companyUpdate = vi.mocked(prisma.company.update).mock.calls[0][0] as {
      data: Record<string, unknown>;
    };
    expect(companyUpdate.data.planType).toBeUndefined();
    expect(companyUpdate.data.subscriptionStatus).toBe("INCOMPLETE");
  });

  it("não promove planType quando status é PAST_DUE mesmo com plano informado", async () => {
    await updateSubscriptionStatus({
      companyId: "c1",
      status: "PAST_DUE",
      planId: "plan_1",
      planCode: "PRO",
      logAction: "PAYMENT_FAILURE",
    });

    const companyUpdate = vi.mocked(prisma.company.update).mock.calls[0][0] as {
      data: Record<string, unknown>;
    };
    expect(companyUpdate.data.planType).toBeUndefined();
  });

  it("promove planType quando status é ACTIVE com plano informado", async () => {
    await updateSubscriptionStatus({
      companyId: "c1",
      status: "ACTIVE",
      planId: "plan_1",
      planCode: "BUSINESS",
      logAction: "SUBSCRIPTION_RENEWED",
    });

    const subUpdate = vi.mocked(prisma.subscription.updateMany).mock.calls[0][0] as {
      data: Record<string, unknown>;
    };
    expect(subUpdate.data.planId).toBe("plan_1");

    const companyUpdate = vi.mocked(prisma.company.update).mock.calls[0][0] as {
      data: Record<string, unknown>;
    };
    expect(companyUpdate.data.planType).toBe("BUSINESS");
  });
});
