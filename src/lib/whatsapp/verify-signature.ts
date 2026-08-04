import crypto from "crypto";

export function verifyMetaSignature(
  body: string,
  signature: string | null
): boolean {
  const appSecret = process.env.META_APP_SECRET;
  if (!appSecret) return true;

  if (!signature || !signature.startsWith("sha256=")) return false;

  const expectedSig = crypto
    .createHmac("sha256", appSecret)
    .update(body)
    .digest("hex");

  const actualSig = signature.replace("sha256=", "");

  if (actualSig.length !== expectedSig.length) return false;

  return crypto.timingSafeEqual(Buffer.from(expectedSig), Buffer.from(actualSig));
}

export function verifyWebhookToken(token: string | null): boolean {
  const expected = process.env.META_WEBHOOK_VERIFY_TOKEN;
  if (!expected) return false;
  return token === expected;
}
