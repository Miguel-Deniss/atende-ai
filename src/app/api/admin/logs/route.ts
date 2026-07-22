import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse } from "@/lib/auth/api-response";
import { paginationSchema } from "@/lib/validators/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();
    if (user.role !== "ADMIN") return forbiddenResponse("Apenas administradores");

    const { searchParams } = new URL(request.url);
    const parsed = paginationSchema.safeParse({
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
      search: searchParams.get("search"),
      status: searchParams.get("action"),
    });

    const { page, limit } = parsed.data!;
    const action = searchParams.get("action");
    const companyId = searchParams.get("companyId");

    const where: Record<string, unknown> = {};
    if (action) where.action = action;
    if (companyId) where.companyId = companyId;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where: where as any,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { name: true, email: true } },
          company: { select: { name: true } },
        },
      }),
      prisma.auditLog.count({ where: where as any }),
    ]);

    return successResponse({
      logs,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch {
    return errorResponse("Erro interno do servidor", 500);
  }
}
