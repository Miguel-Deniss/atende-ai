import { cookies } from "next/headers";
import crypto from "crypto";

const CSRF_COOKIE_NAME = "csrf_token";

export async function generateCsrfToken(): Promise<string> {
  const token = crypto.randomBytes(32).toString("hex");
  const cookieStore = await cookies();

  cookieStore.set(CSRF_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 3600,
  });

  return token;
}

export async function validateCsrfToken(token: string): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const cookieToken = cookieStore.get(CSRF_COOKIE_NAME)?.value;
    return !!cookieToken && crypto.timingSafeEqual(
      Buffer.from(token),
      Buffer.from(cookieToken)
    );
  } catch {
    return false;
  }
}
