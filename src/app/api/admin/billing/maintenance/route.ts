import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  forbiddenResponse,
} from "@/lib/auth/api-response";
import { processExpiredTrials, processPastDueCompanies } from "@/lib/billing/maintenance";

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();
    if (user.role !== "SUPER_ADMIN") {
      return forbiddenResponse("Apenas super administradores podem acessar esta área");
    }

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
