import { requireAuth } from "@/lib/auth/api-guard";
import { successResponse, errorResponse } from "@/lib/auth/api-response";
import { listActivePlans } from "@/lib/billing/plans";

export async function GET() {
  try {
    const { response } = await requireAuth();
    if (response) return response;

    const plans = await listActivePlans();

    return successResponse(
      plans.map((p) => ({
        code: p.code,
        name: p.name,
        price: p.price,
        currency: p.currency,
        trialDays: p.trialDays,
        limits: p.limits,
        features: p.features,
      }))
    );
  } catch (error) {
    console.error(error);
    return errorResponse("Erro interno do servidor", 500);
  }
}
