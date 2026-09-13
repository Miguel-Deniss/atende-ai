import { NextRequest } from "next/server";
import { errorResponse, successResponse } from "@/lib/auth/api-response";
import { processPendingWhatsAppWebhooks } from "@/lib/whatsapp/queue";

export async function POST(request: NextRequest) {
  const expected = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");
  if (!expected || authorization !== `Bearer ${expected}`) {
    return errorResponse("Não autorizado", 401);
  }

  const result = await processPendingWhatsAppWebhooks();
  return successResponse(result);
}
