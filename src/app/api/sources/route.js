import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/require';
import { createSource, listSourcesByUserAndLicence, setSourceRawText, updateSourceStatus } from '@/lib/db/sources';
import { extractTextFromPdf, PdfExtractError } from '@/lib/pdf-extract';

const ALLOWED_LICENCES = ['korean-food', 'beauty-general', 'pastry'];
const MAX_TEXT_CHARS = 500_000;

export async function POST(req) {
    const { userId, response } = await requireUser();
    if (response) return response;

    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
        // PDF 업로드
        const form = await req.formData();
        const file = form.get('file');
        const licenceId = form.get('licenceId');
        const title = form.get('title') || (file?.name ?? '제목 없음');
        if (!file || !ALLOWED_LICENCES.includes(licenceId)) {
            return NextResponse.json({ error: 'invalid file or licenceId' }, { status: 400 });
        }
        const buf = Buffer.from(await file.arrayBuffer());
        const source = await createSource({
            userId,
            licenceId,
            type: 'pdf',
            title: String(title),
            originalFilename: file.name,
        });
        try {
            const text = await extractTextFromPdf(buf);
            await setSourceRawText(source.id, text);
            return NextResponse.json({ source: { ...source, raw_text: text } });
        } catch (e) {
            const msg = e instanceof PdfExtractError ? e.message : 'PDF 처리 실패';
            await updateSourceStatus(source.id, 'failed', msg);
            return NextResponse.json({ error: msg, sourceId: source.id }, { status: 422 });
        }
    }

    // JSON 텍스트
    const body = await req.json().catch(() => ({}));
    const { licenceId, title, text } = body;
    if (!ALLOWED_LICENCES.includes(licenceId)) return NextResponse.json({ error: 'invalid licenceId' }, { status: 400 });
    if (!title || typeof title !== 'string') return NextResponse.json({ error: 'invalid title' }, { status: 400 });
    if (!text || typeof text !== 'string' || text.length > MAX_TEXT_CHARS) {
        return NextResponse.json({ error: 'invalid text' }, { status: 400 });
    }
    const source = await createSource({ userId, licenceId, type: 'text', title, rawText: text });
    return NextResponse.json({ source });
}

export async function GET(req) {
    const { userId, response } = await requireUser();
    if (response) return response;
    const url = new URL(req.url);
    const licenceId = url.searchParams.get('licence_id');
    if (!licenceId || !ALLOWED_LICENCES.includes(licenceId)) {
        return NextResponse.json({ error: 'invalid licence_id' }, { status: 400 });
    }
    const rows = await listSourcesByUserAndLicence(userId, licenceId);
    return NextResponse.json({ sources: rows });
}
