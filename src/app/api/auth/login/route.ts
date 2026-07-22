import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { setAuthCookies } from "@/lib/auth/session";
import { loginSchema } from "@/lib/validators/auth";
import { successResponse, errorResponse, rateLimitResponse } from "@/lib/auth/api-response";
import { checkLoginRateLimit, getRateLimitHeaders, resetLoginAttempts } from "@/lib/rate-limit";
import { createLog } from "@/lib/logger";
import { verifyToken } from "@/lib/auth/jwt";
import speakeasy from "speakeasy";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(
        "Dados inválidos",
        400,
        parsed.error.flatten().fieldErrors
      );
    }

    const { email, password, totpCode } = parsed.data;
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
    const userAgent = request.headers.get("user-agent") || undefined;

    const rateCheck = checkLoginRateLimit(`login:${ip}`);
    const rateHeaders = getRateLimitHeaders(rateCheck);

    if (!rateCheck.allowed) {
      return rateLimitResponse();
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { company: true },
    });

    if (!user || !user.passwordHash) {
      await createLog({
        action: "LOGIN_FAILURE",
        entity: "user",
        entityId: email,
        description: `Tentativa de login com email não cadastrado: ${email}`,
        companyId: "system",
        ipAddress: ip,
        userAgent,
      });

      const response = errorResponse("Email ou senha inválidos", 401);
      for (const [key, value] of Object.entries(rateHeaders)) {
        response.headers.set(key, value);
      }
      return response;
    }

    const validPassword = await verifyPassword(password, user.passwordHash);
    if (!validPassword) {
      await prisma.loginAttempt.create({
        data: {
          userId: user.id,
          email,
          ipAddress: ip,
          userAgent,
          success: false,
          reason: "invalid_password",
        },
      });

      await createLog({
        action: "LOGIN_FAILURE",
        entity: "user",
        entityId: user.id,
        description: `Falha de login para ${email}`,
        companyId: user.companyId,
        userId: user.id,
        ipAddress: ip,
        userAgent,
      });

      const response = errorResponse("Email ou senha inválidos", 401);
      for (const [key, value] of Object.entries(rateHeaders)) {
        response.headers.set(key, value);
      }
      return response;
    }

    if (!user.isActive) {
      return errorResponse("Conta desativada. Entre em contato com o suporte.", 403);
    }

    if (user.company.status === "SUSPENDED") {
      return errorResponse("Sua empresa está suspensa. Entre em contato com o suporte.", 403);
    }

    if (user.twoFactorEnabled) {
      if (!totpCode) {
        return successResponse({
          requiresTwoFactor: true,
          userId: user.id,
          message: "Código de autenticação em dois fatores necessário",
        }, 200);
      }

      if (!user.twoFactorSecret) {
        return errorResponse("2FA não configurado corretamente", 500);
      }

      const verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: "base32",
        token: totpCode,
        window: 1,
      });

      if (!verified) {
        return errorResponse("Código 2FA inválido", 401);
      }
    }

    await setAuthCookies(user.id, user.companyId, user.role, ip, userAgent);

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date(), lastLoginIp: ip },
    });

    await prisma.loginAttempt.create({
      data: {
        userId: user.id,
        email,
        ipAddress: ip,
        userAgent,
        success: true,
      },
    });

    resetLoginAttempts(`login:${ip}`);

    await createLog({
      action: "LOGIN_SUCCESS",
      entity: "user",
      entityId: user.id,
      description: `Login bem-sucedido: ${email}`,
      companyId: user.companyId,
      userId: user.id,
      ipAddress: ip,
      userAgent,
    });

    return successResponse({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyId: user.companyId,
        companyName: user.company.name,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return errorResponse("Erro interno do servidor", 500);
  }
}
