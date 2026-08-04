import { prisma } from "@/lib/db/prisma";

export interface CouponInfo {
  id: string;
  code: string;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
}

export interface CouponValidationResult {
  valid: boolean;
  reason?: string;
  coupon?: CouponInfo;
}

export async function validateCoupon(
  code: string,
  planCode: string
): Promise<CouponValidationResult> {
  const normalized = code.trim().toUpperCase();

  const coupon = await prisma.coupon.findUnique({
    where: { code: normalized },
  });

  if (!coupon) {
    return { valid: false, reason: "Cupom não encontrado" };
  }

  if (!coupon.isActive) {
    return { valid: false, reason: "Cupom inativo" };
  }

  if (coupon.validUntil && coupon.validUntil < new Date()) {
    return { valid: false, reason: "Cupom expirado" };
  }

  if (coupon.maxUses != null && coupon.usedCount >= coupon.maxUses) {
    return { valid: false, reason: "Cupom esgotado" };
  }

  if (
    coupon.allowedPlans.length > 0 &&
    !coupon.allowedPlans.includes(planCode)
  ) {
    return { valid: false, reason: "Cupom não se aplica a este plano" };
  }

  return {
    valid: true,
    coupon: {
      id: coupon.id,
      code: coupon.code,
      discountType: coupon.discountType as "PERCENTAGE" | "FIXED",
      discountValue: coupon.discountValue,
    },
  };
}

export function computeDiscount(
  price: number,
  discountType: "PERCENTAGE" | "FIXED",
  discountValue: number
): number {
  if (discountType === "FIXED") {
    return Math.min(discountValue, price);
  }
  return Math.min(Math.round((price * discountValue) / 100), price);
}

export async function incrementCouponUsage(couponId: string): Promise<void> {
  await prisma.coupon.update({
    where: { id: couponId },
    data: { usedCount: { increment: 1 } },
  });
}
