import { NextResponse } from 'next/server';
import { getUserByDeviceId, createDeviceUser } from '@/lib/db/users';
import { setSessionCookie } from '@/lib/auth/session';

export async function POST(req) {
    const body = await req.json().catch(() => ({}));
    const { deviceId, schoolCode, language = 'vi' } = body;
    if (!deviceId || typeof deviceId !== 'string' || deviceId.length < 8) {
        return NextResponse.json({ error: 'invalid deviceId' }, { status: 400 });
    }
    let user = await getUserByDeviceId(deviceId);
    if (!user) {
        user = await createDeviceUser({ deviceId, schoolCode, language });
    }
    await setSessionCookie(user.id);
    return NextResponse.json({ user: { id: user.id, language: user.language, schoolCode: user.school_code } });
}
