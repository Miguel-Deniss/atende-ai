import { prisma } from "@/lib/db/prisma";
import { cookies } from "next/headers";

import { verifyToken, signAccessToken, signRefreshToken, verifyRefreshToken } from "./jwt";

const SESSION_COOKIE_NAME = "session_token";
const REFRESH_COOKIE_NAME = "refresh_token";

// Criar sessão no banco
export async function createSession(
  userId: string,
  ipAddress?: string,
  userAgent?: string
): Promise<string> {
  const session = await prisma.session.create({
    data: {
      userId,
      sessionToken: crypto.randomUUID(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      ipAddress,
      userAgent,
    },
  });

  return session.sessionToken;
}

// Validar sessão
export async function validateSession(sessionToken: string) {
  const session = await prisma.session.findUnique({
    where: {
      sessionToken,
    },

    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          companyId: true,
          isActive: true,
        },
      },
    },
  });

  if (!session) {
    return { valid: false };
  }

  if (session.isRevoked) {
    return { valid: false };
  }

  if (session.expiresAt < new Date()) {
    return { valid: false };
  }

  if (!session.user.isActive) {
    return { valid: false };
  }

  return {
    valid: true,
    user: session.user,
  };
}

// Revogar sessão específica
export async function revokeSession(sessionToken: string) {
  await prisma.session.updateMany({
    where: {
      sessionToken,
      isRevoked: false,
    },
    data: { isRevoked: true },
  });
}

// Revogar todas as sessões de um usuário
export async function revokeAllUserSessions(userId: string) {
  await prisma.session.updateMany({
    where: {
      userId,
      isRevoked: false,
    },
    data: { isRevoked: true },
  });
}

// Criar cookies de autenticação
export async function setAuthCookies(
  userId: string,
  companyId: string,
  role: string,
  ipAddress?: string,
  userAgent?: string,
  rememberMe = false
) {
  const sessionToken = await createSession(userId, ipAddress, userAgent);

  const accessToken = signAccessToken({
    userId,
    companyId,
    role,
  });

  const refreshToken = signRefreshToken(userId, companyId);

  const cookieStore = await cookies();

  const sessionMaxAge = rememberMe ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60;

  cookieStore.set(SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: sessionMaxAge,
  });

  cookieStore.set("access_token", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 15 * 60,
  });

  cookieStore.set(REFRESH_COOKIE_NAME, refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: sessionMaxAge,
  });
}

// Limpar cookies
export async function clearAuthCookies() {
  const cookieStore = await cookies();

  cookieStore.delete(SESSION_COOKIE_NAME);
  cookieStore.delete("access_token");
  cookieStore.delete(REFRESH_COOKIE_NAME);
}

// Pegar usuário logado
export async function getCurrentUser() {
  try {
    console.log("===== GET CURRENT USER =====");

    const cookieStore = await cookies();

    console.log("COOKIES:", cookieStore.getAll());

    const accessToken = cookieStore.get("access_token")?.value;

    console.log("TEM ACCESS TOKEN:", !!accessToken);

    if (!accessToken) {
      console.log("Tentando refresh token...");

      const refreshed = await refreshAccessToken();

      if (!refreshed) {
        console.log("Refresh falhou");

        return null;
      }

      return getCurrentUser();
    }

    const payload = verifyToken(accessToken);

    console.log("JWT PAYLOAD:", payload);

    const user = await prisma.user.findUnique({
      where: {
        id: payload.userId,
      },

      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        companyId: true,
        isActive: true,
        twoFactorEnabled: true,
        emailVerified: true,

        company: {
          select: {
            name: true,
            status: true,
            planType: true,
            subscriptionStatus: true,
          },
        },
      },
    });

    console.log("USER:", user);

    if (!user) {
      return null;
    }

    if (!user.isActive) {
      return null;
    }

    if (!user.company) {
      return null;
    }

    if (user.company.status !== "ACTIVE") {
      return null;
    }

    console.log("USUARIO AUTENTICADO");

    return user;
  } catch (error) {
    console.log("GET CURRENT USER ERROR:", error);

    return null;
  }
}

// Renovar access token
export async function refreshAccessToken(): Promise<string | null> {
  try {
    const cookieStore = await cookies();

    const refreshToken = cookieStore.get(REFRESH_COOKIE_NAME)?.value;

    if (!refreshToken) {
      return null;
    }

    const payload = verifyRefreshToken(refreshToken);

    if (payload.type !== "refresh") {
      return null;
    }

    const user = await prisma.user.findUnique({
      where: {
        id: payload.userId,
      },

      select: {
        id: true,
        companyId: true,
        role: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      return null;
    }

    const newAccessToken = signAccessToken({
      userId: user.id,
      companyId: user.companyId,
      role: user.role,
    });

    cookieStore.set("access_token", newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",

      sameSite: "lax",

      path: "/",

      maxAge: 15 * 60,
    });

    return newAccessToken;
  } catch (error) {
    console.log("REFRESH TOKEN ERROR:", error);

    return null;
  }
}
