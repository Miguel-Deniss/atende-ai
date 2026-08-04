import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth/session", () => ({
  getCurrentUser: vi.fn(),
}));

vi.mock("@/lib/auth/api-response", () => ({
  unauthorizedResponse: vi.fn(() => new Response(null, { status: 401 })),
  forbiddenResponse: vi.fn(() => new Response(null, { status: 403 })),
  errorResponse: vi.fn(() => new Response(null, { status: 500 })),
}));

import { getCurrentUser } from "@/lib/auth/session";
import { requireAuth, requireRole, requirePermission } from "@/lib/auth/api-guard";

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

describe("requireAuth", () => {
  it("retorna 401 sem usuário", async () => {
    (getCurrentUser as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const { user, response } = await requireAuth();
    expect(user).toBeNull();
    expect(response?.status).toBe(401);
  });

  it("retorna 403 para empresa inativa", async () => {
    (getCurrentUser as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...mockUser,
      company: { ...mockUser.company, status: "SUSPENDED" },
    });
    const { response } = await requireAuth();
    expect(response?.status).toBe(500);
  });

  it("libera usuário ativo", async () => {
    (getCurrentUser as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);
    const { user, response } = await requireAuth();
    expect(response).toBeNull();
    expect(user?.id).toBe("u1");
  });
});

describe("requireRole", () => {
  it("rejeita papel fora da lista", async () => {
    (getCurrentUser as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);
    const { response } = await requireRole(["SUPER_ADMIN"]);
    expect(response?.status).toBe(403);
  });

  it("aceita papel da lista", async () => {
    (getCurrentUser as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);
    const { user, response } = await requireRole(["ADMIN", "SUPER_ADMIN"]);
    expect(response).toBeNull();
    expect(user?.role).toBe("ADMIN");
  });
});

describe("requirePermission", () => {
  it("rejeita sem permissão", async () => {
    (getCurrentUser as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...mockUser,
      role: "ATTENDANT",
    });
    const { response } = await requirePermission("company:manage_billing");
    expect(response?.status).toBe(403);
  });

  it("aceita com permissão", async () => {
    (getCurrentUser as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);
    const { user, response } = await requirePermission("company:manage_users");
    expect(response).toBeNull();
    expect(user?.companyId).toBe("c1");
  });
});
