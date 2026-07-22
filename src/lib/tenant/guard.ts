import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { errorResponse, unauthorizedResponse, forbiddenResponse } from "@/lib/auth/api-response";
import { logger } from "@/lib/logger/structured";
import type { LimitCheck } from "./plan-limits";

export interface TenantContext {
  userId: string;
  companyId: string;
  role: string;
  user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;
}

export interface GuardOptions {
  requireRole?: string[];
  requirePlan?: string[];
  checkSession?: boolean;
}

export async function resolveTenant(
  options: GuardOptions = {}
): Promise<{ context: TenantContext; response: null } | { context: null; response: Response }> {
  const user = await getCurrentUser();
  if (!user) {
    return { context: null, response: unauthorizedResponse() };
  }

  if (!user.isActive) {
    return { context: null, response: errorResponse("Conta desativada", 403) };
  }

  if (user.company.status !== "ACTIVE") {
    return { context: null, response: errorResponse("Empresa inativa ou suspensa", 403) };
  }

  if (options.requireRole && options.requireRole.length > 0) {
    if (!options.requireRole.includes(user.role)) {
      return { context: null, response: forbiddenResponse("Acesso não autorizado para esta função") };
    }
  }

  if (options.requirePlan && options.requirePlan.length > 0) {
    if (!options.requirePlan.includes(user.company.planType)) {
      return {
        context: null,
        response: errorResponse("Seu plano não permite esta funcionalidade", 403),
      };
    }
  }

  return {
    context: {
      userId: user.id,
      companyId: user.companyId,
      role: user.role,
      user,
    },
    response: null,
  };
}

export async function withTenantGuard<T>(
  handler: (context: TenantContext) => Promise<T>,
  options: GuardOptions = {}
): Promise<T | Response> {
  const result = await resolveTenant(options);
  if (result.response) return result.response;
  return handler(result.context);
}

export async function validateResourceAccess<T extends { companyId: string }>(
  resource: T | null,
  context: TenantContext,
  resourceName: string
): Promise<{ resource: T; valid: true } | { resource: null; valid: false; response: Response }> {
  if (!resource) {
    return {
      resource: null,
      valid: false,
      response: errorResponse(`${resourceName} não encontrado(a)`, 404),
    };
  }

  if (resource.companyId !== context.companyId && context.role !== "ADMIN") {
    logger.warn(`IDOR attempt blocked`, {
      action: "idor_blocked",
      userId: context.userId,
      companyId: context.companyId,
      metadata: { resourceName, resourceId: (resource as any).id },
    });
    return {
      resource: null,
      valid: false,
      response: errorResponse(`${resourceName} não encontrado(a)`, 404),
    };
  }

  return { resource, valid: true };
}

export async function enforceResourceAccess(
  resourceId: string,
  companyId: string,
  context: TenantContext,
  resourceName: string
): Promise<boolean> {
  if (!resourceId || !companyId) return false;
  if (context.role === "ADMIN") return true;

  if (companyId !== context.companyId) {
    logger.warn(`IDOR attempt on ${resourceName}`, {
      action: "idor_blocked",
      userId: context.userId,
      metadata: { resourceName, resourceId, requestedCompanyId: companyId, userCompanyId: context.companyId },
    });
    return false;
  }

  return true;
}
