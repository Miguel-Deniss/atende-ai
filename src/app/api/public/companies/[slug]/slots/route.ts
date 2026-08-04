import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/auth/api-response";
import { getPublicCompany, getAvailableSlots } from "@/lib/booking/public-booking";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const company = await getPublicCompany(slug);

    if (!company) {
      return errorResponse("Empresa não encontrada", 404);
    }
    if (!company.bookingEnabled) {
      return errorResponse("Agendamento online indisponível", 403);
    }

    const date = request.nextUrl.searchParams.get("date");
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return errorResponse("Parâmetro date obrigatório no formato YYYY-MM-DD", 400);
    }

    const slots = await getAvailableSlots(company.companyId, date, company.hours);
    return successResponse({ date, slots });
  } catch {
    return errorResponse("Erro interno do servidor", 500);
  }
}
