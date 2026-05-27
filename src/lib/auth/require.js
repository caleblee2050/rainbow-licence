import { NextResponse } from 'next/server';
import { getCurrentUserId } from './session';

export async function requireUser() {
  const userId = await getCurrentUserId();
  if (!userId) {
    return { userId: null, response: NextResponse.json({ error: 'unauthenticated' }, { status: 401 }) };
  }
  return { userId, response: null };
}
