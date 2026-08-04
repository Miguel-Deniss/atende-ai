import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("stripe", () => {
  class MockStripe {
    customers = {
      list: vi.fn(),
      create: vi.fn(),
    };
    checkout = {
      sessions: {
        create: vi.fn(),
      },
    };
    billingPortal = {
      sessions: {
        create: vi.fn(),
      },
    };
    subscriptions = {
      update: vi.fn(),
      retrieve: vi.fn(),
    };
  }
  return { default: MockStripe };
});

import {
  mapPlanToPriceId,
  mapPriceIdToPlan,
  isStripeConfigured,
  getOrCreateStripeCustomer,
  createCheckoutSession,
  createBillingPortalSession,
  cancelStripeSubscription,
  getStripeClient,
  resetStripeClient,
} from "@/lib/billing/stripe";
import Stripe from "stripe";

const OriginalEnv = { ...process.env };

beforeEach(() => {
  vi.resetModules();
  process.env = { ...OriginalEnv };
  resetStripeClient();
});

describe("isStripeConfigured", () => {
  it("retorna true quando STRIPE_SECRET_KEY existe", () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_123";
    expect(isStripeConfigured()).toBe(true);
  });

  it("retorna false quando STRIPE_SECRET_KEY não existe", () => {
    delete process.env.STRIPE_SECRET_KEY;
    expect(isStripeConfigured()).toBe(false);
  });
});

describe("mapPlanToPriceId", () => {
  it("mapeia plano para price id", () => {
    process.env.STRIPE_PRO_PRICE_ID = "price_pro";
    expect(mapPlanToPriceId("PRO")).toBe("price_pro");
  });

  it("retorna null para plano sem price id", () => {
    delete process.env.STRIPE_ENTERPRISE_PRICE_ID;
    expect(mapPlanToPriceId("ENTERPRISE")).toBeNull();
  });
});

describe("mapPriceIdToPlan", () => {
  it("mapeia price id para plano", () => {
    process.env.STRIPE_STARTER_PRICE_ID = "price_starter";
    expect(mapPriceIdToPlan("price_starter")).toBe("STARTER");
  });

  it("retorna null para price id desconhecido", () => {
    expect(mapPriceIdToPlan("price_unknown")).toBeNull();
  });
});

describe("getOrCreateStripeCustomer", () => {
  it("reutiliza customer existente pelo email", async () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_123";
    const client = getStripeClient() as unknown as {
      customers: {
        list: ReturnType<typeof vi.fn>;
        create: ReturnType<typeof vi.fn>;
      };
    };
    client.customers.list.mockResolvedValue({ data: [{ id: "cus_existing" }] });

    const result = await getOrCreateStripeCustomer({
      companyId: "c1",
      email: "a@b.com",
      name: "Empresa",
    });

    expect(result).toEqual({ id: "cus_existing", created: false });
    expect(client.customers.create).not.toHaveBeenCalled();
  });

  it("cria customer novo quando não existe", async () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_123";
    const client = getStripeClient() as unknown as {
      customers: { list: ReturnType<typeof vi.fn>; create: ReturnType<typeof vi.fn> };
    };
    client.customers.list.mockResolvedValue({ data: [] });
    client.customers.create.mockResolvedValue({ id: "cus_new" });

    const result = await getOrCreateStripeCustomer({
      companyId: "c1",
      email: "a@b.com",
      name: "Empresa",
    });

    expect(result).toEqual({ id: "cus_new", created: true });
    expect(client.customers.create).toHaveBeenCalledWith({
      email: "a@b.com",
      name: "Empresa",
      metadata: { companyId: "c1" },
    });
  });
});

describe("createCheckoutSession", () => {
  it("retorna modo demo sem Stripe configurado", async () => {
    delete process.env.STRIPE_SECRET_KEY;
    const result = await createCheckoutSession({
      companyId: "c1",
      customerId: "cus_1",
      planCode: "PRO",
      amount: 11900,
      successUrl: "https://example.com/success",
      cancelUrl: "https://example.com/cancel",
      email: "a@b.com",
      companyName: "Empresa",
    });
    expect(result).toEqual({ mode: "demo" });
  });

  it("retorna modo demo quando plano não tem price id", async () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_123";
    delete process.env.STRIPE_STARTER_PRICE_ID;
    const result = await createCheckoutSession({
      companyId: "c1",
      customerId: "cus_1",
      planCode: "STARTER",
      amount: 5900,
      successUrl: "https://example.com/success",
      cancelUrl: "https://example.com/cancel",
      email: "a@b.com",
      companyName: "Empresa",
    });
    expect(result).toEqual({ mode: "demo" });
  });

  it("cria sessão de checkout com customer", async () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_123";
    process.env.STRIPE_PRO_PRICE_ID = "price_pro";
    const client = getStripeClient() as unknown as {
      checkout: { sessions: { create: ReturnType<typeof vi.fn> } };
    };
    client.checkout.sessions.create.mockResolvedValue({
      url: "https://checkout.stripe.com/c/abc",
      id: "cs_123",
    });

    const result = await createCheckoutSession({
      companyId: "c1",
      customerId: "cus_1",
      planCode: "PRO",
      amount: 11900,
      couponCode: "PROMO",
      successUrl: "https://example.com/success",
      cancelUrl: "https://example.com/cancel",
      email: "a@b.com",
      companyName: "Empresa",
    });

    expect(result.mode).toBe("stripe");
    expect(result.url).toBe("https://checkout.stripe.com/c/abc");
    expect(result.checkoutSessionId).toBe("cs_123");
    expect(client.checkout.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: "subscription",
        customer: "cus_1",
        metadata: expect.objectContaining({ companyId: "c1", planCode: "PRO", couponCode: "PROMO" }),
      })
    );
  });
});

describe("createBillingPortalSession", () => {
  it("cria sessão do portal de billing", async () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_123";
    const client = getStripeClient() as unknown as {
      billingPortal: { sessions: { create: ReturnType<typeof vi.fn> } };
    };
    client.billingPortal.sessions.create.mockResolvedValue({ url: "https://billing.stripe.com/p/xyz" });

    const url = await createBillingPortalSession({
      customerId: "cus_1",
      returnUrl: "https://example.com/back",
    });

    expect(url).toBe("https://billing.stripe.com/p/xyz");
    expect(client.billingPortal.sessions.create).toHaveBeenCalledWith({
      customer: "cus_1",
      return_url: "https://example.com/back",
    });
  });
});

describe("cancelStripeSubscription", () => {
  it("cancela ao final do período", async () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_123";
    const client = getStripeClient() as unknown as {
      subscriptions: { update: ReturnType<typeof vi.fn> };
    };
    client.subscriptions.update.mockResolvedValue({ id: "sub_1" });

    await cancelStripeSubscription("sub_1");

    expect(client.subscriptions.update).toHaveBeenCalledWith("sub_1", {
      cancel_at_period_end: true,
    });
  });
});
