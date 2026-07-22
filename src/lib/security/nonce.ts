import crypto from "crypto";

const NONCE_EXPIRY_MS = 300000;
const NONCE_MAX_AGE_MS = 60000;
const recentNonces = new Set<string>();

setInterval(() => {
  recentNonces.clear();
}, NONCE_EXPIRY_MS);

export function generateNonce(): string {
  return crypto.randomBytes(16).toString("hex");
}

export function validateNonce(nonce: string, timestamp: string): boolean {
  if (!nonce || !timestamp) return false;

  const now = Date.now();
  const ts = parseInt(timestamp, 10);

  if (isNaN(ts)) return false;
  if (Math.abs(now - ts) > NONCE_MAX_AGE_MS) return false;
  if (recentNonces.has(nonce)) return false;

  recentNonces.add(nonce);
  return true;
}

export function createReplaySafePayload(payload: unknown, nonce: string, timestamp: string): string {
  return JSON.stringify({
    ...(typeof payload === "object" ? payload : { value: payload }),
    _nonce: nonce,
    _timestamp: timestamp,
  });
}
