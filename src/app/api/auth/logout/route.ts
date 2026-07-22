import { NextRequest } from "next/server";
import { revokeSession, clearAuthCookies, getCurrentUser } from "@/lib/auth/session";
import { successResponse, errorResponse } from "@/lib/auth/api-response";
import { createLog } from "@/lib/logger";
import { cookies } from "next/headers";

export async function POST() {
  try {
    const user = await getCurrentUser();
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session_token")?.value;

    if (sessionToken) {
      await revokeSession(sessionToken);
    }

    await clearAuthCookies();

    if (user) {
      await createLog({
        action: "LOGOUT",
        entity: "user",
        entityId: user.id,
        description: `Usuário ${user.email} fez logout`,
        companyId: user.companyId,
        userId: user.id,
      });
    }

    return successResponse({ message: "Logout realizado com sucesso" });
  } catch {
    await clearAuthCookies();
    return successResponse({ message: "Logout realizado com sucesso" });
  }
}

export async function DELETE() {
  return POST();
}
