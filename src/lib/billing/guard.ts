import { requireAuth, type GuardResult, type ScopedUser } from "@/lib/auth/api-guard";
import { enforceBilling } from "@/lib/billing/subscription";
import { errorResponse } from "@/lib/auth/api-response";

export type SubscriptionGuardResult = GuardResult;

export const SUBSCRIPTION_BLOCKED_STATUS = 402;

export async function requireSubscription(): Promise<SubscriptionGuardResult> {
  const { user, response } = await requireAuth();
  if (response) return { user, response };

  const billing = await enforceBilling(user.companyId);

  if (!billing.allowed) {
    return {
      user: user as ScopedUser,
      response: errorResponse(
        billing.reason ?? "Assinatura necessária para acessar esta funcionalidade.",
        SUBSCRIPTION_BLOCKED_STATUS
      ),
    };
  }

  return { user, response: null };
}
