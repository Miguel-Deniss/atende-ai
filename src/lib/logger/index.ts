import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/logger/structured";

export type LogAction =
  | "LOGIN_SUCCESS"
  | "LOGIN_FAILURE"
  | "LOGOUT"
  | "PASSWORD_CHANGE"
  | "PASSWORD_RESET"
  | "EMAIL_VERIFY"
  | "REGISTER"
  | "PLAN_CHANGE"
  | "PAYMENT_SUCCESS"
  | "PAYMENT_FAILURE"
  | "SUBSCRIPTION_CANCEL"
  | "AI_CONFIG_CHANGE"
  | "AI_APPOINTMENT_CREATE"
  | "USER_CREATE"
  | "USER_DELETE"
  | "USER_UPDATE"
  | "DATA_EXPORT"
  | "DATA_DELETE"
  | "ACCOUNT_SUSPEND"
  | "ACCOUNT_ACTIVATE"
  | "WEBHOOK_RECEIVED"
  | "WEBHOOK_FAILED"
  | "SUSPICIOUS_ACTIVITY"
  | "WHATSAPP_CONNECT"
  | "WHATSAPP_DISCONNECT"
  | "TWOFA_SETUP"
  | "TWOFA_VERIFY"
  | "TWOFA_DISABLE"
  | "TWOFA_RECOVERY_USED"
  | "SUBSCRIPTION_CREATED"
  | "SUBSCRIPTION_UPGRADE"
  | "SUBSCRIPTION_RENEWED"
  | "BILLING_BLOCKED"
  | "COUPON_CREATE"
  | "COUPON_UPDATE"
  | "COUPON_DELETE"
  | "EMAIL_SENT"
  | "EMAIL_FAILED";

const SYSTEM_COMPANY_IDS = new Set(["system"]);

export function logSystemEvent(params: {
  action: LogAction;
  entity: string;
  entityId?: string;
  description?: string;
}): void {
  logger.warn(
    `[audit:${params.action}] ${params.entity}${params.entityId ? ` (${params.entityId})` : ""}: ${params.description ?? ""}`
  );
}

export async function createLog(params: {
  action: LogAction;
  entity: string;
  entityId?: string;
  description?: string;
  oldValues?: Record<string, unknown> | null;
  newValues?: Record<string, unknown> | null;
  companyId: string;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  screen?: string;
}): Promise<void> {
  if (SYSTEM_COMPANY_IDS.has(params.companyId)) {
    logSystemEvent({
      action: params.action,
      entity: params.entity,
      entityId: params.entityId,
      description: params.description,
    });
    return;
  }

  try {
    await prisma.auditLog.create({
      data: {
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        description: params.description,
        oldValues: params.oldValues ? JSON.parse(JSON.stringify(params.oldValues)) : undefined,
        newValues: params.newValues ? JSON.parse(JSON.stringify(params.newValues)) : undefined,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
        screen: params.screen,
        companyId: params.companyId,
        userId: params.userId,
      },
    });
  } catch (error) {
    console.error("Failed to create audit log:", error);
  }
}

export function sanitizeLogData<T extends Record<string, unknown>>(data: T): T {
  const sensitiveKeys = [
    "password", "passwordHash", "token", "secret", "cardNumber",
    "cvc", "cvv", "creditCard", "apiKey", "privateKey", "twoFactorSecret",
  ];

  const sanitized = { ...data };
  for (const key of Object.keys(sanitized)) {
    if (sensitiveKeys.includes(key)) {
      (sanitized as Record<string, unknown>)[key] = "[REDACTED]";
    }
  }

  return sanitized;
}
