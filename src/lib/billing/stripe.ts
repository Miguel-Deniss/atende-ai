import Stripe from "stripe";

let stripeInstance: Stripe | null = null;

function getStripePriceIds(): Record<string, string | undefined> {
  return {
    STARTER: process.env.STRIPE_STARTER_PRICE_ID,
    PRO: process.env.STRIPE_PRO_PRICE_ID,
    BUSINESS: process.env.STRIPE_BUSINESS_PRICE_ID,
    ENTERPRISE: process.env.STRIPE_ENTERPRISE_PRICE_ID,
  };
}

export function resetStripeClient(): void {
  stripeInstance = null;
}

export function getStripeClient(): Stripe {
  if (stripeInstance) {
    return stripeInstance;
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error(
      "STRIPE_SECRET_KEY não configurada. Defina a variável para habilitar pagamentos Stripe."
    );
  }

  stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);
  return stripeInstance;
}

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function mapPlanToPriceId(planCode: string): string | null {
  return getStripePriceIds()[planCode] ?? null;
}

export function mapPriceIdToPlan(
  priceId: string | null | undefined
): "STARTER" | "PRO" | "BUSINESS" | "ENTERPRISE" | null {
  if (!priceId) return null;

  const env = process.env;
  if (priceId === env.STRIPE_STARTER_PRICE_ID) return "STARTER";
  if (priceId === env.STRIPE_PRO_PRICE_ID) return "PRO";
  if (priceId === env.STRIPE_BUSINESS_PRICE_ID) return "BUSINESS";
  if (priceId === env.STRIPE_ENTERPRISE_PRICE_ID) return "ENTERPRISE";
  return null;
}

export async function getOrCreateStripeCustomer(opts: {
  companyId: string;
  email: string;
  name: string;
}): Promise<{ id: string; created: boolean }> {
  const stripe = getStripeClient();

  const existing = await stripe.customers.list({
    email: opts.email,
    limit: 1,
  });

  if (existing.data.length > 0) {
    return { id: existing.data[0].id, created: false };
  }

  const customer = await stripe.customers.create({
    email: opts.email,
    name: opts.name,
    metadata: { companyId: opts.companyId },
  });

  return { id: customer.id, created: true };
}

export interface CheckoutResult {
  mode: "stripe" | "demo";
  url?: string;
  checkoutSessionId?: string;
  customerId?: string;
}

export async function createCheckoutSession(opts: {
  companyId: string;
  customerId: string;
  planCode: string;
  amount: number;
  couponCode?: string;
  successUrl: string;
  cancelUrl: string;
  email: string;
  companyName: string;
}): Promise<CheckoutResult> {
  if (!isStripeConfigured()) {
    return { mode: "demo" };
  }

  const priceId = mapPlanToPriceId(opts.planCode);
  if (!priceId) {
    return { mode: "demo" };
  }

  const stripe = getStripeClient();

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: opts.customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    metadata: {
      companyId: opts.companyId,
      planCode: opts.planCode,
      ...(opts.couponCode ? { couponCode: opts.couponCode } : {}),
    },
    success_url: opts.successUrl,
    cancel_url: opts.cancelUrl,
  });

  return {
    mode: "stripe",
    url: session.url ?? undefined,
    checkoutSessionId: session.id,
    customerId: opts.customerId,
  };
}

export async function createBillingPortalSession(opts: {
  customerId: string;
  returnUrl: string;
}): Promise<string> {
  const stripe = getStripeClient();

  const session = await stripe.billingPortal.sessions.create({
    customer: opts.customerId,
    return_url: opts.returnUrl,
  });

  return session.url;
}

export async function cancelStripeSubscription(subscriptionId: string): Promise<void> {
  const stripe = getStripeClient();

  await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  });
}

export async function getStripeSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription | null> {
  try {
    const stripe = getStripeClient();
    return await stripe.subscriptions.retrieve(subscriptionId);
  } catch {
    return null;
  }
}
