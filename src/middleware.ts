import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyEdgeToken } from "@/lib/auth/jwt-edge";

const PUBLIC_PATHS = [
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
  "/api/auth/verify-email",
  "/api/auth/resend-verification",
  "/api/webhooks/stripe",
  "/api/webhooks/whatsapp",
  "/api/cron/reminders",
  "/api/cron/webhooks",
  "/api/cron/retention",
  "/api/health",
  "/api/public",
  "/b",
  "/legal",
  "/privacy",
  "/terms",
  "/refund",
  "/help",
  "/faq",
  "/status",
];

const AUTH_API_PATHS = ["/api/auth/"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/api/health") {
    return NextResponse.next();
  }

  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/static/") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  const response = NextResponse.next();

  const isPublicPath = PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(path + "/")
  );

  if (isPublicPath) {
    return response;
  }

  if (pathname.startsWith("/dashboard")) {
    const accessToken = request.cookies.get("access_token")?.value;
    const refreshToken = request.cookies.get("refresh_token")?.value;
    const sessionToken = request.cookies.get("session_token")?.value;

    const hasSession = accessToken || refreshToken || sessionToken;

    if (!hasSession) {
      return NextResponse.redirect(
        new URL(`/login?next=${encodeURIComponent(pathname)}`, request.url)
      );
    }
  }

  if (pathname.startsWith("/admin") && !pathname.startsWith("/api/admin")) {
    const accessToken = request.cookies.get("access_token")?.value;
    const refreshToken = request.cookies.get("refresh_token")?.value;
    const sessionToken = request.cookies.get("session_token")?.value;

    const hasSession = accessToken || refreshToken || sessionToken;

    if (!hasSession) {
      return NextResponse.redirect(
        new URL(`/login?next=${encodeURIComponent(pathname)}`, request.url)
      );
    }

    if (accessToken) {
      const payload = await verifyEdgeToken(accessToken);
      if (payload && payload.role !== "SUPER_ADMIN") {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    }
  }

  if (pathname.startsWith("/api/")) {
    if (isPublicPath) return response;

    const isAuthPath = AUTH_API_PATHS.some((path) => pathname.startsWith(path));

    if (isAuthPath) return response;

    if (!["GET", "HEAD", "OPTIONS"].includes(request.method)) {
      const origin = request.headers.get("origin");
      if (!origin || origin !== request.nextUrl.origin) {
        return NextResponse.json(
          { success: false, error: "Origem da requisicao nao autorizada" },
          { status: 403 }
        );
      }
    }

    const sessionToken = request.cookies.get("session_token")?.value;
    const accessToken = request.cookies.get("access_token")?.value;

    if (!sessionToken || !accessToken) {
      return NextResponse.json({ success: false, error: "Não autorizado" }, { status: 401 });
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
