// @vitest-environment node
import { describe, it, expect, beforeAll } from 'vitest';
import { signSession, verifySession } from '../auth/jwt';

beforeAll(() => {
  process.env.JWT_SECRET = 'test-secret-32-bytes-long-padding-padding';
});

describe('JWT 세션', () => {
  it('sign 후 verify로 동일 payload', async () => {
    const token = await signSession({ sub: 'user-abc' });
    const payload = await verifySession(token);
    expect(payload.sub).toBe('user-abc');
  });

  it('변조된 토큰은 null', async () => {
    const token = await signSession({ sub: 'user-abc' });
    const tampered = token.slice(0, -5) + 'aaaaa';
    const payload = await verifySession(tampered);
    expect(payload).toBeNull();
  });

  it('다른 시크릿으로 발급된 토큰은 null', async () => {
    const token = await signSession({ sub: 'user-abc' });
    process.env.JWT_SECRET = 'other-secret-32-bytes-padding-padding-pad';
    const payload = await verifySession(token);
    expect(payload).toBeNull();
    process.env.JWT_SECRET = 'test-secret-32-bytes-long-padding-padding';
  });
});
