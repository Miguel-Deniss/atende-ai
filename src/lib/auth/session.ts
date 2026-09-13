import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/logger/structured";
import { cookies } from "next/headers";
import { signAccessToken, signRefreshToken, verifyRefreshToken, verifyToken } from "./jwt";

const SESSION_COOKIE_NAME = "session_token";
const ACCESS_COOKIE_NAME = "access_token";
const REFRESH_COOKIE_NAME = "refresh_token";
const ACCESS_MAX_AGE_SECONDS = 15 * 60;
const DEFAULT_SESSION_DAYS = 7;
const REMEMBERED_SESSION_DAYS = 30;

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

export async function createSession(
  userId: string,
  ipAddress?: string,
  userAgent?: string,
  rememberMe = false
) {
  const maxAge = (rememberMe ? REMEMBERED_SESSION_DAYS : DEFAULT_SESSION_DAYS) * 24 * 60 * 60;
  const session = await prisma.session.create({
    data: {
      userId,
      sessionToken: crypto.randomUUID(),
      expiresAt: new Date(Date.now() + maxAge * 1000),
      ipAddress,
      userAgent,
    },
  });

  return { sessionToken: session.sessionToken, expiresAt: session.expiresAt };
}

export async function validateSession(sessionToken: string) {
  const session = await prisma.session.findUnique({
    where: { sessionToken },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          companyId: true,
          isActive: true,
          deletedAt: true,
          twoFactorEnabled: true,
          emailVerified: true,
          company: {
            select: {
              name: true,
              status: true,
              planType: true,
              subscriptionStatus: true,
              deletedAt: true,
            },
          },
        },
      },
    },
  });

  const invalid =
    !session ||
    session.isRevoked ||
    session.expiresAt <= new Date() ||
    !session.user.isActive ||
    session.user.deletedAt !== null ||
    session.user.company.deletedAt !== null ||
    session.user.company.status !== "ACTIVE";

  if (invalid || !session) {
    return { valid: false as const };
  }

  return {
    valid: true as const,
    session: {
      id: session.id,
      sessionToken: session.sessionToken,
      expiresAt: session.expiresAt,
    },
    user: session.user,
  };
}

export async function revokeSession(sessionToken: string) {
  await prisma.session.updateMany({
    where: { sessionToken, isRevoked: false },
    data: { isRevoked: true },
  });
}

export async function revokeAllUserSessions(userId: string) {
  await prisma.session.updateMany({
    where: { userId, isRevoked: false },
    data: { isRevoked: true },
  });
}

export async function setAuthCookies(
  userId: string,
  companyId: string,
  role: string,
  ipAddress?: string,
  userAgent?: string,
  rememberMe = false
) {
  const session = await createSession(userId, ipAddress, userAgent, rememberMe);
  const maxAge = Math.max(1, Math.floor((session.expiresAt.getTime() - Date.now()) / 1000));
  const tokenPayload = {
    userId,
    companyId,
    role,
    sessionToken: session.sessionToken,
  };
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE_NAME, session.sessionToken, cookieOptions(maxAge));
  cookieStore.set(
    ACCESS_COOKIE_NAME,
    signAccessToken(tokenPayload),
    cookieOptions(ACCESS_MAX_AGE_SECONDS)
  );
  cookieStore.set(
    REFRESH_COOKIE_NAME,
    signRefreshToken(userId, companyId, session.sessionToken, maxAge),
    cookieOptions(maxAge)
  );
}

export async function clearAuthCookies() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  cookieStore.delete(ACCESS_COOKIE_NAME);
  cookieStore.delete(REFRESH_COOKIE_NAME);
}

export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    let accessToken: string | undefined = cookieStore.get(ACCESS_COOKIE_NAME)?.value;

    if (!sessionCookie) return null;
    if (!accessToken) {
      const refreshed = await refreshAccessToken();
      accessToken = refreshed ?? undefined;
    }
    if (!accessToken) return null;

    const payload = verifyToken(accessToken);
    if (payload.sessionToken !== sessionCookie) return null;

    const validation = await validateSession(payload.sessionToken);
    if (!validation.valid) return null;

    const user = validation.user;
    if (
      user.id !== payload.userId ||
      user.companyId !== payload.companyId ||
      user.role !== payload.role
    ) {
      return null;
    }

    return user;
  } catch {
    return null;
  }
}

export async function refreshAccessToken(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get(REFRESH_COOKIE_NAME)?.value;
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!refreshToken || !sessionCookie) return null;

    const payload = verifyRefreshToken(refreshToken);
    if (payload.sessionToken !== sessionCookie) return null;

    const validation = await validateSession(payload.sessionToken);
    if (!validation.valid) return null;

    const remainingSeconds = Math.floor(
      (validation.session.expiresAt.getTime() - Date.now()) / 1000
    );
    if (remainingSeconds <= 0) return null;

    const newSessionToken = crypto.randomUUID();
    const rotated = await prisma.session.updateMany({
      where: {
        id: validation.session.id,
        sessionToken: payload.sessionToken,
        isRevoked: false,
        expiresAt: { gt: new Date() },
      },
      data: { sessionToken: newSessionToken },
    });
    if (rotated.count !== 1) return null;

    const user = validation.user;
    const accessToken = signAccessToken({
      userId: user.id,
      companyId: user.companyId,
      role: user.role,
      sessionToken: newSessionToken,
    });
    const nextRefreshToken = signRefreshToken(
      user.id,
      user.companyId,
      newSessionToken,
      remainingSeconds
    );

    cookieStore.set(SESSION_COOKIE_NAME, newSessionToken, cookieOptions(remainingSeconds));
    cookieStore.set(ACCESS_COOKIE_NAME, accessToken, cookieOptions(ACCESS_MAX_AGE_SECONDS));
    cookieStore.set(REFRESH_COOKIE_NAME, nextRefreshToken, cookieOptions(remainingSeconds));

    return accessToken;
  } catch (error) {
    logger.warn("Falha ao renovar sessão", {
      action: "session_refresh_failed",
      error: error instanceof Error ? error.message : "unknown",
    });
    return null;
  }
}
