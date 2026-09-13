import { getCurrentUser } from "@/lib/auth/session";

import { successResponse, errorResponse } from "@/lib/auth/api-response";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return errorResponse("Não autorizado", 401);
    }

    return successResponse({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
      isActive: user.isActive,
      twoFactorEnabled: user.twoFactorEnabled,
      emailVerified: user.emailVerified,
      company: {
        name: user.company.name,
        status: user.company.status,
        planType: user.company.planType,
        subscriptionStatus: user.company.subscriptionStatus,
      },
    });
  } catch (error) {
    console.error("ME ERROR:", error);
    return errorResponse("Não autorizado", 401);
  }
}
