import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse } from "@/lib/auth/api-response";
import { validateFileAccess, validateFileToken } from "@/lib/storage/access";
import { logger } from "@/lib/logger/structured";
import { readFile } from "fs/promises";
import path from "path";
import { existsSync } from "fs";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const token = request.nextUrl.searchParams.get("token");
    const user = await getCurrentUser();

    if (!user && !token) {
      return unauthorizedResponse();
    }

    let upload;
    if (token) {
      const validation = validateFileToken(token);
      if (!validation.valid || validation.uploadId !== id) {
        return errorResponse("Link inválido ou expirado", 401);
      }
      upload = await prisma.upload.findUnique({ where: { id } });
    } else if (user) {
      const access = await validateFileAccess(id, user.id, user.companyId, user.role);
      if (!access.allowed) {
        return notFoundResponse("Arquivo não encontrado");
      }
      upload = access.record;
    } else {
      return unauthorizedResponse();
    }

    if (!upload) {
      return notFoundResponse("Arquivo não encontrado");
    }

    const filePath = upload.path;
    if (!existsSync(filePath)) {
      return errorResponse("Arquivo não encontrado no disco", 404);
    }

    const buffer = await readFile(filePath);

    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type": upload.mimeType,
        "Content-Disposition": `inline; filename="${upload.originalName}"`,
        "Content-Length": String(upload.size),
        "Cache-Control": "private, max-age=3600",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    logger.error("Falha ao servir arquivo", {
      action: "file_serving_failed",
      error: error instanceof Error ? error.message : String(error),
      metadata: { uploadId: id },
    });
    return errorResponse("Não foi possível carregar o arquivo.", 500);
  }
}
