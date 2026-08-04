import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    webhookEvent: {
      create: vi.fn(),
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

beforeEach(() => {
  vi.clearAllMocks();
  (prisma.webhookEvent.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);
  (prisma.webhookEvent.updateMany as ReturnType<typeof vi.fn>).mockResolvedValue({ count: 1 });
  (prisma.webhookEvent.create as ReturnType<typeof vi.fn>).mockResolvedValue({});
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
    expect(prisma.webhookEvent.create).toHaveBeenCalled();
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
    });

    const result = await processStripeEvent({
      id: "evt_dup",
      type: "invoice.paid",
      data: { object: { id: "in_1", subscription: "sub_1" } },
    });

    expect(result).toBe("skipped");
    expect(prisma.company.findFirst).not.toHaveBeenCalled();
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
});
