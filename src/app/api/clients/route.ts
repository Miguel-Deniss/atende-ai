import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requirePermission } from "@/lib/auth/api-guard";
import { successResponse, errorResponse } from "@/lib/auth/api-response";
import { clientSchema, paginationSchema } from "@/lib/validators/auth";
import { createLog } from "@/lib/logger";
import { checkDefaultRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import { normalizeBrazilianPhone } from "@/lib/clients/phone";
import { Prisma } from "@prisma/client";
import { checkClientLimit } from "@/lib/tenant/plan-limits";

export async function GET(request: NextRequest) {
  try {
    const { user, response } = await requirePermission("company:view_clients");
    if (response) return response;

    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const rateCheck = await checkDefaultRateLimit(`api:${user.companyId}:${ip}`);
    if (!rateCheck.allowed) {
      return new Response(JSON.stringify({ success: false, error: "Muitas requisições" }), {
        status: 429,
        headers: getRateLimitHeaders(rateCheck),
      });
    }

    const { searchParams } = new URL(request.url);
    const parsed = paginationSchema.safeParse({
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
      search: searchParams.get("search"),
      status: searchParams.get("status"),
    });

    const { page, limit, search, status } = parsed.data!;

    const where: Prisma.ClientWhereInput = {
      companyId: user.companyId,
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { phone: { contains: search } },
        { lastService: { contains: search, mode: "insensitive" } },
      ];
    }

    if (status) {
      where.status = status;
    }

    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.client.count({ where }),
    ]);

    return successResponse({
      clients,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch {
    return errorResponse("Erro interno do servidor", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, response } = await requirePermission("company:manage_clients");
    if (response) return response;

    const body = await request.json();
    const parsed = clientSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse("Dados inválidos", 400, parsed.error.flatten().fieldErrors);
    }

    const currentClients = await prisma.client.count({
      where: { companyId: user.companyId, deletedAt: null },
    });
    const limit = checkClientLimit(currentClients, user.company.planType);
    if (!limit.allowed) return errorResponse(limit.message, 403);

    const client = await prisma.client.create({
      data: {
        ...parsed.data,
        phone: normalizeBrazilianPhone(parsed.data.phone),
        companyId: user.companyId,
        date: new Date(),
      },
    });

    await createLog({
      action: "USER_CREATE",
      entity: "client",
      entityId: client.id,
      description: `Cliente criado: ${client.name}`,
      companyId: user.companyId,
      userId: user.id,
    });

    return successResponse(client, 201);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return errorResponse("Ja existe um cliente com este telefone", 409);
    }
    if (error instanceof Error && error.message === "Telefone invalido") {
      return errorResponse("Telefone invalido", 400);
    }
    return errorResponse("Erro interno do servidor", 500);
  }
}
