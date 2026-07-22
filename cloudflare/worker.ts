// ============================================================================
// Cloudflare Worker: Security, Cache & Routing Enhancement
// ============================================================================
// This worker runs at the edge before requests reach the Next.js server.
// It adds security headers, enforces cache rules, and protects against DDoS.
// Deploy: npx wrangler deploy
// ============================================================================

export interface Env {
  APP_URL: string;
  BLOCKED_COUNTRIES?: string;
  RATE_LIMIT_PER_MINUTE?: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // --- Block known bad actors ---
    const userAgent = request.headers.get("User-Agent") || "";
    const blockedUAs = ["python-requests", "curl/", "wget", "scrapy", "bot"];
    if (blockedUAs.some((ua) => userAgent.toLowerCase().includes(ua))) {
      return new Response("Forbidden", { status: 403 });
    }

    // --- Block by country (configure via Cloudflare WAF instead) ---
    // const country = request.cf?.country;
    // if (env.BLOCKED_COUNTRIES?.split(',').includes(country || '')) {
    //   return new Response('Access denied', { status: 403 });
    // }

    // --- Rate limiting at edge ---
    // Implement with Cloudflare Rate Limiting rules instead of code.
    // The worker can use KV + Durable Objects for advanced rate limiting.

    // --- Forward to origin ---
    const response = await fetch(request);

    // --- Add security headers ---
    const newHeaders = new Headers(response.headers);

    newHeaders.set("X-Frame-Options", "DENY");
    newHeaders.set("X-Content-Type-Options", "nosniff");
    newHeaders.set("Referrer-Policy", "strict-origin-when-cross-origin");
    newHeaders.set(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload"
    );
    newHeaders.set(
      "Permissions-Policy",
      "camera=(), microphone=(), geolocation=(), interest-cohort=()"
    );
    newHeaders.set("Cross-Origin-Resource-Policy", "same-origin");
    newHeaders.set("Cross-Origin-Opener-Policy", "same-origin");

    // --- Cache control for static assets ---
    if (path.startsWith("/_next/static/")) {
      newHeaders.set(
        "Cache-Control",
        "public, max-age=31536000, immutable"
      );
      newHeaders.set("CDN-Cache-Control", "public, max-age=31536000, immutable");
    }

    // --- No cache for API ---
    if (path.startsWith("/api/")) {
      newHeaders.set("Cache-Control", "no-store, no-cache, must-revalidate");
      newHeaders.set("CDN-Cache-Control", "no-store");
    }

    // --- Uploads: private cache ---
    if (path.startsWith("/uploads/")) {
      newHeaders.set("Cache-Control", "private, max-age=3600");
    }

    // --- Cloudflare-specific headers ---
    newHeaders.set("X-Robots-Tag", "noindex, nofollow");

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  },
};
