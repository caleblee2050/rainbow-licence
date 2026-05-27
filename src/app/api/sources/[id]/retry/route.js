import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/require';
import { getSourceById, updateSourceStatus } from '@/lib/db/sources';
import { runPipeline } from '@/lib/ai/pipeline';

export async function POST(_req, { params }) {
    const { userId, response } = await requireUser();
    if (response) return response;
    const { id } = await params;
    const source = await getSourceById(id);
    if (!source || source.user_id !== userId) return NextResponse.json({ error: 'not found' }, { status: 404 });
    if (source.status !== 'failed') return NextResponse.json({ error: 'not in failed state' }, { status: 409 });
    await updateSourceStatus(id, 'extracting');
    runPipeline(id).catch(e => console.error('retry error', e));
    return NextResponse.json({ ok: true });
}
