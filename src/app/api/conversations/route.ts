import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
} from "@/lib/auth/api-response";
import { paginationSchema } from "@/lib/validators/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) return unauthorizedResponse();

    const { searchParams } = new URL(request.url);

    const parsed = paginationSchema.safeParse({
      page: searchParams.get("page") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
      search: searchParams.get("search") ?? undefined,
      status: searchParams.get("status") ?? undefined,
    });

    if (!parsed.success) {
      return errorResponse("Dados inválidos", 400);
    }

    const { page, limit, search, status } = parsed.data;

    const where: any = {
      companyId: user.companyId,
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        {
          name: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          phone: {
            contains: search,
            mode: "insensitive",
          },
        },
      ];
    }

    if (status && status !== "todas") {
      where.status = status;
    }


    const [conversations, total] = await Promise.all([
      prisma.conversation.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,

        orderBy: [
          {
            unread: "desc",
          },
          {
            updatedAt: "desc",
          },
        ],

        include: {
          messages: {
            orderBy: {
              createdAt: "desc",
            },
            take: 1,
          },
        },
      }),

      prisma.conversation.count({
        where,
      }),
    ]);


    return successResponse({
      conversations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });


  } catch (error) {

    console.error(error);

    return errorResponse(
      "Erro interno do servidor",
      500
    );
  }
}