import { getSupabaseAdmin, getSupabaseClient, isSupabaseConfigured } from "./client";
import { logger } from "@/lib/logger/structured";

const STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "company-uploads";

export async function uploadToSupabase(
  companyId: string,
  filePath: string,
  fileBuffer: Buffer,
  contentType: string
): Promise<{ url?: string; error?: string }> {
  if (!isSupabaseConfigured()) return { error: "Supabase não configurado" };

  try {
    const admin = getSupabaseAdmin();
    if (!admin) return { error: "Supabase admin não disponível" };

    const storagePath = `${companyId}/${filePath}`;

    const { data, error } = await admin.storage
      .from(STORAGE_BUCKET)
      .upload(storagePath, fileBuffer, { contentType, upsert: true });

    if (error) {
      logger.error("Supabase upload failed", {
        action: "supabase_upload",
        error: error.message,
        metadata: { companyId, storagePath },
      });
      return { error: error.message };
    }

    const { data: urlData } = admin.storage.from(STORAGE_BUCKET).getPublicUrl(storagePath);
    return { url: urlData.publicUrl };
  } catch (err) {
    logger.error("Supabase upload exception", {
      action: "supabase_upload_error",
      error: err instanceof Error ? err.message : "unknown",
    });
    return { error: "Erro ao fazer upload" };
  }
}

export async function deleteFromSupabase(companyId: string, filePath: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  try {
    const admin = getSupabaseAdmin();
    if (!admin) return false;

    const storagePath = `${companyId}/${filePath}`;
    const { error } = await admin.storage.from(STORAGE_BUCKET).remove([storagePath]);

    if (error) {
      logger.error("Supabase delete failed", {
        action: "supabase_delete",
        error: error.message,
      });
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

export async function listCompanyFiles(companyId: string): Promise<string[]> {
  if (!isSupabaseConfigured()) return [];

  try {
    const admin = getSupabaseAdmin();
    if (!admin) return [];

    const { data, error } = await admin.storage.from(STORAGE_BUCKET).list(companyId, {
      sortBy: { column: "created_at", order: "desc" },
    });

    if (error) {
      logger.error("Supabase list failed", {
        action: "supabase_list",
        error: error.message,
      });
      return [];
    }

    return (data || []).map((f) => f.name);
  } catch {
    return [];
  }
}

export async function getSignedUrl(
  companyId: string,
  filePath: string,
  expiresInSeconds = 3600
): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    const client = getSupabaseClient();
    if (!client) return null;

    const storagePath = `${companyId}/${filePath}`;
    const { data, error } = await client.storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(storagePath, expiresInSeconds);

    if (error) {
      logger.error("Signed URL generation failed", {
        action: "supabase_signed_url",
        error: error.message,
      });
      return null;
    }

    return data.signedUrl;
  } catch {
    return null;
  }
}
