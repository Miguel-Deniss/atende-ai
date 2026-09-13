import { NextRequest } from "next/server";
import { errorResponse, successResponse } from "@/lib/auth/api-response";
import { runRetentionCleanup } from "@/lib/maintenance/retention";

export async function POST(request: NextRequest) {
  const expected = process.env.CRON_SECRET;
  if (!expected || request.headers.get("authorization") !== `Bearer ${expected}`) {
    return errorResponse("Nao encontrado", 404);
  }

  return successResponse(await runRetentionCleanup());
}
