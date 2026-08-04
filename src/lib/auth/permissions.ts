export type PermissionRole =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "ATTENDANT"
  | "EMPLOYEE"
  | "FINANCIAL";

export type Permission =
  | "company:view_conversations"
  | "company:respond_conversations"
  | "company:view_clients"
  | "company:manage_whatsapp"
  | "company:manage_ai"
  | "company:manage_users"
  | "company:manage_documents"
  | "company:view_metrics"
  | "company:manage_billing"
  | "company:export_data"
  | "platform:manage_all";

export const ROLE_HIERARCHY: PermissionRole[] = [
  "SUPER_ADMIN",
  "ADMIN",
  "FINANCIAL",
  "EMPLOYEE",
  "ATTENDANT",
];

const ROLE_RANK: Record<PermissionRole, number> = {
  SUPER_ADMIN: 5,
  ADMIN: 4,
  FINANCIAL: 2,
  EMPLOYEE: 1,
  ATTENDANT: 1,
};

const COMPANY_ADMIN_PERMISSIONS: Permission[] = [
  "company:view_conversations",
  "company:respond_conversations",
  "company:view_clients",
  "company:manage_whatsapp",
  "company:manage_ai",
  "company:manage_users",
  "company:manage_documents",
  "company:view_metrics",
  "company:manage_billing",
  "company:export_data",
];

const ROLE_PERMISSIONS: Record<PermissionRole, Permission[]> = {
  SUPER_ADMIN: ["platform:manage_all", ...COMPANY_ADMIN_PERMISSIONS],
  ADMIN: COMPANY_ADMIN_PERMISSIONS,
  ATTENDANT: [
    "company:view_conversations",
    "company:respond_conversations",
    "company:view_clients",
  ],
  EMPLOYEE: [
    "company:view_conversations",
    "company:respond_conversations",
    "company:view_clients",
  ],
  FINANCIAL: ["company:view_metrics", "company:manage_billing"],
};

export function authorize(
  user: { role: string },
  allowedRoles: PermissionRole[]
): boolean {
  return allowedRoles.includes(user.role as PermissionRole);
}

export function can(user: { role: string }, permission: Permission): boolean {
  return (
    ROLE_PERMISSIONS[user.role as PermissionRole]?.includes(permission) ?? false
  );
}

export function isSuperAdmin(role: string): boolean {
  return role === "SUPER_ADMIN";
}

export function isCompanyAdmin(role: string): boolean {
  return role === "ADMIN" || role === "SUPER_ADMIN";
}

export function roleAtLeast(role: string, minRole: PermissionRole): boolean {
  const rank = ROLE_RANK[role as PermissionRole];
  const minRank = ROLE_RANK[minRole];
  if (rank === undefined || minRank === undefined) return false;
  return rank >= minRank;
}
