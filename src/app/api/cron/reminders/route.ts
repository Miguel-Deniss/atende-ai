import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/auth/api-response";
import { runAppointmentReminders } from "@/lib/reminders";

export async function GET(request: NextRequest) {
  const secret = request.headers.get("x-cron-secret");
  const expected = process.env.CRON_SECRET;

  if (!expected) {
    return errorResponse("CRON_SECRET não configurada no servidor", 503);
  }

  if (secret !== expected) {
    return errorResponse("Não autorizado", 401);
  }

  try {
    const result = await runAppointmentReminders();
    return successResponse(result);
  } catch {
    return errorResponse("Erro interno do servidor", 500);
  }
}
