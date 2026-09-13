import jwt, { type SignOptions } from "jsonwebtoken";

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "15m";
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || "7d";
const JWT_ISSUER = "atendeai";
const JWT_AUDIENCE = "atendeai-web";

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET não configurado no ambiente");
  }
  return secret;
}

export interface JwtPayload {
  userId: string;
  companyId: string;
  role: string;
  sessionToken: string;
  type: "access";
}

export interface RefreshJwtPayload {
  userId: string;
  companyId: string;
  sessionToken: string;
  type: "refresh";
}

const verifyOptions: jwt.VerifyOptions = {
  algorithms: ["HS256"],
  issuer: JWT_ISSUER,
  audience: JWT_AUDIENCE,
};

export function signAccessToken(payload: Omit<JwtPayload, "type">): string {
  return jwt.sign({ ...payload, type: "access" }, getJwtSecret(), {
    algorithm: "HS256",
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
    expiresIn: JWT_EXPIRES_IN as SignOptions["expiresIn"],
  });
}

export function signRefreshToken(
  userId: string,
  companyId: string,
  sessionToken: string,
  expiresIn: SignOptions["expiresIn"] = JWT_REFRESH_EXPIRES_IN as SignOptions["expiresIn"]
): string {
  return jwt.sign({ userId, companyId, sessionToken, type: "refresh" }, getJwtSecret(), {
    algorithm: "HS256",
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
    expiresIn,
  });
}

export function verifyToken(token: string): JwtPayload {
  const payload = jwt.verify(token, getJwtSecret(), verifyOptions) as JwtPayload;
  if (payload.type !== "access" || !payload.sessionToken) {
    throw new Error("Token de acesso inválido");
  }
  return payload;
}

export function verifyRefreshToken(token: string): RefreshJwtPayload {
  const payload = jwt.verify(token, getJwtSecret(), verifyOptions) as RefreshJwtPayload;
  if (payload.type !== "refresh" || !payload.sessionToken) {
    throw new Error("Refresh token inválido");
  }
  return payload;
}

export function safeVerifyToken(token: string): JwtPayload | null {
  try {
    return verifyToken(token);
  } catch {
    return null;
  }
}
