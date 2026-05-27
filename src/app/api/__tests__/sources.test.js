// @vitest-environment node
import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';
import { _resetDb } from '@/lib/db';
import { runMigrations } from '@/lib/db/migrate';
import { createDeviceUser } from '@/lib/db/users';
import { setSessionCookie } from '@/lib/auth/session';
import { POST as sourcesPOST, GET as sourcesGET } from '@/app/api/sources/route';
import { GET as singleGET, DELETE as singleDELETE } from '@/app/api/sources/[id]/route';

let cookieStore = new Map();
vi.mock('next/headers', () => ({
    cookies: () => ({
        get: (n) => cookieStore.has(n) ? { value: cookieStore.get(n) } : undefined,
        set: (n, v) => { cookieStore.set(n, v); },
        delete: (n) => { cookieStore.delete(n); },
    }),
}));

let userId;
beforeAll(async () => {
    process.env.TURSO_DATABASE_URL = 'file::memory:';
    process.env.JWT_SECRET = 'test-secret-32-bytes-long-padding-padding';
    _resetDb();
    await runMigrations();
});

beforeEach(async () => {
    cookieStore = new Map();
    const u = await createDeviceUser({ deviceId: `dev-${Math.random()}`, language: 'vi' });
    userId = u.id;
    await setSessionCookie(userId);
});

describe('POST /api/sources (text)', () => {
    it('인증 없으면 401', async () => {
        cookieStore = new Map();
        const res = await sourcesPOST(new Request('http://x/api/sources', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ licenceId: 'korean-food', title: 't', text: 'x' }),
        }));
        expect(res.status).toBe(401);
    });

    it('유효 입력이면 source 생성', async () => {
        const res = await sourcesPOST(new Request('http://x/api/sources', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ licenceId: 'korean-food', title: '내 노트', text: '내용' }),
        }));
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.source.title).toBe('내 노트');
        expect(json.source.status).toBe('pending');
    });

    it('잘못된 licenceId는 400', async () => {
        const res = await sourcesPOST(new Request('http://x/api/sources', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ licenceId: 'bogus', title: 't', text: 'x' }),
        }));
        expect(res.status).toBe(400);
    });
});

describe('GET /api/sources?licence_id', () => {
    it('내 자료만 반환', async () => {
        await sourcesPOST(new Request('http://x/api/sources', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ licenceId: 'pastry', title: 'a', text: 'x' }),
        }));
        const res = await sourcesGET(new Request('http://x/api/sources?licence_id=pastry'));
        const json = await res.json();
        expect(json.sources.length).toBeGreaterThanOrEqual(1);
    });
});

describe('GET/DELETE /api/sources/[id]', () => {
    it('다른 사용자 자료에 접근 시 404', async () => {
        const created = await (await sourcesPOST(new Request('http://x/api/sources', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ licenceId: 'korean-food', title: 'a', text: 'x' }),
        }))).json();
        // 다른 사용자로 전환
        const other = await createDeviceUser({ deviceId: 'dev-other', language: 'vi' });
        await setSessionCookie(other.id);
        const res = await singleGET(new Request(`http://x/api/sources/${created.source.id}`), { params: Promise.resolve({ id: created.source.id }) });
        expect(res.status).toBe(404);
    });

    it('DELETE는 자료 제거', async () => {
        const created = await (await sourcesPOST(new Request('http://x/api/sources', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ licenceId: 'korean-food', title: 'a', text: 'x' }),
        }))).json();
        const res = await singleDELETE(new Request('http://x/'), { params: Promise.resolve({ id: created.source.id }) });
        expect(res.status).toBe(200);
        const after = await singleGET(new Request('http://x/'), { params: Promise.resolve({ id: created.source.id }) });
        expect(after.status).toBe(404);
    });
});
