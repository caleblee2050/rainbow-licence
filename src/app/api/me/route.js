import { NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth/session';
import { getUserById } from '@/lib/db/users';

export async function GET() {
    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json({ user: null });
    const user = await getUserById(userId);
    if (!user) return NextResponse.json({ user: null });
    return NextResponse.json({
        user: {
            id: user.id,
            email: user.email,
            language: user.language,
            schoolCode: user.school_code,
            koreanLevel: user.korean_level,
            displayName: user.display_name,
        },
    });
}
