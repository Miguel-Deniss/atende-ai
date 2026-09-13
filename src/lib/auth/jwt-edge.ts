import { jwtVerify } from "jose/jwt/verify";

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET não configurado no ambiente");
  }
  return secret;
}

const secret = new TextEncoder().encode(getJwtSecret());
const JWT_ISSUER = "atendeai";
const JWT_AUDIENCE = "atendeai-web";

export async function verifyEdgeToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ["HS256"],
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });
    return payload.type === "access" && payload.sessionToken ? payload : null;
  } catch {
    return null;
  }
}
