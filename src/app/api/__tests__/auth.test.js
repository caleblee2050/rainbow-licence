// @vitest-environment node
import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';
import { _resetDb } from '@/lib/db';
import { runMigrations } from '@/lib/db/migrate';
import { POST as deviceAnonPOST } from '@/app/api/auth/device-anon/route';
import { POST as magicLinkPOST } from '@/app/api/auth/magic-link/route';
import { GET as verifyGET } from '@/app/api/auth/verify/route';
import { createToken } from '@/lib/db/magic-link';

vi.mock('@/lib/resend', () => ({
    sendMagicLinkEmail: vi.fn(async () => {}),
}));

// Mock next/headers cookies()
let cookieStore = new Map();
vi.mock('next/headers', () => ({
    cookies: () => ({
        get: (name) => cookieStore.has(name) ? { value: cookieStore.get(name) } : undefined,
        set: (name, value) => { cookieStore.set(name, value); },
        delete: (name) => { cookieStore.delete(name); },
    }),
}));

beforeAll(async () => {
    process.env.TURSO_DATABASE_URL = 'file::memory:';
    process.env.JWT_SECRET = 'test-secret-32-bytes-long-padding-padding';
    _resetDb();
    await runMigrations();
});

beforeEach(() => {
    cookieStore = new Map();
});

function mockReq(body) {
    return new Request('http://localhost/api/auth/device-anon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
}

describe('POST /api/auth/device-anon', () => {
    it('새 deviceId면 사용자 생성', async () => {
        const res = await deviceAnonPOST(mockReq({ deviceId: 'dev-12345678', schoolCode: 'NEXT', language: 'vi' }));
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.user.id).toBeTruthy();
        expect(json.user.language).toBe('vi');
        expect(cookieStore.get('rl_session')).toBeTruthy();
    });

    it('동일 deviceId면 기존 사용자 반환', async () => {
        const r1 = await (await deviceAnonPOST(mockReq({ deviceId: 'dev-22222222' }))).json();
        const r2 = await (await deviceAnonPOST(mockReq({ deviceId: 'dev-22222222' }))).json();
        expect(r1.user.id).toBe(r2.user.id);
    });

    it('deviceId 누락이면 400', async () => {
        const res = await deviceAnonPOST(mockReq({}));
        expect(res.status).toBe(400);
    });
});

describe('매직 링크 흐름', () => {
    beforeAll(() => {
        process.env.NEXT_PUBLIC_BASE_URL = 'http://localhost:3000';
    });

    it('유효 이메일이면 토큰 생성 + 메일 발송', async () => {
        const res = await magicLinkPOST(new Request('http://x/api/auth/magic-link', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'student@example.com' }),
        }));
        expect(res.status).toBe(200);
    });

    it('잘못된 이메일은 400', async () => {
        const res = await magicLinkPOST(new Request('http://x/api/auth/magic-link', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'not-an-email' }),
        }));
        expect(res.status).toBe(400);
    });

    it('verify로 신규 사용자 생성 + 세션', async () => {
        const token = await createToken('newuser@example.com');
        const res = await verifyGET(new Request(`http://x/api/auth/verify?token=${token}`));
        expect(res.status).toBe(307); // redirect
        expect(cookieStore.get('rl_session')).toBeTruthy();
    });

    it('만료/잘못된 토큰은 redirect to error', async () => {
        const res = await verifyGET(new Request(`http://x/api/auth/verify?token=invalid-token`));
        const location = res.headers.get('location');
        expect(location).toContain('auth_error');
    });
});
