import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { errorResponse, rateLimitResponse, successResponse } from "@/lib/auth/api-response";
import { sendVerificationEmail } from "@/lib/email";
import { getAppUrl } from "@/lib/email/client";
import { checkLoginRateLimit } from "@/lib/rate-limit";
import { generateToken } from "@/lib/security/encryption";

const schema = z.object({
  email: z
    .string()
    .trim()
    .email()
    .transform((value) => value.toLowerCase()),
});
const genericMessage = "Se a conta estiver pendente, um novo link será enviado.";

export async function POST(request: NextRequest) {
  try {
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return errorResponse("E-mail inválido", 400);

    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const rateCheck = await checkLoginRateLimit(`resend-verification:${ip}`);
    if (!rateCheck.allowed) return rateLimitResponse();

    const user = await prisma.user.findUnique({
      where: { email: parsed.data.email },
      select: { id: true, companyId: true, email: true, emailVerified: true, isActive: true },
    });

    if (!user || user.emailVerified || !user.isActive) {
      return successResponse({ message: genericMessage });
    }

    const token = generateToken();
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationToken: token,
        emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    await sendVerificationEmail({
      to: user.email,
      verifyUrl: `${getAppUrl()}/verify-email?token=${token}`,
      companyId: user.companyId,
      userId: user.id,
    });

    return successResponse({ message: genericMessage });
  } catch (error) {
    console.error("Resend verification error", error);
    return errorResponse("Não foi possível enviar o e-mail agora", 503);
  }
}
