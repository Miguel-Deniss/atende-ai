import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/logger/structured";
import { isCompanyAdmin } from "@/lib/auth/permissions";
import crypto from "crypto";

function getSignedUrlSecret(): string {
  const secret = process.env.SIGNED_URL_SECRET;
  if (!secret) {
    throw new Error("SIGNED_URL_SECRET não configurado no ambiente");
  }
  return secret;
}

export interface FileAccessResult {
  allowed: boolean;
  reason?: string;
  record?: {
    id: string;
    originalName: string;
    storedName: string;
    mimeType: string;
    size: number;
    path: string;
    companyId: string;
  };
}

export async function validateFileAccess(
  uploadId: string,
  userId: string,
  userCompanyId: string,
  userRole: string
): Promise<FileAccessResult> {
  const upload = await prisma.upload.findUnique({
    where: { id: uploadId },
  });

  if (!upload) {
    return { allowed: false, reason: "Arquivo não encontrado" };
  }

  if (isCompanyAdmin(userRole)) {
    if (upload.companyId !== userCompanyId) {
      logger.warn(`IDOR attempt on file access`, {
        action: "idor_blocked_file",
        userId,
        metadata: {
          uploadId,
          fileCompanyId: upload.companyId,
          userCompanyId,
        },
      });
      return { allowed: false, reason: "Arquivo não encontrado" };
    }

    return { allowed: true, record: upload };
  }

  if (upload.companyId !== userCompanyId) {
    logger.warn(`IDOR attempt on file access`, {
      action: "idor_blocked_file",
      userId,
      metadata: {
        uploadId,
        fileCompanyId: upload.companyId,
        userCompanyId,
      },
    });
    return { allowed: false, reason: "Arquivo não encontrado" };
  }

  return { allowed: true, record: upload };
}

export function generateFileToken(uploadId: string, companyId: string, expiresInMs = 3600000): string {
  const expiresAt = Date.now() + expiresInMs;
  const payload = `${uploadId}:${companyId}:${expiresAt}`;
  const signature = crypto
    .createHmac("sha256", getSignedUrlSecret())
    .update(payload)
    .digest("hex");

  return Buffer.from(`${payload}:${signature}`).toString("base64url");
}

export function validateFileToken(token: string): {
  valid: boolean;
  uploadId?: string;
  companyId?: string;
} {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf-8");
    const parts = decoded.split(":");
    if (parts.length !== 4) return { valid: false };

    const [uploadId, companyId, expiresAtStr, signature] = parts;
    const expiresAt = parseInt(expiresAtStr, 10);

    if (Date.now() > expiresAt) {
      return { valid: false };
    }

    const expectedSignature = crypto
      .createHmac("sha256", getSignedUrlSecret())
      .update(`${uploadId}:${companyId}:${expiresAtStr}`)
      .digest("hex");

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return { valid: false };
    }

    return { valid: true, uploadId, companyId };
  } catch {
    return { valid: false };
  }
}

export function getFileMimeCategory(mimeType: string): "image" | "document" | "other" {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType === "application/pdf") return "document";
  if (mimeType.startsWith("text/")) return "document";
  if (mimeType.includes("spreadsheet") || mimeType.includes("document")) return "document";
  return "other";
}
