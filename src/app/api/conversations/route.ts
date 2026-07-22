import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { successResponse, errorResponse, unauthorizedResponse } from "@/lib/auth/api-response";
import { paginationSchema } from "@/lib/validators/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();

    const { searchParams } = new URL(request.url);
    const parsed = paginationSchema.safeParse({
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
      search: searchParams.get("search"),
      status: searchParams.get("status"),
    });

    const { page, limit, search, status } = parsed.data!;

    const where: Record<string, unknown> = {
      companyId: user.companyId,
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { message: { contains: search, mode: "insensitive" } },
      ];
    }

    if (status && status !== "todas") {
      where.status = status;
    }

    const [conversations, total] = await Promise.all([
      prisma.conversation.findMany({
        where: where as any,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ unread: "desc" }, { createdAt: "desc" }],
      }),
      prisma.conversation.count({ where: where as any }),
    ]);

    return successResponse({
      conversations,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch {
    return errorResponse("Erro interno do servidor", 500);
  }
}
