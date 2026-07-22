const SENSITIVE_FIELDS = [
  "password",
  "passwordHash",
  "password_hash",
  "token",
  "secret",
  "cardNumber",
  "card_number",
  "cvc",
  "cvv",
  "creditCard",
  "credit_card",
  "apiKey",
  "api_key",
  "privateKey",
  "private_key",
  "twoFactorSecret",
  "two_factor_secret",
  "resetPasswordToken",
  "reset_password_token",
  "emailVerificationToken",
  "email_verification_token",
];

export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const sanitized = { ...obj };

  for (const key of Object.keys(sanitized)) {
    if (SENSITIVE_FIELDS.includes(key)) {
      (sanitized as Record<string, unknown>)[key] = "[REDACTED]";
    }
  }

  return sanitized;
}

export function sanitizeForAI(text: string): string {
  const patterns = [
    /\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/g,
    /\b\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}\b/g,
    /\b\d{11}\b/g,
    /\b\d{14}\b/g,
    /\b(?:\d{4}[-\s]?){3}\d{4}\b/g,
    /\b\d{3}\s?\d{3}\s?\d{3}\s?\d{2}\b/g,
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,
    /sk-[A-Za-z0-9]{20,}/g,
    /Bearer\s+[A-Za-z0-9\-._~+/]+=*/gi,
  ];

  let sanitized = text;
  for (const pattern of patterns) {
    sanitized = sanitized.replace(pattern, "[REDACTED]");
  }

  return sanitized;
}

export function sanitizeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/\.\./g, "")
    .replace(/[/\\]/g, "");
}
