import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    company: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
    subscription: {
      updateMany: vi.fn(),
    },
    user: {
      updateMany: vi.fn(),
    },
  },
}));

vi.mock("@/lib/logger", () => ({
  createLog: vi.fn(async () => {}),
}));

import { prisma } from "@/lib/db/prisma";
import { processExpiredTrials, processPastDueCompanies } from "@/lib/billing/maintenance";

const mockCompany = {
  findMany: vi.fn(),
  update: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("processExpiredTrials", () => {
  it("suspende empresas com trial expirado", async () => {
    const expired = [{ id: "c1", name: "Empresa A", planType: "STARTER" }];
    (prisma.company.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(expired);

    const result = await processExpiredTrials();

    expect(result).toEqual({ expiredTrials: 1, suspended: 1 });
    expect(prisma.company.update).toHaveBeenCalledWith({
      where: { id: "c1" },
      data: { status: "SUSPENDED" },
    });
    expect(prisma.subscription.updateMany).toHaveBeenCalledWith({
      where: { companyId: "c1" },
      data: { status: "PAST_DUE" },
    });
    expect(prisma.user.updateMany).toHaveBeenCalledWith({
      where: { companyId: "c1" },
      data: { isActive: false },
    });
  });

  it("não suspende nada quando não há trials expirados", async () => {
    (prisma.company.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    const result = await processExpiredTrials();

    expect(result).toEqual({ expiredTrials: 0, suspended: 0 });
    expect(prisma.company.update).not.toHaveBeenCalled();
  });
});

describe("processPastDueCompanies", () => {
  it("suspende empresas com pagamento pendente", async () => {
    (prisma.company.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: "c2", name: "Empresa B" },
    ]);

    const result = await processPastDueCompanies();

    expect(result).toEqual({ expiredTrials: 0, suspended: 1 });
    expect(prisma.company.update).toHaveBeenCalledWith({
      where: { id: "c2" },
      data: { status: "SUSPENDED" },
    });
    expect(prisma.user.updateMany).toHaveBeenCalledWith({
      where: { companyId: "c2" },
      data: { isActive: false },
    });
  });
});
