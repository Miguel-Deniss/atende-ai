import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { successResponse, errorResponse } from "@/lib/auth/api-response";
import { requireRole } from "@/lib/auth/api-guard";
import { paginationSchema } from "@/lib/validators/auth";
import { createLog } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const { response } = await requireRole(["SUPER_ADMIN"]);
    if (response) return response;

    const { searchParams } = new URL(request.url);
    const parsed = paginationSchema.safeParse({
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
      search: searchParams.get("search"),
      status: searchParams.get("status"),
    });

    const { page, limit, search, status } = parsed.data!;

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
      ];
    }

    if (status) {
      where.status = status;
    }

    const [companies, total] = await Promise.all([
      prisma.company.findMany({
        where: where as any,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: {
              users: true,
              clients: true,
              appointments: true,
            },
          },
        },
      }),
      prisma.company.count({ where: where as any }),
    ]);

    return successResponse({
      companies,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch {
    return errorResponse("Erro interno do servidor", 500);
  }
}
