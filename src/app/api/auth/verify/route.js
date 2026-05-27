import { NextResponse } from 'next/server';
import { consumeToken } from '@/lib/db/magic-link';
import { getUserByEmail, createDeviceUser, updateUser } from '@/lib/db/users';
import { setSessionCookie, getCurrentUserId } from '@/lib/auth/session';

export async function GET(req) {
    const url = new URL(req.url);
    const token = url.searchParams.get('token');
    if (!token) {
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/?auth_error=missing_token`);
    }
    const consumed = await consumeToken(token);
    if (!consumed) {
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/?auth_error=invalid_or_expired`);
    }
    // 기존 사용자가 있으면 그걸 사용, 없으면 현재 익명 device 사용자를 승격 또는 새 사용자 생성
    let user = await getUserByEmail(consumed.email);
    if (!user) {
        const currentId = await getCurrentUserId();
        if (currentId) {
            user = await updateUser(currentId, { email: consumed.email });
        } else {
            // 이메일만으로 신규 사용자 — 임시 device_id로 채움
            user = await createDeviceUser({ deviceId: `email:${consumed.email}`, language: 'vi' });
            user = await updateUser(user.id, { email: consumed.email });
        }
    }
    await setSessionCookie(user.id);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/?auth_ok=1`);
}
