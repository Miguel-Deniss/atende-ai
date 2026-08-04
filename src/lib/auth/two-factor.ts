import speakeasy from "speakeasy";
import QRCode from "qrcode";
import crypto from "crypto";

export function generateSecret(email: string) {
  return speakeasy.generateSecret({ name: `AtendeAI:${email}` });
}

export function verifyTotp(secret: string, token: string): boolean {
  return speakeasy.totp.verify({
    secret,
    encoding: "base32",
    token,
    window: 1,
  });
}

export async function generateQrDataUrl(otpauthUrl: string): Promise<string> {
  return QRCode.toDataURL(otpauthUrl);
}

export function generateRecoveryCodes(count = 10): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const parts: string[] = [];
    for (let j = 0; j < 3; j++) {
      parts.push(crypto.randomBytes(2).toString("hex").toUpperCase());
    }
    codes.push(parts.join("-"));
  }
  return codes;
}

export function hashRecoveryCode(code: string): string {
  return crypto.createHash("sha256").update(code).digest("hex");
}

export function hashRecoveryCodes(codes: string[]): string[] {
  return codes.map(hashRecoveryCode);
}

export function verifyRecoveryCode(
  code: string,
  storedHashes: unknown
): { valid: boolean; remaining: string[] } {
  const hashes = Array.isArray(storedHashes)
    ? storedHashes.filter((h): h is string => typeof h === "string")
    : [];

  const normalized = code.trim().toUpperCase();
  const target = hashRecoveryCode(normalized);
  const index = hashes.findIndex((h) => h === target);

  if (index === -1) {
    return { valid: false, remaining: hashes };
  }

  const remaining = hashes.slice();
  remaining.splice(index, 1);

  return { valid: true, remaining };
}
