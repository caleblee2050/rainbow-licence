import { SignJWT, jwtVerify } from 'jose';

const ALG = 'HS256';
const ISSUER = 'rainbow-licence';
const AUDIENCE = 'rainbow-licence-app';
const TTL = 60 * 60 * 24 * 30; // 30 days seconds

function getKey() {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error('JWT_SECRET not set');
  return new TextEncoder().encode(s);
}

export async function signSession(payload) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: ALG })
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${TTL}s`)
    .sign(getKey());
}

export async function verifySession(token) {
  try {
    const { payload } = await jwtVerify(token, getKey(), {
      issuer: ISSUER,
      audience: AUDIENCE,
    });
    return payload;
  } catch {
    return null;
  }
}
