import { NextRequest } from "next/server";
import { rateLimitResponse } from "@/lib/auth/api-response";
import {
  checkApiRateLimit,
  checkWebhookRateLimit,
  getRateLimitHeaders,
} from "./index";

type Kind = "api" | "webhook";

export function guardRateLimit(
  request: NextRequest,
  key: string,
  kind: Kind = "api"
): Response | null {
  const check =
    kind === "webhook"
      ? checkWebhookRateLimit(key)
      : checkApiRateLimit(key);

  if (check.allowed) {
    return null;
  }

  const response = rateLimitResponse();
  for (const [name, value] of Object.entries(
    getRateLimitHeaders(check)
  )) {
    response.headers.set(name, value);
  }
  return response;
}

export function clientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}
