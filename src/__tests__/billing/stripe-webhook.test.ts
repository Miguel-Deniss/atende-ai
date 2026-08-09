import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    webhookEvent: {
      upsert: vi.fn(),
      updateMany: vi.fn(),
      findFirst: vi.fn(),
    },
    company: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    subscription: {
      updateMany: vi.fn(),
      upsert: vi.fn(),
    },
    coupon: {
      findUnique: vi.fn(),
    },
    couponUsage: {
      update: vi.fn(),
    },
    user: {
      findFirst: vi.fn(),
    },
    billingHistory: {
      create: vi.fn(),
    },
  },
}));

vi.mock("@/lib/logger", () => ({
  createLog: vi.fn(async () => {}),
  logSystemEvent: vi.fn(async () => {}),
}));

vi.mock("@/lib/billing/plans", () => ({
  getPlanByCode: vi.fn(async () => ({
    id: "plan_1",
    code: "PRO",
    name: "Profissional",
    price: 11900,
  })),
}));

vi.mock("@/lib/billing/stripe", () => ({
  mapPriceIdToPlan: vi.fn(() => "PRO"),
}));

vi.mock("@/lib/billing/coupons", () => ({
  incrementCouponUsage: vi.fn(async () => {}),
}));

vi.mock("@/lib/email", () => ({
  sendInvoiceEmail: vi.fn(async () => ({ id: "email_1" })),
}));

import { prisma } from "@/lib/db/prisma";
import { processStripeEvent } from "@/lib/billing/stripe-webhook";
import { incrementCouponUsage } from "@/lib/billing/coupons";
import { sendInvoiceEmail } from "@/lib/email";
import { logSystemEvent } from "@/lib/logger";

beforeEach(() => {
  vi.clearAllMocks();
  (prisma.webhookEvent.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);
  (prisma.webhookEvent.updateMany as ReturnType<typeof vi.fn>).mockResolvedValue({ count: 1 });
  (prisma.webhookEvent.upsert as ReturnType<typeof vi.fn>).mockResolvedValue({
    id: "we_new",
    status: "received",
  });
});

