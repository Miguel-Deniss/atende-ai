import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { successResponse, errorResponse } from "@/lib/auth/api-response";
import { requireRole } from "@/lib/auth/api-guard";
import { paginationSchema } from "@/lib/validators/auth";

export async function GET(request: NextRequest) {
  try {
    const { response } = await requireRole(["SUPER_ADMIN"]);
    if (response) return response;

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
