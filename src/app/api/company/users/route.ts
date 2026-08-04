import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { hashPassword } from "@/lib/auth/password";
import { requirePermission } from "@/lib/auth/api-guard";
import {
  successResponse,
  errorResponse,
} from "@/lib/auth/api-response";
import { createLog } from "@/lib/logger";
import { createUserSchema } from "@/lib/validators/auth";
import { checkUserLimit } from "@/lib/tenant/plan-limits";

export async function GET() {
  try {
    const { user, response } = await requirePermission("company:manage_users");
    if (response) return response;

    const users = await prisma.user.findMany({
      where: {
        companyId: user!.companyId,
        deletedAt: null,
      },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        isActive: true,
        twoFactorEnabled: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });

    return successResponse(users);
  } catch (error) {
    console.error(error);
    return errorResponse("Erro interno do servidor", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, response } = await requirePermission("company:manage_users");
    if (response) return response;

    const body = await request.json();
    const parsed = createUserSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(
        "Dados inválidos",
        400,
        parsed.error.flatten().fieldErrors
      );
    }

    const existing = await prisma.user.findUnique({
      where: { email: parsed.data.email },
    });
    if (existing) {
      return errorResponse("Já existe um usuário com este email", 409);
    }

    const [userCount, company] = await Promise.all([
      prisma.user.count({ where: { companyId: user!.companyId } }),
      prisma.company.findUnique({ where: { id: user!.companyId } }),
    ]);

    const limitCheck = await checkUserLimit(userCount, company?.planType ?? "FREE");
    if (!limitCheck.allowed) {
      return errorResponse(limitCheck.message, 403);
    }

    const created = await prisma.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        passwordHash: await hashPassword(parsed.data.password),
        role: parsed.data.role,
        phone: parsed.data.phone,
        emailVerified: true,
        companyId: user!.companyId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    await createLog({
      action: "USER_CREATE",
      entity: "user",
      entityId: created.id,
      description: `Usuário criado: ${created.name} (${created.role})`,
      companyId: user!.companyId,
      userId: user!.id,
    });

    return successResponse(created, 201);
  } catch (error) {
    console.error(error);
    return errorResponse("Erro interno do servidor", 500);
  }
}
