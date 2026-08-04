import { NextRequest } from "next/server";
import { requirePermission } from "@/lib/auth/api-guard";
import { successResponse, errorResponse } from "@/lib/auth/api-response";
import { getBillingHistory } from "@/lib/billing/subscription";

export async function GET(request: NextRequest) {
  try {
    const { user, response } = await requirePermission("company:view_metrics");
    if (response) return response;

    const searchParams = request.nextUrl.searchParams;
    const limitRaw = Number(searchParams.get("limit") ?? "20");
    const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 100) : 20;

    const history = await getBillingHistory(user!.companyId, limit);

    return successResponse(
      history.map((h) => ({
        id: h.id,
        action: h.action,
        amount: h.amount,
        currency: h.currency,
        status: h.status,
        description: h.description,
        createdAt: h.createdAt,
      }))
    );
  } catch (error) {
    console.error(error);
    return errorResponse("Erro interno do servidor", 500);
  }
}
