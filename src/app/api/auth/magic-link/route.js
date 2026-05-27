import { NextResponse } from 'next/server';
import { createToken } from '@/lib/db/magic-link';
import { getUserByEmail } from '@/lib/db/users';
import { sendMagicLinkEmail } from '@/lib/resend';

export async function POST(req) {
    const { email } = await req.json().catch(() => ({}));
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return NextResponse.json({ error: 'invalid email' }, { status: 400 });
    }
    const existing = await getUserByEmail(email);
    const token = await createToken(email, existing?.id ?? null);
    const link = `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/verify?token=${token}`;
    await sendMagicLinkEmail({ to: email, link });
    return NextResponse.json({ ok: true });
}
