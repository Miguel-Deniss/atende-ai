import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth/api-guard", () => ({
  requirePermission: vi.fn(),
}));

vi.mock("@/lib/rate-limit/with-rate-limit", () => ({
  guardRateLimit: vi.fn(),
  clientIp: vi.fn(() => "1.2.3.4"),
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    user: { findFirst: vi.fn() },
    company: { findUnique: vi.fn(), update: vi.fn() },
    coupon: { findUnique: vi.fn() },
  },
}));

vi.mock("@/lib/billing/stripe", () => ({
  StripeConfigError: class StripeConfigError extends Error {
    constructor(message: string) {
      super(message);
      this.name = "StripeConfigError";
    }
  },
  isStripeConfigured: vi.fn(),
  getMissingStripePriceIds: vi.fn(),
  createCheckoutSession: vi.fn(),
  getOrCreateStripeCustomer: vi.fn(),
}));

vi.mock("@/lib/billing/plans", () => ({
  getPlanByCode: vi.fn(async (code: string) => ({
    id: "plan_pro",
    code,
    name: "Profissional",
    price: 11900,
    currency: "BRL",
    trialDays: 0,
    features: [],
  })),
}));

vi.mock("@/lib/billing/coupons", () => ({
  validateCoupon: vi.fn(),
  computeDiscount: vi.fn(),
}));

import { POST } from "@/app/api/billing/checkout/route";
import { requirePermission } from "@/lib/auth/api-guard";
import { guardRateLimit } from "@/lib/rate-limit/with-rate-limit";
import { prisma } from "@/lib/db/prisma";
import {
  StripeConfigError,
  isStripeConfigured,
  getMissingStripePriceIds,
  createCheckoutSession,
  getOrCreateStripeCustomer,
} from "@/lib/billing/stripe";
import { getPlanByCode } from "@/lib/billing/plans";
import { validateCoupon, computeDiscount } from "@/lib/billing/coupons";

function makeRequest(body: unknown): any {
  return { json: async () => body };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(requirePermission).mockResolvedValue({
    user: { id: "u1", companyId: "c1", email: "admin@empresa.com" },
    response: null,
  } as never);
  vi.mocked(guardRateLimit).mockResolvedValue(null as never);
  vi.mocked(isStripeConfigured).mockReturnValue(true);
  vi.mocked(getMissingStripePriceIds).mockReturnValue([]);
  vi.mocked(prisma.user.findFirst).mockResolvedValue({
    id: "u1",
    email: "admin@empresa.com",
  } as never);
  vi.mocked(prisma.company.findUnique).mockResolvedValue({
    name: "Empresa",
    stripeCustomerId: null,
  } as never);
  vi.mocked(prisma.company.update).mockResolvedValue({} as never);
  vi.mocked(getOrCreateStripeCustomer).mockResolvedValue({
    id: "cus_new",
    created: true,
  } as never);
  vi.mocked(createCheckoutSession).mockResolvedValue({
    mode: "stripe",
    url: "https://checkout.stripe.com/c/abc",
    checkoutSessionId: "cs_1",
  } as never);
  vi.mocked(validateCoupon).mockResolvedValue({ valid: false } as never);
  vi.mocked(computeDiscount).mockReturnValue(0);
});

describe("POST /api/billing/checkout", () => {
  it("cria sessão de checkout e retorna url sem promover o plano", async () => {
    const res = await POST(makeRequest({ planCode: "PRO" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.mode).toBe("stripe");
    expect(body.data.url).toBe("https://checkout.stripe.com/c/abc");
    expect(body.data.checkoutSessionId).toBe("cs_1");

    expect(createCheckoutSession).toHaveBeenCalledWith(
      expect.objectContaining({
        planCode: "PRO",
        successUrl: expect.stringContaining("checkout=success"),
        cancelUrl: expect.stringContaining("checkout=cancel"),
      })
    );
    expect(prisma.company.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "c1" },
        data: { stripeCustomerId: "cus_new" },
      })
    );
  });

  it("retorna 400 para plano não assinável", async () => {
    const res = await POST(makeRequest({ planCode: "FREE" }));
    expect(res.status).toBe(400);
    expect(createCheckoutSession).not.toHaveBeenCalled();
  });

  it("retorna 503 quando Stripe não está configurado", async () => {
    vi.mocked(isStripeConfigured).mockReturnValue(false);
    const res = await POST(makeRequest({ planCode: "PRO" }));
    expect(res.status).toBe(503);
    expect(createCheckoutSession).not.toHaveBeenCalled();
  });

  it("retorna 503 quando o Price ID do plano está ausente, sem criar sessão", async () => {
    vi.mocked(getMissingStripePriceIds).mockReturnValue(["PRO"]);
    const res = await POST(makeRequest({ planCode: "PRO" }));
    expect(res.status).toBe(503);
    expect((await res.json()).error).toContain("Price");
    expect(createCheckoutSession).not.toHaveBeenCalled();
    expect(prisma.company.update).not.toHaveBeenCalled();
  });

  it("retorna 503 quando o Stripe lança StripeConfigError", async () => {
    vi.mocked(createCheckoutSession).mockRejectedValue(
      new StripeConfigError("Price ID não configurado para o plano PRO.")
    );
    const res = await POST(makeRequest({ planCode: "PRO" }));
    expect(res.status).toBe(503);
    expect((await res.json()).error).toContain("Price ID");
  });

  it("aceita cupom válido e repassa para o checkout", async () => {
    vi.mocked(validateCoupon).mockResolvedValue({
      valid: true,
      coupon: { id: "coupon_1", code: "PROMO10", discountType: "PERCENTAGE", discountValue: 10 },
    } as never);
    vi.mocked(computeDiscount).mockReturnValue(1190);

    const res = await POST(makeRequest({ planCode: "PRO", couponCode: "promo10" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.amount).toBe(10710);
    expect(createCheckoutSession).toHaveBeenCalledWith(
      expect.objectContaining({ couponCode: "promo10" })
    );
  });

  it("retorna 401 quando não autenticado", async () => {
    vi.mocked(requirePermission).mockResolvedValue({
      user: null as never,
      response: new Response(
        JSON.stringify({ success: false, error: "Não autorizado" }),
        { status: 401 }
      ) as never,
    });
    const res = await POST(makeRequest({ planCode: "PRO" }));
    expect(res.status).toBe(401);
    expect(getPlanByCode).not.toHaveBeenCalled();
  });
});