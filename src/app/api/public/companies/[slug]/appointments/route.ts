import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/auth/api-response";
import { guardRateLimit, clientIp } from "@/lib/rate-limit/with-rate-limit";
import { publicBookingSchema } from "@/lib/validators/auth";
import { getPublicCompany, createPublicBooking } from "@/lib/booking/public-booking";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const rateLimit = await guardRateLimit(request, `public-booking:${clientIp(request)}`);
    if (rateLimit) return rateLimit;

    const { slug } = await params;
    const company = await getPublicCompany(slug);

    if (!company) {
      return errorResponse("Empresa não encontrada", 404);
    }
    if (!company.bookingEnabled) {
      return errorResponse("Agendamento online indisponível", 403);
    }

    const body = await request.json();
    const parsed = publicBookingSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse("Dados inválidos", 400, parsed.error.flatten().fieldErrors);
    }

    const result = await createPublicBooking(company.companyId, slug, parsed.data);

    if (!result.success) {
      return errorResponse(result.message, 409);
    }

    return successResponse({ appointmentId: result.appointmentId, message: result.message }, 201);
  } catch {
    return errorResponse("Erro interno do servidor", 500);
  }
}
