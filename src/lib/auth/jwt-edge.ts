import { jwtVerify } from "jose";

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET não configurado no ambiente");
  }
  return secret;
}

const secret = new TextEncoder().encode(getJwtSecret());

export async function verifyEdgeToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch {
    return null;
  }
}