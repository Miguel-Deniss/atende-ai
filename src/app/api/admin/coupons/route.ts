import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  forbiddenResponse,
} from "@/lib/auth/api-response";
import { prisma } from "@/lib/db/prisma";
import { couponSchema } from "@/lib/validators/auth";
import { createLog } from "@/lib/logger";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();
    if (user.role !== "SUPER_ADMIN") {
      return forbiddenResponse("Apenas super administradores podem acessar esta área");
    }

    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        code: true,
        discountType: true,
        discountValue: true,
        maxUses: true,
        usedCount: true,
        validUntil: true,
        isActive: true,
        allowedPlans: true,
        createdAt: true,
      },
    });

    return successResponse(coupons);
  } catch (error) {
    console.error(error);
    return errorResponse("Erro interno do servidor", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();
    if (user.role !== "SUPER_ADMIN") {
      return forbiddenResponse("Apenas super administradores podem acessar esta área");
    }

    const body = await request.json();
    const parsed = couponSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse("Dados inválidos", 400, parsed.error.flatten().fieldErrors);
    }

    const existing = await prisma.coupon.findUnique({
      where: { code: parsed.data.code.toUpperCase() },
    });
    if (existing) {
      return errorResponse("Já existe um cupom com este código", 409);
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: parsed.data.code.toUpperCase(),
        discountType: parsed.data.discountType,
        discountValue: parsed.data.discountValue,
        maxUses: parsed.data.maxUses,
        validUntil: parsed.data.validUntil ? new Date(parsed.data.validUntil) : undefined,
        isActive: parsed.data.isActive ?? true,
        allowedPlans: parsed.data.allowedPlans ?? [],
      },
    });

    await createLog({
      action: "COUPON_CREATE",
      entity: "coupon",
      entityId: coupon.id,
      description: `Cupom criado: ${coupon.code} (${coupon.discountValue} ${coupon.discountType})`,
      companyId: user.companyId,
      userId: user.id,
    });

    return successResponse(coupon, 201);
  } catch (error) {
    console.error(error);
    return errorResponse("Erro interno do servidor", 500);
  }
}
