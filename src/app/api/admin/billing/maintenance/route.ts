import { successResponse, errorResponse } from "@/lib/auth/api-response";
import { requireRole } from "@/lib/auth/api-guard";
import { processExpiredTrials, processPastDueCompanies } from "@/lib/billing/maintenance";

export async function POST() {
  try {
    const { response } = await requireRole(["SUPER_ADMIN"]);
    if (response) return response;

    const [expired, pastDue] = await Promise.all([
      processExpiredTrials(),
      processPastDueCompanies(),
    ]);

    return successResponse({
      processed: true,
      expiredTrials: expired.expiredTrials,
      pastDueSuspended: pastDue.suspended,
    });
  } catch (error) {
    console.error(error);
    return errorResponse("Erro interno do servidor", 500);
  }
}
