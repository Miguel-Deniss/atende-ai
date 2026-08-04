import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    coupon: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/db/prisma";
import {
  validateCoupon,
  computeDiscount,
  incrementCouponUsage,
} from "@/lib/billing/coupons";

const baseCoupon = {
  id: "c1",
  code: "BEMVINDO10",
  discountType: "PERCENTAGE",
  discountValue: 10,
  isActive: true,
  validUntil: null,
  maxUses: null,
  usedCount: 0,
  allowedPlans: [] as string[],
};

describe("coupons (billing)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("validateCoupon", () => {
    it("aceita cupom válido (percentual)", async () => {
      vi.mocked(prisma.coupon.findUnique).mockResolvedValue(baseCoupon as never);
      const result = await validateCoupon("bemvindo10", "PRO");
      expect(result.valid).toBe(true);
      expect(result.coupon).toMatchObject({
        code: "BEMVINDO10",
        discountType: "PERCENTAGE",
        discountValue: 10,
      });
      expect(prisma.coupon.findUnique).toHaveBeenCalledWith({
        where: { code: "BEMVINDO10" },
      });
    });

    it("rejeita cupom inexistente", async () => {
      vi.mocked(prisma.coupon.findUnique).mockResolvedValue(null as never);
      const result = await validateCoupon("NAOEXISTE", "PRO");
      expect(result.valid).toBe(false);
      expect(result.reason).toContain("não encontrado");
    });

    it("rejeita cupom inativo", async () => {
      vi.mocked(prisma.coupon.findUnique).mockResolvedValue({
        ...baseCoupon,
        isActive: false,
      } as never);
      const result = await validateCoupon("INATIVO", "PRO");
      expect(result.valid).toBe(false);
      expect(result.reason).toContain("inativo");
    });

    it("rejeita cupom expirado", async () => {
      vi.mocked(prisma.coupon.findUnique).mockResolvedValue({
        ...baseCoupon,
        validUntil: new Date(Date.now() - 1000),
      } as never);
      const result = await validateCoupon("EXPIRADO", "PRO");
      expect(result.valid).toBe(false);
      expect(result.reason).toContain("expirado");
    });

    it("rejeita cupom esgotado", async () => {
      vi.mocked(prisma.coupon.findUnique).mockResolvedValue({
        ...baseCoupon,
        maxUses: 5,
        usedCount: 5,
      } as never);
      const result = await validateCoupon("ESGOTADO", "PRO");
      expect(result.valid).toBe(false);
      expect(result.reason).toContain("esgotado");
    });

    it("rejeita cupom que não se aplica ao plano", async () => {
      vi.mocked(prisma.coupon.findUnique).mockResolvedValue({
        ...baseCoupon,
        allowedPlans: ["PRO"],
      } as never);
      const result = await validateCoupon("BUSINESSONLY", "BUSINESS");
      expect(result.valid).toBe(false);
      expect(result.reason).toContain("não se aplica");
    });

    it("aceita cupom quando allowedPlans inclui o plano", async () => {
      vi.mocked(prisma.coupon.findUnique).mockResolvedValue({
        ...baseCoupon,
        allowedPlans: ["PRO"],
      } as never);
      const result = await validateCoupon("PROONLY", "PRO");
      expect(result.valid).toBe(true);
    });
  });

  describe("computeDiscount", () => {
    it("percentual calcula corretamente", () => {
      expect(computeDiscount(11900, "PERCENTAGE", 10)).toBe(1190);
      expect(computeDiscount(11900, "PERCENTAGE", 25)).toBe(2975);
    });

    it("percentual nunca passa do valor total", () => {
      expect(computeDiscount(100, "PERCENTAGE", 200)).toBe(100);
    });

    it("fixo aplica valor direto", () => {
      expect(computeDiscount(11900, "FIXED", 5000)).toBe(5000);
    });

    it("fixo não passa do valor do plano", () => {
      expect(computeDiscount(5900, "FIXED", 10000)).toBe(5900);
    });
  });

  describe("incrementCouponUsage", () => {
    it("incrementa usedCount", async () => {
      vi.mocked(prisma.coupon.update).mockResolvedValue({} as never);
      await incrementCouponUsage("c1");
      expect(prisma.coupon.update).toHaveBeenCalledWith({
        where: { id: "c1" },
        data: { usedCount: { increment: 1 } },
      });
    });
  });
});
