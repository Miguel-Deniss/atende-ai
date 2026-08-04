import { getCurrentUser } from "@/lib/auth/session";
import {
  unauthorizedResponse,
  forbiddenResponse,
  errorResponse,
} from "@/lib/auth/api-response";
import {
  authorize,
  can,
  type Permission,
  type PermissionRole,
} from "./permissions";

export type ScopedUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

export type GuardResult = {
  user: ScopedUser;
  response: Response | null;
};

export async function requireAuth(): Promise<GuardResult> {
  const user = await getCurrentUser();
  if (!user) return { user: user as unknown as ScopedUser, response: unauthorizedResponse() };

  if (user.company.status !== "ACTIVE") {
    return {
      user,
      response: errorResponse("Empresa inativa ou suspensa", 403),
    };
  }

  return { user, response: null };
}

export async function requireRole(
  roles: PermissionRole[]
): Promise<GuardResult> {
  const { user, response } = await requireAuth();
  if (response) return { user, response };

  if (!authorize(user, roles)) {
    return { user, response: forbiddenResponse("Acesso não autorizado para esta função") };
  }

  return { user, response: null };
}

export async function requirePermission(
  permission: Permission
): Promise<GuardResult> {
  const { user, response } = await requireAuth();
  if (response) return { user, response };

  if (!can(user, permission)) {
    return { user, response: forbiddenResponse("Acesso não autorizado para esta função") };
  }

  return { user, response: null };
}
