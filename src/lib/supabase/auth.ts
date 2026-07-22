import { getSupabaseAdmin, isSupabaseConfigured } from "./client";
import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/logger/structured";

export interface SupabaseUser {
  id: string;
  email: string;
  user_metadata: {
    name?: string;
    company_id?: string;
    role?: string;
  };
}

export async function createSupabaseUser(
  email: string,
  password: string,
  metadata: { name: string; companyId: string; role: string }
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured()) return { success: true };

  try {
    const admin = getSupabaseAdmin();
    if (!admin) return { success: false, error: "Supabase não configurado" };

    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name: metadata.name,
        company_id: metadata.companyId,
        role: metadata.role,
      },
    });

    if (error) {
      logger.error("Failed to create Supabase user", {
        action: "supabase_user_creation",
        error: error.message,
      });
      return { success: false, error: error.message };
    }

    if (data?.user) {
      await prisma.user.update({
        where: { email },
        data: { googleId: data.user.id },
      });
    }

    return { success: true };
  } catch (err) {
    logger.error("Supabase user creation exception", {
      action: "supabase_user_creation_error",
      error: err instanceof Error ? err.message : "unknown",
    });
    return { success: false, error: "Erro ao criar usuário no Supabase" };
  }
}

export async function deleteSupabaseUser(supabaseUserId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return true;

  try {
    const admin = getSupabaseAdmin();
    if (!admin) return false;

    const { error } = await admin.auth.admin.deleteUser(supabaseUserId);
    if (error) {
      logger.error("Failed to delete Supabase user", {
        action: "supabase_user_deletion",
        error: error.message,
      });
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

export async function listSupabaseUsers(companyId: string): Promise<SupabaseUser[]> {
  if (!isSupabaseConfigured()) return [];

  try {
    const admin = getSupabaseAdmin();
    if (!admin) return [];

    const { data, error } = await admin.auth.admin.listUsers();

    if (error) {
      logger.error("Failed to list Supabase users", {
        action: "supabase_user_list",
        error: error.message,
      });
      return [];
    }

    const users = data.users as Array<{ id: string; email?: string; user_metadata?: Record<string, unknown> }>;

    return users
      .filter((u) => u.user_metadata?.company_id === companyId)
      .map((u) => ({
        id: u.id,
        email: u.email || "",
        user_metadata: {
          name: u.user_metadata?.name as string | undefined,
          company_id: u.user_metadata?.company_id as string | undefined,
          role: u.user_metadata?.role as string | undefined,
        },
      }));
  } catch {
    return [];
  }
}