describe("processStripeEvent", () => {
  it("registra evento e processa checkout.session.completed", async () => {
    (prisma.company.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "c1",
      name: "Empresa",
      planType: "STARTER",
      stripeCustomerId: null,
      stripeSubscriptionId: null,
    });
    (prisma.subscription.updateMany as ReturnType<typeof vi.fn>).mockResolvedValue({ count: 1 });
    (prisma.subscription.upsert as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "sub_1",
      status: "ACTIVE",
      nextBillingDate: new Date(),
    });
    (prisma.company.update as ReturnType<typeof vi.fn>).mockResolvedValue({});
    (prisma.coupon.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "coupon_1",
      code: "PROMO10",
    });

    const result = await processStripeEvent({
      id: "evt_1",
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_1",
          customer: "cus_1",
          subscription: "sub_stripe_1",
          metadata: { companyId: "c1", planCode: "PRO", couponCode: "PROMO10" },
        },
      },
    });

    expect(result).toBe("processed");
    expect(prisma.webhookEvent.upsert).toHaveBeenCalled();
    expect(prisma.company.update).toHaveBeenCalledWith({
      where: { id: "c1" },
      data: expect.objectContaining({
        subscriptionStatus: "ACTIVE",
        planType: "PRO",
        trialEndsAt: null,
        stripeCustomerId: "cus_1",
        stripeSubscriptionId: "sub_stripe_1",
      }),
    });
    expect(incrementCouponUsage).toHaveBeenCalledWith("coupon_1");
  });

  it("ignora evento já processado (idempotência)", async () => {
    (prisma.webhookEvent.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "we_1",
      status: "processed",
    });

    const result = await processStripeEvent({
      id: "evt_dup",
      type: "invoice.paid",
      data: { object: { id: "in_1", subscription: "sub_1" } },
    });

    expect(result).toBe("skipped");
    expect(prisma.company.findFirst).not.toHaveBeenCalled();
  });

  it("ignora evento quando o claim atômico já foi tomado por outra execução", async () => {
    (prisma.webhookEvent.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (prisma.webhookEvent.updateMany as ReturnType<typeof vi.fn>).mockResolvedValue({ count: 0 });

    const result = await processStripeEvent({
      id: "evt_race",
      type: "invoice.paid",
      data: { object: { id: "in_1", subscription: "sub_1" } },
    });

    expect(result).toBe("skipped");
  });

  it("não promove planType quando subscription.updated vem como INCOMPLETE", async () => {
    (prisma.company.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "c1",
      name: "Empresa",
      planType: "FREE",
      stripeSubscriptionId: "sub_stripe_1",
    });

    const result = await processStripeEvent({
      id: "evt_incomplete",
      type: "customer.subscription.updated",
      data: {
        object: {
          id: "sub_stripe_1",
          status: "incomplete",
          current_period_end: 1700000000,
          items: { data: [{ price: { id: "price_pro" } }] },
        },
      },
    });

    expect(result).toBe("processed");
    const companyUpdate = vi
      .mocked(prisma.company.update)
      .mock.calls.find((call) => call[0].data.planType);
    expect(companyUpdate).toBeUndefined();
    const subUpdate = vi
      .mocked(prisma.subscription.updateMany)
      .mock.calls.find((call) => call[0].data.status === "INCOMPLETE");
    expect(subUpdate).toBeDefined();
    expect(subUpdate![0].data.planId).toBeUndefined();
  });

  it("promove planType quando subscription.updated vem como ACTIVE", async () => {
    (prisma.company.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "c1",
      name: "Empresa",
      planType: "FREE",
      stripeSubscriptionId: "sub_stripe_1",
    });

    const result = await processStripeEvent({
      id: "evt_active",
      type: "customer.subscription.updated",
      data: {
        object: {
          id: "sub_stripe_1",
          status: "active",
          current_period_end: 1700000000,
          items: { data: [{ price: { id: "price_pro" } }] },
        },
      },
    });

    expect(result).toBe("processed");
    expect(prisma.company.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ planType: "PRO" }) })
    );
  });

  it("marca subscription como PAST_DUE quando pagamento falha", async () => {
    (prisma.company.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "c1",
      name: "Empresa",
      planType: "PRO",
    });

    const result = await processStripeEvent({
      id: "evt_2",
      type: "invoice.payment_failed",
      data: {
        object: {
          id: "in_1",
          subscription: "sub_stripe_1",
          amount_due: 11900,
          currency: "brl",
        },
      },
    });

    expect(result).toBe("processed");
    expect(prisma.company.update).toHaveBeenCalledWith({
      where: { id: "c1" },
      data: expect.objectContaining({ subscriptionStatus: "PAST_DUE" }),
    });
    expect(prisma.billingHistory.create).toHaveBeenCalled();
  });

  it("envia fatura por e-mail no invoice.paid", async () => {
    (prisma.company.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "c1",
      name: "Empresa",
      planType: "PRO",
      stripeSubscriptionId: "sub_stripe_1",
    });
    (prisma.user.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "u1",
      email: "admin@empresa.com",
    });

    const result = await processStripeEvent({
      id: "evt_3",
      type: "invoice.paid",
      data: {
        object: {
          id: "in_1",
          subscription: "sub_stripe_1",
          amount_paid: 11900,
          currency: "brl",
          period_end: 1700000000,
          hosted_invoice_url: "https://invoice.stripe.com/x",
          number: "INV-001",
        },
      },
    });

    expect(result).toBe("processed");
    expect(sendInvoiceEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "admin@empresa.com",
        companyName: "Empresa",
        invoiceNumber: "INV-001",
      })
    );
  });

  it("marca como failed e loga via logSystemEvent quando o processamento falha", async () => {
    (prisma.company.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "c1",
      name: "Empresa",
      planType: "FREE",
      stripeCustomerId: null,
      stripeSubscriptionId: null,
    });
    (prisma.subscription.upsert as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("DB down")
    );

    await expect(
      processStripeEvent({
        id: "evt_fail",
        type: "checkout.session.completed",
        data: {
          object: {
            id: "cs_fail",
            customer: "cus_1",
            subscription: "sub_1",
            metadata: { companyId: "c1", planCode: "PRO" },
          },
        },
      })
    ).rejects.toThrow("DB down");

    expect(prisma.webhookEvent.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { signature: "evt_fail", provider: "stripe" },
        data: expect.objectContaining({ status: "failed" }),
      })
    );
    expect(logSystemEvent).toHaveBeenCalledWith(
      expect.objectContaining({ action: "WEBHOOK_FAILED", entityId: "evt_fail" })
    );
  });
});
