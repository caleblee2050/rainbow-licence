import { cookies } from 'next/headers';
import { signSession, verifySession } from './jwt';

const COOKIE = 'rl_session';

export async function setSessionCookie(userId) {
  const token = await signSession({ sub: userId });
  const c = await cookies();
  c.set(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSessionCookie() {
  const c = await cookies();
  c.delete(COOKIE);
}

export async function getCurrentUserId() {
  const c = await cookies();
  const token = c.get(COOKIE)?.value;
  if (!token) return null;
  const payload = await verifySession(token);
  return payload?.sub ?? null;
}
