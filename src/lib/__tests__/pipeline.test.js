// @vitest-environment node
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { _resetDb } from '../db';
import { runMigrations } from '../db/migrate';
import { createDeviceUser } from '../db/users';
import { createSource, getSourceById, getSummary, listConceptsBySource, listProblemsBySource } from '../db/sources';
import { runPipeline } from '../ai/pipeline';

const mockCreate = vi.fn();
vi.mock('@anthropic-ai/sdk', () => ({
    default: class { constructor() { this.messages = { create: mockCreate }; } },
}));

beforeAll(async () => {
    process.env.TURSO_DATABASE_URL = 'file::memory:';
    process.env.ANTHROPIC_API_KEY = 'test-key';
    _resetDb();
    await runMigrations();
});

beforeEach(() => {
    mockCreate.mockReset();
});

describe('runPipeline (전 단계 mock)', () => {
    it('성공 경로: status=done + 모든 생성물 저장', async () => {
        const u = await createDeviceUser({ deviceId: `dev-pipeline-${Math.random()}`, language: 'vi' });
        const s = await createSource({ userId: u.id, licenceId: 'korean-food', type: 'text', title: 'T', rawText: '식품위생 HACCP 관리 본문' });

        // 응답 순서: classify, summarize, concepts, problems, translateSummary, translateConcepts, translateProblem(s)
        const responses = [
            { score: 0.9, reason: '관련 자료' },                                              // classify
            { summary: '한국어 요약 내용' },                                                   // summarize
            { concepts: [{ korean: 'HACCP', korean_definition: '위해요소중점관리기준' }] },     // concepts
            { problems: [{ ko_question: 'HACCP 무엇?', ko_options: ['a','b','c','d'], correct_answer: 0, ko_explanation: 'e' }] }, // problems
            { vi: 'Vi 요약', zh: 'Zh', th: 'Th', tl: 'Tl', my: 'My' },                          // translateSummary
            { items: [{ vi: 'Vi-HACCP', vi_def: 'def', zh: 'Zh', th: 'Th', tl: 'Tl', my: 'My', zh_def: '', th_def: '', tl_def: '', my_def: '' }] }, // translateConcepts
            { translations: { vi: { question: 'Vi-Q', options: ['a','b','c','d'], explanation: 'e' } },                                              // translateProblem
              keyword_hints: { vi: [{ korean: 'HACCP', native: 'HACCP-vi' }], zh: [], th: [], tl: [], my: [] } },
        ];
        for (const r of responses) {
            mockCreate.mockResolvedValueOnce({ content: [{ type: 'text', text: JSON.stringify(r) }] });
        }

        const result = await runPipeline(s.id);
        expect(result.ok).toBe(true);
        const reloaded = await getSourceById(s.id);
        expect(reloaded.status).toBe('done');
        expect(reloaded.domain_score).toBe(0.9);
        const sm = await getSummary(s.id);
        expect(sm.ko_text).toBe('한국어 요약 내용');
        expect(sm.vi_text).toBe('Vi 요약');
        const cs = await listConceptsBySource(s.id);
        expect(cs[0].korean).toBe('HACCP');
        expect(cs[0].vi).toBe('Vi-HACCP');
        const ps = await listProblemsBySource(s.id);
        expect(ps[0].keyword_hints.vi[0].korean).toBe('HACCP');
    });

    it('단계 실패 시 status=failed + 메시지', async () => {
        const u = await createDeviceUser({ deviceId: `dev-fail-${Math.random()}`, language: 'vi' });
        const s = await createSource({ userId: u.id, licenceId: 'korean-food', type: 'text', title: 'T', rawText: 'sample' });
        // classify까지는 통과
        mockCreate.mockResolvedValueOnce({ content: [{ type: 'text', text: JSON.stringify({ score: 0.8, reason: 'r' }) }] });
        // summarize에서 모두 invalid (재시도 1회까지 다)
        mockCreate.mockResolvedValueOnce({ content: [{ type: 'text', text: 'not json' }] });
        mockCreate.mockResolvedValueOnce({ content: [{ type: 'text', text: 'still not json' }] });

        const result = await runPipeline(s.id);
        expect(result.ok).toBe(false);
        const reloaded = await getSourceById(s.id);
        expect(reloaded.status).toBe('failed');
        expect(reloaded.status_message).toContain('JSON parse failed');
    });
});
