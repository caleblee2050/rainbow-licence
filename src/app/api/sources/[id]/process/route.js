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
    if (source.status !== 'pending' && source.status !== 'failed') {
        return NextResponse.json({ error: 'already processing or done' }, { status: 409 });
    }
    await updateSourceStatus(id, 'extracting');
    // 비동기 실행 (Vercel Functions에서는 응답 후 종료될 수 있으나 짧은 자료에 한정)
    runPipeline(id).catch(e => console.error('pipeline error', e));
    return NextResponse.json({ ok: true, sourceId: id });
}
