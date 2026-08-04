import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth/api-guard";
import {
  successResponse,
  errorResponse,
} from "@/lib/auth/api-response";
import { validateCoupon } from "@/lib/billing/coupons";

export async function POST(request: NextRequest) {
  try {
    const { response } = await requireAuth();
    if (response) return response;

    const body = await request.json();
    const { code, planCode } = body;

    if (!code || typeof code !== "string") {
      return errorResponse("Código do cupom é obrigatório", 400);
    }

    const result = await validateCoupon(code, planCode ?? "PRO");

    if (!result.valid) {
      return successResponse({ valid: false, reason: result.reason });
    }

    return successResponse({
      valid: true,
      coupon: result.coupon,
    });
  } catch (error) {
    console.error(error);
    return errorResponse("Erro interno do servidor", 500);
  }
}
