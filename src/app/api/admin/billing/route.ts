import { successResponse, errorResponse } from "@/lib/auth/api-response";
import { requireRole } from "@/lib/auth/api-guard";
import { getAdminBillingOverview } from "@/lib/billing/reports";

export async function GET() {
  try {
    const { response } = await requireRole(["SUPER_ADMIN"]);
    if (response) return response;

    const overview = await getAdminBillingOverview();

    return successResponse(overview);
  } catch (error) {
    console.error(error);
    return errorResponse("Erro interno do servidor", 500);
  }
}
