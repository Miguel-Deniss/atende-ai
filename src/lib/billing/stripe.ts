import Stripe from "stripe";

const STRIPE_PRICE_IDS: Record<string, string | undefined> = {
  STARTER: process.env.STRIPE_STARTER_PRICE_ID,
  PRO: process.env.STRIPE_PRO_PRICE_ID,
  BUSINESS: process.env.STRIPE_BUSINESS_PRICE_ID,
  ENTERPRISE: process.env.STRIPE_ENTERPRISE_PRICE_ID,
};

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function mapPlanToPriceId(planCode: string): string | null {
  return STRIPE_PRICE_IDS[planCode] ?? null;
}

export interface CheckoutResult {
  mode: "stripe" | "demo";
  url?: string;
  checkoutSessionId?: string;
}

export async function createCheckoutSession(opts: {
  companyId: string;
  planCode: string;
  amount: number;
  couponCode?: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<CheckoutResult> {
  if (!isStripeConfigured()) {
    return { mode: "demo" };
  }

  const priceId = mapPlanToPriceId(opts.planCode);
  if (!priceId) {
    return { mode: "demo" };
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    metadata: {
      companyId: opts.companyId,
      planCode: opts.planCode,
      ...(opts.couponCode ? { couponCode: opts.couponCode } : {}),
    },
    success_url: opts.successUrl,
    cancel_url: opts.cancelUrl,
  });

  return { mode: "stripe", url: session.url ?? undefined, checkoutSessionId: session.id };
}
