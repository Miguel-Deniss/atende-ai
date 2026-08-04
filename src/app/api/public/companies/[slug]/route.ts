import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/auth/api-response";
import { getPublicCompany } from "@/lib/booking/public-booking";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const company = await getPublicCompany(slug);

    if (!company) {
      return errorResponse("Empresa não encontrada", 404);
    }

    return successResponse(company);
  } catch {
    return errorResponse("Erro interno do servidor", 500);
  }
}
