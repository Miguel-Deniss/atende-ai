import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requirePermission } from "@/lib/auth/api-guard";
import { successResponse, errorResponse } from "@/lib/auth/api-response";
import { createLog } from "@/lib/logger";
import { logger } from "@/lib/logger/structured";
import { sanitizeFilename } from "@/lib/security/sanitize";
import { writeFile, mkdir, unlink } from "fs/promises";
import { guardRateLimit } from "@/lib/rate-limit/with-rate-limit";
import path from "path";
import crypto from "crypto";
import { hasValidFileSignature } from "@/lib/storage/file-validation";
import { getPlanLimits } from "@/lib/tenant/plan-limits";

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

const ALLOWED_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
  ".pdf",
  ".txt",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
];

const MAX_FILE_SIZE = parseInt(process.env.MAX_UPLOAD_SIZE || "5242880", 10);

const BLOCKED_EXTENSIONS = [
  ".exe",
  ".bat",
  ".cmd",
  ".com",
  ".msi",
  ".scr",
  ".pif",
  ".sh",
  ".bash",
  ".vbs",
  ".ps1",
  ".js",
  ".jse",
  ".wsf",
  ".wsh",
  ".hta",
  ".vbe",
  ".rb",
  ".py",
  ".pl",
  ".php",
  ".asp",
  ".aspx",
  ".cer",
  ".cgi",
  ".dll",
  ".jar",
];

function logUploadError(error: unknown, companyId?: string, userId?: string) {
  logger.error("Falha no upload de arquivo", {
    action: "upload_failed",
    error: error instanceof Error ? error.message : String(error),
    metadata: {
      companyId,
      userId,
      maxFileSize: MAX_FILE_SIZE,
    },
  });
}

export async function POST(request: NextRequest) {
  let companyId: string | undefined;
  let userId: string | undefined;
  let filePath: string | undefined;

  try {
    const { user, response } = await requirePermission("company:manage_documents");
    if (response) return response;

    companyId = user.companyId;
    userId = user.id;

    const blocked = await guardRateLimit(request, `upload:${companyId}`);
    if (blocked) {
      return blocked;
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return errorResponse("Nenhum arquivo enviado", 400);
    }

    const [uploadCount, aggregate] = await Promise.all([
      prisma.upload.count({ where: { companyId } }),
      prisma.upload.aggregate({ where: { companyId }, _sum: { size: true } }),
    ]);
    const limits = getPlanLimits(user.company.planType);
    const nextStorageMB = ((aggregate._sum.size ?? 0) + file.size) / (1024 * 1024);
    if (uploadCount >= limits.maxUploads || nextStorageMB > limits.maxStorageMB) {
      return errorResponse("Limite de armazenamento do plano atingido", 403);
    }

    if (file.size > MAX_FILE_SIZE) {
      logger.warn("Upload rejeitado: arquivo acima do limite", {
        action: "upload_too_large",
        metadata: { companyId, size: file.size, maxFileSize: MAX_FILE_SIZE },
      });
      return errorResponse(
        `Arquivo muito grande. Máximo permitido: ${Math.round(MAX_FILE_SIZE / 1024 / 1024)}MB`,
        400
      );
    }

    const ext = path.extname(file.name).toLowerCase();

    if (BLOCKED_EXTENSIONS.includes(ext)) {
      await createLog({
        action: "SUSPICIOUS_ACTIVITY",
        entity: "upload",
        description: `Tentativa de upload bloqueada: ${file.name}`,
        companyId,
        userId,
      });
      return errorResponse("Tipo de arquivo bloqueado por segurança", 400);
    }

    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return errorResponse("Tipo de arquivo não permitido", 400);
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type) && file.type !== "") {
      return errorResponse("Tipo MIME não permitido", 400);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    if (!hasValidFileSignature(file.name, buffer)) {
      return errorResponse("O conteúdo do arquivo não corresponde ao formato informado", 400);
    }

    const safeName = sanitizeFilename(file.name);
    const storedName = `${crypto.randomUUID()}${ext}`;
    const configuredUploadDir = process.env.UPLOAD_DIR || "uploads";
    const uploadRoot = path.isAbsolute(configuredUploadDir)
      ? configuredUploadDir
      : path.resolve(process.cwd(), configuredUploadDir);
    const companyDir = path.join(uploadRoot, companyId);
    filePath = path.join(companyDir, storedName);

    try {
      await mkdir(companyDir, { recursive: true });
      await writeFile(filePath, buffer);
    } catch (fsError) {
      logger.error("Falha ao gravar arquivo no disco", {
        action: "upload_disk_error",
        error: fsError instanceof Error ? fsError.message : String(fsError),
        metadata: { companyId, storedName },
      });
      return errorResponse("Não foi possível salvar o arquivo. Tente novamente.", 500);
    }

    const uploadId = crypto.randomUUID();
    const url = `/api/files/${uploadId}`;

    let upload;
    try {
      upload = await prisma.upload.create({
        data: {
          id: uploadId,
          originalName: safeName,
          storedName,
          mimeType: file.type,
          size: file.size,
          path: filePath,
          url,
          companyId,
          uploadedById: userId,
        },
      });
    } catch (dbError) {
      await unlink(filePath).catch(() => {});
      logger.error("Falha ao registrar upload no banco", {
        action: "upload_db_error",
        error: dbError instanceof Error ? dbError.message : String(dbError),
        metadata: { companyId, storedName },
      });
      return errorResponse("Não foi possível registrar o arquivo. Tente novamente.", 500);
    }

    return successResponse({ url, name: safeName, size: file.size, id: upload?.id });
  } catch (error) {
    logUploadError(error, companyId, userId);
    return errorResponse("Erro inesperado ao processar o upload. Tente novamente.", 500);
  }
}
