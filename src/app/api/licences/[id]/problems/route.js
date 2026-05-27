import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/require';
import { listProblemsForUserLicence } from '@/lib/db/sources';

const ALLOWED = new Set(['korean-food', 'beauty-general', 'pastry']);

export async function GET(_req, { params }) {
    const { userId, response } = await requireUser();
    if (response) return response;
    const { id } = await params;
    if (!ALLOWED.has(id)) return NextResponse.json({ error: 'invalid' }, { status: 400 });
    const rows = await listProblemsForUserLicence(userId, id);
    return NextResponse.json({ problems: rows });
}
