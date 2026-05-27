// @vitest-environment node
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { _resetDb } from '@/lib/db';
import { runMigrations } from '@/lib/db/migrate';
import { createDeviceUser } from '@/lib/db/users';
import { createSource, updateSourceStatus, insertConcepts, insertProblems } from '@/lib/db/sources';
import { setSessionCookie } from '@/lib/auth/session';
import { GET as conceptsGET } from '@/app/api/licences/[id]/concepts/route';
import { GET as problemsGET } from '@/app/api/licences/[id]/problems/route';

let cookieStore = new Map();
vi.mock('next/headers', () => ({
    cookies: () => ({
        get: (n) => cookieStore.has(n) ? { value: cookieStore.get(n) } : undefined,
        set: (n, v) => { cookieStore.set(n, v); },
        delete: (n) => { cookieStore.delete(n); },
    }),
}));

beforeAll(async () => {
    process.env.TURSO_DATABASE_URL = 'file::memory:';
    process.env.JWT_SECRET = 'test-secret-32-bytes-long-padding-padding';
    _resetDb();
    await runMigrations();
});

beforeEach(() => { cookieStore = new Map(); });

describe('licence concepts/problems user pool', () => {
    it('status=done 자료의 생성물만 노출', async () => {
        const u = await createDeviceUser({ deviceId: `d-${Math.random()}`, language: 'vi' });
        await setSessionCookie(u.id);
        const s1 = await createSource({ userId: u.id, licenceId: 'korean-food', type: 'text', title: 'A', rawText: 'x' });
        await insertConcepts(s1.id, [{ korean: 'C1', korean_definition: 'd' }]);
        await insertProblems(s1.id, [{ ko_question: 'Q', ko_options: ['a','b','c','d'], correct_answer: 0, ko_explanation: 'e', translations: {}, keyword_hints: {} }]);
        // s1 pending → 노출 X
        let csRes = await conceptsGET(new Request('http://x/'), { params: Promise.resolve({ id: 'korean-food' }) });
        let cs = await csRes.json();
        expect(cs.concepts).toHaveLength(0);
        await updateSourceStatus(s1.id, 'done');
        csRes = await conceptsGET(new Request('http://x/'), { params: Promise.resolve({ id: 'korean-food' }) });
        cs = await csRes.json();
        expect(cs.concepts).toHaveLength(1);
        const psRes = await problemsGET(new Request('http://x/'), { params: Promise.resolve({ id: 'korean-food' }) });
        const ps = await psRes.json();
        expect(ps.problems).toHaveLength(1);
    });

    it('다른 사용자 자료는 노출 X', async () => {
        const u1 = await createDeviceUser({ deviceId: `o1-${Math.random()}`, language: 'vi' });
        const u2 = await createDeviceUser({ deviceId: `o2-${Math.random()}`, language: 'vi' });
        const s = await createSource({ userId: u1.id, licenceId: 'pastry', type: 'text', title: 'A', rawText: 'x' });
        await insertConcepts(s.id, [{ korean: 'X', korean_definition: 'd' }]);
        await updateSourceStatus(s.id, 'done');
        await setSessionCookie(u2.id);
        const csRes = await conceptsGET(new Request('http://x/'), { params: Promise.resolve({ id: 'pastry' }) });
        const cs = await csRes.json();
        expect(cs.concepts).toHaveLength(0);
    });
});
