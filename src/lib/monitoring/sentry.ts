import { logger } from "@/lib/logger/structured";

const SENTRY_DSN = process.env.SENTRY_DSN;
let sentryInitialized = false;

export async function initSentry() {
  if (!SENTRY_DSN || sentryInitialized) return;

  try {
    const Sentry = await Function('return import("@sentry/nextjs")')();
    Sentry.init({
      dsn: SENTRY_DSN,
      environment: process.env.NODE_ENV || "development",
      tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
      sendDefaultPii: false,
      normalizeDepth: 6,
      maxBreadcrumbs: 50,
      debug: process.env.NODE_ENV === "development",
      enabled: !!SENTRY_DSN,
      beforeSend(event: { exception?: { values?: Array<{ type?: string }> } }) {
        if (event.exception?.values) {
          for (const ex of event.exception.values) {
            if (ex.type === "CircuitBreakerError") return null;
          }
        }
        return event;
      },
    });
    sentryInitialized = true;
    logger.info("Sentry initialized", { action: "sentry_init" });
  } catch (err) {
    logger.warn("Failed to initialize Sentry", {
      action: "sentry_init_failed",
      error: err instanceof Error ? err.message : "unknown",
    });
  }
}

export function captureError(error: Error, context?: Record<string, unknown>) {
  logger.error(error.message, {
    action: "captured_error",
    error: error.message,
    metadata: context,
  });

  if (SENTRY_DSN) {
    try {
      Function('return import("@sentry/nextjs")')().then(
        (Sentry: { captureException: (err: Error, opts?: { extra?: Record<string, unknown> }) => void }) => {
          Sentry.captureException(error, { extra: context });
        }
      );
    } catch {}
  }
}

export function captureMessage(
  message: string,
  level: "info" | "warning" | "error" = "info"
) {
  logger.info(message, { action: "captured_message", metadata: { level } });

  if (SENTRY_DSN) {
    try {
      Function('return import("@sentry/nextjs")')().then(
        (Sentry: { captureMessage: (msg: string, lvl: string) => void }) => {
          Sentry.captureMessage(message, level);
        }
      );
    } catch {}
  }
}

export function setUserContext(userId: string, email?: string) {
  if (SENTRY_DSN) {
    try {
      Function('return import("@sentry/nextjs")')().then(
        (Sentry: { setUser: (user: { id: string; email?: string } | null) => void }) => {
          Sentry.setUser({ id: userId, email });
        }
      );
    } catch {}
  }
}

export function clearUserContext() {
  if (SENTRY_DSN) {
    try {
      Function('return import("@sentry/nextjs")')().then(
        (Sentry: { setUser: (user: null) => void }) => {
          Sentry.setUser(null);
        }
      );
    } catch {}
  }
}
