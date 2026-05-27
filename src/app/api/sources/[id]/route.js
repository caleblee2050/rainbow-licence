import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/require';
import { getSourceById, deleteSource } from '@/lib/db/sources';

export async function GET(_req, { params }) {
    const { userId, response } = await requireUser();
    if (response) return response;
    const { id } = await params;
    const source = await getSourceById(id);
    if (!source || source.user_id !== userId) return NextResponse.json({ error: 'not found' }, { status: 404 });
    return NextResponse.json({ source });
}

export async function DELETE(_req, { params }) {
    const { userId, response } = await requireUser();
    if (response) return response;
    const { id } = await params;
    const source = await getSourceById(id);
    if (!source || source.user_id !== userId) return NextResponse.json({ error: 'not found' }, { status: 404 });
    await deleteSource(id);
    return NextResponse.json({ ok: true });
}
