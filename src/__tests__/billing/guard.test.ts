import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth/api-guard", () => ({
  requireAuth: vi.fn(),
}));

vi.mock("@/lib/billing/subscription", () => ({
  enforceBilling: vi.fn(),
}));

vi.mock("@/lib/auth/api-response", () => ({
  errorResponse: vi.fn(
    (message: string, status = 400) =>
      new Response(JSON.stringify({ success: false, error: message }), { status })
  ),
}));

import { requireAuth } from "@/lib/auth/api-guard";
import { enforceBilling } from "@/lib/billing/subscription";
import { requireSubscription, SUBSCRIPTION_BLOCKED_STATUS } from "@/lib/billing/guard";

const mockUser = {
  id: "u1",
  email: "a@b.com",
  name: "Admin",
  role: "ADMIN",
  companyId: "c1",
  isActive: true,
  twoFactorEnabled: false,
  emailVerified: true,
  company: {
    name: "Empresa",
    status: "ACTIVE",
    planType: "PRO",
    subscriptionStatus: "ACTIVE",
  },
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("requireSubscription", () => {
  it("retorna 401 sem acesso autenticado", async () => {
    (requireAuth as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: null,
      response: new Response(null, { status: 401 }),
    });

    const { response } = await requireSubscription();
    expect(response?.status).toBe(401);
  });

  it("propaga erro de auth (empresa suspensa)", async () => {
    (requireAuth as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: mockUser,
      response: new Response(null, { status: 403 }),
    });

    const { response } = await requireSubscription();
    expect(response?.status).toBe(403);
    expect(enforceBilling).not.toHaveBeenCalled();
  });

  it("bloqueia quando assinatura n\u00e3o permite acesso", async () => {
    (requireAuth as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: mockUser,
      response: null,
    });
    (enforceBilling as ReturnType<typeof vi.fn>).mockResolvedValue({
      allowed: false,
      status: "PAST_DUE",
      reason: "Pagamento pendente. Atualize sua forma de pagamento.",
    });

    const { user, response } = await requireSubscription();
    expect(response?.status).toBe(SUBSCRIPTION_BLOCKED_STATUS);
    expect(user?.companyId).toBe("c1");
    expect(await (response as Response).json()).toMatchObject({
      error: "Pagamento pendente. Atualize sua forma de pagamento.",
    });
  });

  it("libera quando assinatura está ativa", async () => {
    (requireAuth as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: mockUser,
      response: null,
    });
    (enforceBilling as ReturnType<typeof vi.fn>).mockResolvedValue({
      allowed: true,
      status: "ACTIVE",
    });

    const { user, response } = await requireSubscription();
    expect(response).toBeNull();
    expect(user?.companyId).toBe("c1");
  });

  it("libera dentro do trial e bloqueia trial expirado", async () => {
    (requireAuth as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: mockUser,
      response: null,
    });
    (enforceBilling as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ allowed: true, status: "TRIALING" })
      .mockResolvedValueOnce({
        allowed: false,
        status: "TRIALING",
        reason: "Período de teste expirado. Renove sua assinatura.",
      });

    const first = await requireSubscription();
    expect(first.response).toBeNull();

    const second = await requireSubscription();
    expect(second.response?.status).toBe(SUBSCRIPTION_BLOCKED_STATUS);
  });
});
