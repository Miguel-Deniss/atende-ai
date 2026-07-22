import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { successResponse, errorResponse, unauthorizedResponse } from "@/lib/auth/api-response";
import { createLog } from "@/lib/logger";
import { sanitizeFilename } from "@/lib/security/sanitize";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";

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
  ".jpg", ".jpeg", ".png", ".webp", ".gif",
  ".pdf", ".txt", ".doc", ".docx", ".xls", ".xlsx",
];

const MAX_FILE_SIZE = parseInt(process.env.MAX_UPLOAD_SIZE || "5242880", 10);

const BLOCKED_EXTENSIONS = [
  ".exe", ".bat", ".cmd", ".com", ".msi", ".scr", ".pif",
  ".sh", ".bash", ".vbs", ".ps1", ".js", ".jse", ".wsf",
  ".wsh", ".hta", ".vbe", ".rb", ".py", ".pl", ".php",
  ".asp", ".aspx", ".cer", ".cgi", ".dll", ".jar",
];

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return errorResponse("Nenhum arquivo enviado", 400);
    }

    if (file.size > MAX_FILE_SIZE) {
      return errorResponse(`Arquivo muito grande. Máximo permitido: ${Math.round(MAX_FILE_SIZE / 1024 / 1024)}MB`, 400);
    }

    const ext = path.extname(file.name).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return errorResponse("Tipo de arquivo não permitido", 400);
    }

    if (BLOCKED_EXTENSIONS.includes(ext)) {
      await createLog({
        action: "SUSPICIOUS_ACTIVITY",
        entity: "upload",
        description: `Tentativa de upload bloqueada: ${file.name}`,
        companyId: user.companyId,
        userId: user.id,
      });
      return errorResponse("Tipo de arquivo bloqueado por segurança", 400);
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type) && file.type !== "") {
      return errorResponse("Tipo MIME não permitido", 400);
    }

    const safeName = sanitizeFilename(file.name);
    const storedName = `${crypto.randomUUID()}${ext}`;
    const uploadDir = process.env.UPLOAD_DIR || "uploads";
    const companyDir = path.join(process.cwd(), "public", uploadDir, user.companyId);
    const filePath = path.join(companyDir, storedName);

    await mkdir(companyDir, { recursive: true });

    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);

    const url = `/${uploadDir}/${user.companyId}/${storedName}`;

    const upload = await prisma.upload.create({
      data: {
        originalName: safeName,
        storedName,
        mimeType: file.type,
        size: file.size,
        path: filePath,
        url,
        companyId: user.companyId,
        uploadedById: user.id,
      },
    });

    return successResponse({ url, name: storedName, size: file.size, id: upload?.id });
  } catch {
    return errorResponse("Erro interno do servidor", 500);
  }
}
