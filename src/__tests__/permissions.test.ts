import { describe, it, expect } from "vitest";
import {
  can,
  authorize,
  isSuperAdmin,
  isCompanyAdmin,
  roleAtLeast,
  ROLE_HIERARCHY,
} from "@/lib/auth/permissions";

describe("RBAC permissions", () => {
  describe("can", () => {
    it("SUPER_ADMIN tem todas as permissões", () => {
      expect(can({ role: "SUPER_ADMIN" }, "platform:manage_all")).toBe(true);
      expect(can({ role: "SUPER_ADMIN" }, "company:manage_billing")).toBe(true);
      expect(can({ role: "SUPER_ADMIN" }, "company:view_conversations")).toBe(true);
      expect(can({ role: "SUPER_ADMIN" }, "company:manage_clients")).toBe(true);
      expect(can({ role: "SUPER_ADMIN" }, "company:manage_schedule")).toBe(true);
      expect(can({ role: "SUPER_ADMIN" }, "company:manage_settings")).toBe(true);
    });

    it("ADMIN tem permissões da empresa, mas não platform:manage_all", () => {
      expect(can({ role: "ADMIN" }, "company:manage_users")).toBe(true);
      expect(can({ role: "ADMIN" }, "company:manage_billing")).toBe(true);
      expect(can({ role: "ADMIN" }, "company:manage_clients")).toBe(true);
      expect(can({ role: "ADMIN" }, "company:manage_settings")).toBe(true);
      expect(can({ role: "ADMIN" }, "platform:manage_all")).toBe(false);
    });

    it("ATTENDANT vê/responder conversas, clientes e agenda, mas não gerencia", () => {
      expect(can({ role: "ATTENDANT" }, "company:view_conversations")).toBe(true);
      expect(can({ role: "ATTENDANT" }, "company:respond_conversations")).toBe(true);
      expect(can({ role: "ATTENDANT" }, "company:view_clients")).toBe(true);
      expect(can({ role: "ATTENDANT" }, "company:view_schedule")).toBe(true);
      expect(can({ role: "ATTENDANT" }, "company:manage_clients")).toBe(false);
      expect(can({ role: "ATTENDANT" }, "company:manage_schedule")).toBe(false);
      expect(can({ role: "ATTENDANT" }, "company:manage_billing")).toBe(false);
      expect(can({ role: "ATTENDANT" }, "company:manage_users")).toBe(false);
      expect(can({ role: "ATTENDANT" }, "company:view_metrics")).toBe(false);
    });

    it("EMPLOYEE gerencia agenda mas não billing/usuários/settings", () => {
      expect(can({ role: "EMPLOYEE" }, "company:view_conversations")).toBe(true);
      expect(can({ role: "EMPLOYEE" }, "company:respond_conversations")).toBe(true);
      expect(can({ role: "EMPLOYEE" }, "company:view_clients")).toBe(true);
      expect(can({ role: "EMPLOYEE" }, "company:view_schedule")).toBe(true);
      expect(can({ role: "EMPLOYEE" }, "company:manage_schedule")).toBe(true);
      expect(can({ role: "EMPLOYEE" }, "company:manage_clients")).toBe(false);
      expect(can({ role: "EMPLOYEE" }, "company:manage_billing")).toBe(false);
      expect(can({ role: "EMPLOYEE" }, "company:manage_users")).toBe(false);
      expect(can({ role: "EMPLOYEE" }, "company:manage_settings")).toBe(false);
      expect(can({ role: "EMPLOYEE" }, "company:view_metrics")).toBe(false);
    });

    it("FINANCIAL vê métricas e gerencia billing, mas não conversas/agenda", () => {
      expect(can({ role: "FINANCIAL" }, "company:view_metrics")).toBe(true);
      expect(can({ role: "FINANCIAL" }, "company:manage_billing")).toBe(true);
      expect(can({ role: "FINANCIAL" }, "company:view_conversations")).toBe(false);
      expect(can({ role: "FINANCIAL" }, "company:view_schedule")).toBe(false);
      expect(can({ role: "FINANCIAL" }, "company:view_clients")).toBe(false);
    });

    it("permissão inexistente retorna false", () => {
      expect(can({ role: "ADMIN" }, "company:export_data")).toBe(true);
      expect(can({ role: "ADMIN" }, "company:nonexistent" as never)).toBe(false);
    });

    it("papel desconhecido não tem permissões", () => {
      expect(can({ role: "GHOST" }, "company:view_clients")).toBe(false);
    });
  });

  describe("authorize", () => {
    it("aceita apenas papéis da lista", () => {
      expect(authorize({ role: "ADMIN" }, ["ADMIN", "SUPER_ADMIN"])).toBe(true);
      expect(authorize({ role: "ATTENDANT" }, ["ADMIN", "SUPER_ADMIN"])).toBe(false);
    });
  });

  describe("isSuperAdmin / isCompanyAdmin", () => {
    it("apenas SUPER_ADMIN é super admin", () => {
      expect(isSuperAdmin("SUPER_ADMIN")).toBe(true);
      expect(isSuperAdmin("ADMIN")).toBe(false);
    });

    it("ADMIN e SUPER_ADMIN são company admins", () => {
      expect(isCompanyAdmin("ADMIN")).toBe(true);
      expect(isCompanyAdmin("SUPER_ADMIN")).toBe(true);
      expect(isCompanyAdmin("FINANCIAL")).toBe(false);
      expect(isCompanyAdmin("ATTENDANT")).toBe(false);
    });
  });

  describe("roleAtLeast", () => {
    it("hierarquia correta", () => {
      expect(roleAtLeast("SUPER_ADMIN", "ADMIN")).toBe(true);
      expect(roleAtLeast("ADMIN", "ATTENDANT")).toBe(true);
      expect(roleAtLeast("FINANCIAL", "ADMIN")).toBe(false);
      expect(roleAtLeast("EMPLOYEE", "ATTENDANT")).toBe(true);
      expect(roleAtLeast("ATTENDANT", "EMPLOYEE")).toBe(true);
    });

    it("papel desconhecido retorna false", () => {
      expect(roleAtLeast("GHOST", "ADMIN")).toBe(false);
    });
  });

  it("ROLE_HIERARCHY lista todos os papéis sem duplicar", () => {
    expect(new Set(ROLE_HIERARCHY).size).toBe(ROLE_HIERARCHY.length);
    expect(ROLE_HIERARCHY).toContain("SUPER_ADMIN");
    expect(ROLE_HIERARCHY).toContain("ADMIN");
    expect(ROLE_HIERARCHY).toContain("FINANCIAL");
    expect(ROLE_HIERARCHY).toContain("EMPLOYEE");
    expect(ROLE_HIERARCHY).toContain("ATTENDANT");
  });
});
