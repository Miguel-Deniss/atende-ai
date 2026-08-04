import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { hashPassword } from "@/lib/auth/password";
import { setAuthCookies } from "@/lib/auth/session";
import { registerSchema } from "@/lib/validators/auth";
import { successResponse, errorResponse } from "@/lib/auth/api-response";
import { createLog } from "@/lib/logger";
import { generateToken } from "@/lib/security/encryption";
import { sendVerificationEmail } from "@/lib/email";
import { getAppUrl } from "@/lib/email/client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(
        "Dados inválidos",
        400,
        parsed.error.flatten().fieldErrors
      );
    }

    const { name, email, password, companyName, phone } = parsed.data;
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const userAgent = request.headers.get("user-agent") || undefined;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return errorResponse("Este email já está cadastrado", 409);
    }

    const passwordHash = await hashPassword(password);
    const slug = companyName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") + "-" + Date.now().toString(36);

    const company = await prisma.company.create({
      data: {
        name: companyName,
        slug,
        phone,
        status: "ACTIVE",
        subscriptionStatus: "TRIALING",
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        settings: {
          create: {},
        },
      },
    });

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: "ADMIN",
        companyId: company.id,
        phone,
        emailVerificationToken: generateToken(),
      },
    });

    await setAuthCookies(user.id, company.id, user.role, ip, userAgent);

    await createLog({
      action: "REGISTER",
      entity: "user",
      entityId: user.id,
      description: `Novo usuário registrado: ${email} na empresa ${companyName}`,
      companyId: company.id,
      userId: user.id,
      ipAddress: ip,
      userAgent,
    });

    try {
      const verifyUrl = `${getAppUrl()}/verify-email?token=${user.emailVerificationToken}`;
      await sendVerificationEmail({
        to: email,
        verifyUrl,
        companyId: company.id,
        userId: user.id,
      });
    } catch (error) {
      console.error("Failed to send verification email:", error);
      await createLog({
        action: "EMAIL_FAILED",
        entity: "user",
        entityId: user.id,
        description: "Falha ao enviar e-mail de verificação no registro",
        companyId: company.id,
        userId: user.id,
        ipAddress: ip,
        userAgent,
      });
    }

    return successResponse({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyId: company.id,
        companyName: company.name,
        emailVerified: user.emailVerified,
      },
    }, 201);
  } catch (error) {
    console.error("Register error:", error);
    return errorResponse("Erro interno do servidor", 500);
  }
}
