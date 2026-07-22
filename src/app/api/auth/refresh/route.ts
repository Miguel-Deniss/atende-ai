import { refreshAccessToken } from "@/lib/auth/session";
import { successResponse, errorResponse } from "@/lib/auth/api-response";

export async function POST() {
  try {
    const newToken = await refreshAccessToken();
    if (!newToken) {
      return errorResponse("Sessão expirada. Faça login novamente.", 401);
    }
    return successResponse({ message: "Token renovado" });
  } catch {
    return errorResponse("Não foi possível renovar o token", 401);
  }
}
