import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
} from "@/lib/auth/api-response";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();

    const config = await prisma.whatsAppConfig.findUnique({
      where: { companyId: user.companyId },
      select: {
        phoneNumberId: true,
        businessAccountId: true,
        phoneNumber: true,
        status: true,
        updatedAt: true,
      },
    });

    if (!config) {
      return successResponse({
        connected: false,
        status: "DISCONNECTED",
      });
    }

    return successResponse({
      connected: config.status === "CONNECTED",
      status: config.status,
      phoneNumber: config.phoneNumber,
      phoneNumberId: config.phoneNumberId,
      businessAccountId: config.businessAccountId,
      updatedAt: config.updatedAt.toISOString(),
    });
  } catch {
    return errorResponse("Erro interno do servidor", 500);
  }
}
