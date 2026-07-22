import jwt from "jsonwebtoken";
import { SignOptions } from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "15m";
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || "7d";

export interface JwtPayload {
  userId: string;
  companyId: string;
  role: string;
  sessionToken: string;
}

export function signAccessToken(payload: Omit<JwtPayload, "sessionToken">): string {
  const options: SignOptions = {
    expiresIn: JWT_EXPIRES_IN as string & jwt.SignOptions["expiresIn"],
  };
  return jwt.sign(
    { ...payload, sessionToken: crypto.randomUUID() },
    JWT_SECRET,
    options
  );
}

export function signRefreshToken(userId: string, companyId: string): string {
  const options: SignOptions = {
    expiresIn: JWT_REFRESH_EXPIRES_IN as string & jwt.SignOptions["expiresIn"],
  };
  return jwt.sign(
    { userId, companyId, type: "refresh" },
    JWT_SECRET,
    options
  );
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}

export function verifyRefreshToken(token: string): { userId: string; companyId: string; type: string } {
  return jwt.verify(token, JWT_SECRET) as { userId: string; companyId: string; type: string };
}
