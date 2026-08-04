import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
} from "@/lib/auth/api-response";
import { prisma } from "@/lib/db/prisma";
import { couponSchema } from "@/lib/validators/auth";
import { createLog } from "@/lib/logger";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();
    if (user.role !== "SUPER_ADMIN") {
      return forbiddenResponse("Apenas super administradores podem acessar esta área");
    }

    const { id } = await params;

    const existing = await prisma.coupon.findUnique({ where: { id } });
    if (!existing) return notFoundResponse("Cupom não encontrado");

    const body = await request.json();
    const parsed = couponSchema.partial().safeParse(body);
    if (!parsed.success) {
      return errorResponse("Dados inválidos", 400, parsed.error.flatten().fieldErrors);
    }

    const updated = await prisma.coupon.update({
      where: { id },
      data: {
        ...(parsed.data.discountType ? { discountType: parsed.data.discountType } : {}),
        ...(parsed.data.discountValue !== undefined ? { discountValue: parsed.data.discountValue } : {}),
        ...(parsed.data.maxUses !== undefined ? { maxUses: parsed.data.maxUses } : {}),
        ...(parsed.data.validUntil ? { validUntil: new Date(parsed.data.validUntil) } : {}),
        ...(parsed.data.isActive !== undefined ? { isActive: parsed.data.isActive } : {}),
        ...(parsed.data.allowedPlans ? { allowedPlans: parsed.data.allowedPlans } : {}),
        ...(parsed.data.code ? { code: parsed.data.code.toUpperCase() } : {}),
      },
    });

    await createLog({
      action: "COUPON_UPDATE",
      entity: "coupon",
      entityId: updated.id,
      description: `Cupom atualizado: ${updated.code}`,
      companyId: user.companyId,
      userId: user.id,
    });

    return successResponse(updated);
  } catch (error) {
    console.error(error);
    return errorResponse("Erro interno do servidor", 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();
    if (user.role !== "SUPER_ADMIN") {
      return forbiddenResponse("Apenas super administradores podem acessar esta área");
    }

    const { id } = await params;

    const existing = await prisma.coupon.findUnique({ where: { id } });
    if (!existing) return notFoundResponse("Cupom não encontrado");

    await prisma.coupon.delete({ where: { id } });

    await createLog({
      action: "COUPON_DELETE",
      entity: "coupon",
      entityId: id,
      description: `Cupom removido: ${existing.code}`,
      companyId: user.companyId,
      userId: user.id,
    });

    return successResponse({ message: "Cupom removido" });
  } catch (error) {
    console.error(error);
    return errorResponse("Erro interno do servidor", 500);
  }
}
