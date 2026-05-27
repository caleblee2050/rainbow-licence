// @vitest-environment node
import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { _resetDb } from '../db';
import { runMigrations } from '../db/migrate';
import { createDeviceUser } from '../db/users';
import {
    createSource, getSourceById, listSourcesByUserAndLicence, updateSourceStatus,
    upsertSummary, getSummary, insertConcepts, listConceptsBySource,
    insertProblems, listProblemsBySource, listProblemsForUserLicence,
} from '../db/sources';

beforeAll(async () => {
    process.env.TURSO_DATABASE_URL = 'file::memory:';
    _resetDb();
    await runMigrations();
});

describe('sources CRUD', () => {
    let userId;
    beforeEach(async () => {
        const u = await createDeviceUser({ deviceId: `dev-${Math.random()}`, language: 'vi' });
        userId = u.id;
    });

    it('source 생성/조회/목록', async () => {
        const s = await createSource({ userId, licenceId: 'korean-food', type: 'text', title: '내 노트', rawText: 'sample text' });
        expect(s.status).toBe('pending');
        const list = await listSourcesByUserAndLicence(userId, 'korean-food');
        expect(list.length).toBeGreaterThanOrEqual(1);
    });

    it('source status 업데이트', async () => {
        const s = await createSource({ userId, licenceId: 'pastry', type: 'text', title: 'P', rawText: 'x' });
        await updateSourceStatus(s.id, 'summarizing');
        const reloaded = await getSourceById(s.id);
        expect(reloaded.status).toBe('summarizing');
    });

    it('summary upsert', async () => {
        const s = await createSource({ userId, licenceId: 'korean-food', type: 'text', title: 'S', rawText: 'x' });
        await upsertSummary(s.id, { ko: 'ko summary', vi: 'vi summary' });
        const sm = await getSummary(s.id);
        expect(sm.ko_text).toBe('ko summary');
        expect(sm.vi_text).toBe('vi summary');
        // 재upsert overwrites
        await upsertSummary(s.id, { ko: 'updated', vi: null });
        const sm2 = await getSummary(s.id);
        expect(sm2.ko_text).toBe('updated');
    });

    it('concepts/problems 삽입 + 조회 + JSON 라운드트립', async () => {
        const s = await createSource({ userId, licenceId: 'beauty-general', type: 'text', title: 'B', rawText: 'x' });
        await insertConcepts(s.id, [{ korean: '두피', korean_definition: '머리 피부', vi: 'da đầu' }]);
        const cs = await listConceptsBySource(s.id);
        expect(cs).toHaveLength(1);
        expect(cs[0].korean).toBe('두피');

        await insertProblems(s.id, [{
            ko_question: 'Q?', ko_options: ['a','b','c','d'], correct_answer: 1,
            ko_explanation: 'E',
            translations: { vi: { question: 'Qv', options: ['a','b','c','d'], explanation: 'Ev' } },
            keyword_hints: { vi: [{ korean: '두피', native: 'da đầu' }] },
        }]);
        const ps = await listProblemsBySource(s.id);
        expect(ps[0].ko_options).toEqual(['a','b','c','d']);
        expect(ps[0].translations.vi.question).toBe('Qv');
        expect(ps[0].keyword_hints.vi[0].korean).toBe('두피');
    });

    it('listProblemsForUserLicence: status done만 포함', async () => {
        const s1 = await createSource({ userId, licenceId: 'korean-food', type: 'text', title: 'A', rawText: 'x' });
        await insertProblems(s1.id, [{
            ko_question: 'Q1', ko_options: ['a','b','c','d'], correct_answer: 0,
            ko_explanation: 'E', translations: {}, keyword_hints: {},
        }]);
        // s1은 아직 pending
        let res = await listProblemsForUserLicence(userId, 'korean-food');
        const beforeDone = res.length;
        await updateSourceStatus(s1.id, 'done');
        res = await listProblemsForUserLicence(userId, 'korean-food');
        expect(res.length).toBe(beforeDone + 1);
    });
});
