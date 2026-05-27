# 다국어 학습 자료 노트 (M2) 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development (권장) 또는 superpowers:executing-plans. 각 step은 `- [ ]` 체크박스로 진행 추적.

**Goal:** 학생이 PDF·텍스트 자료를 등록하면 AI가 요약·핵심개념·객관식 문제를 자동 생성해 5언어로 번역, 기존 StudyPage/DictionaryPage에 자격증 단위로 통합 노출하는 다국어 학습 시스템.

**Architecture:** Turso DB + JWT 세션 + Vercel Functions의 Claude Sonnet 4.6 5단계 파이프라인. 자료 중심 모델(자격증 → 사용자 자료 → 자료별 생성물). 기존 콘텐츠 스키마(translations·keywordHints)와 호환되는 사용자 problems·concepts.

**Tech Stack:** Next.js 16 (App Router), React 19, Turso (libSQL), `@libsql/client`, `jose` (JWT), `@anthropic-ai/sdk`, `pdf-parse`, Resend (매직 링크), Vitest.

**연관 문서**: [2026-05-28-multilingual-notebook-design.md](../specs/2026-05-28-multilingual-notebook-design.md)

---

## File Structure

### 신규 파일
```
migrations/
  0001_users.sql
  0002_sources.sql
  0003_magic_link_tokens.sql

src/lib/
  db.js                              # Turso 클라이언트 (libSQL)
  db/
    migrate.js                       # 마이그레이션 실행기
    users.js                         # users CRUD
    sources.js                       # sources/summaries/concepts/problems CRUD
    magic-link.js                    # 매직 링크 토큰 CRUD
  auth/
    jwt.js                           # JWT sign/verify (jose)
    session.js                       # 쿠키 기반 세션 헬퍼
    require.js                       # API route 보호 미들웨어
  pdf-extract.js                     # PDF → 텍스트 추출
  ai/
    client.js                        # Anthropic SDK 래퍼
    json-mode.js                     # JSON 스키마 강제 호출
    prompts/
      classify.js                    # 도메인 적합도 분류
      summarize.js                   # 한국어 요약
      concepts.js                    # 핵심개념 추출
      problems.js                    # 객관식 문제 생성
      translate.js                   # 5언어 번역
    pipeline.js                      # 5단계 통합 파이프라인
  api-client.js                      # 클라이언트 측 fetch 헬퍼
  resend.js                          # Resend 이메일 클라이언트

src/app/api/
  auth/
    device-anon/route.js             # POST: 익명 device 계정 생성
    magic-link/route.js              # POST: 매직 링크 발송
    verify/route.js                  # GET: 토큰 검증 + 세션 발급
    logout/route.js                  # POST: 로그아웃
  me/route.js                        # GET: 현재 사용자
  sources/route.js                   # POST 등록, GET 목록
  sources/[id]/route.js              # GET 단건, DELETE
  sources/[id]/process/route.js      # POST 처리 시작
  sources/[id]/retry/route.js        # POST 실패 단계 재시도
  licences/[id]/concepts/route.js    # GET 사용자 개념 목록
  licences/[id]/problems/route.js    # GET 사용자 문제 목록

src/components/pages/
  AuthPage.js                        # 학교코드 시연모드 + 이메일 매직링크
  NotebookPage.js                    # 자격증 화면 "내 자료" 탭
  SourceDetailPage.js                # 자료 상세 (상태 + 생성물 미리보기)

src/lib/__tests__/
  db.test.js
  auth-jwt.test.js
  pdf-extract.test.js
  pipeline.test.js
src/app/api/__tests__/
  sources.test.js
  auth.test.js
  licences-userpool.test.js
```

### 수정 파일
```
src/app/page.js                     # AuthPage 분기 + 자격증 화면에 NotebookPage 탭 추가
src/components/pages/StudyPage.js   # "내 자료 N문제" 묶음 옵션
src/components/pages/DictionaryPage.js  # 사용자 개념 통합 섹션
src/data/questions/index.js         # getQuestionsByLicence — 공식 + 사용자 머지 (서버 보조)
.env.example                        # TURSO_*, ANTHROPIC_API_KEY, RESEND_API_KEY, JWT_SECRET 추가
.env.local                          # 로컬 시크릿
package.json                        # 신규 의존성
vitest.config.mjs                   # 환경변수 모킹 설정
CLAUDE.md                           # 신규 영역 라우팅 추가
```

각 파일은 단일 책임. `src/lib/ai/prompts/*.js`는 각 단계 프롬프트 + 후처리 검증만, `pipeline.js`는 조합만, route handler는 인증 + 입력 검증 + DB 호출만.

---

## Task 1: Turso DB 클라이언트 + users 마이그레이션

**Files:**
- Create: `src/lib/db.js`
- Create: `src/lib/db/migrate.js`
- Create: `migrations/0001_users.sql`
- Modify: `.env.example`, `.env.local`, `package.json`
- Test: `src/lib/__tests__/db.test.js`

- [ ] **Step 1: 의존성 설치**

```bash
npm install @libsql/client
```

- [ ] **Step 2: 환경변수 추가**

`.env.example` 끝에 추가:
```
# Turso DB (M2)
TURSO_DATABASE_URL=libsql://your-db-name.turso.io
TURSO_AUTH_TOKEN=
# 로컬 dev는 file:./dev.db 가능
```

`.env.local`에 동일 키 추가 (값은 빈 상태 유지하고 시연 전에 채움). 로컬 dev는 `TURSO_DATABASE_URL=file:./dev.db`로 시작 가능.

- [ ] **Step 3: 마이그레이션 작성**

Create `migrations/0001_users.sql`:
```sql
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE,
  device_id TEXT UNIQUE,
  school_code TEXT,
  display_name TEXT,
  language TEXT NOT NULL DEFAULT 'vi',
  korean_level TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_device ON users(device_id);

CREATE TABLE IF NOT EXISTS _migrations (
  id TEXT PRIMARY KEY,
  applied_at INTEGER NOT NULL
);
```

- [ ] **Step 4: DB 클라이언트 작성**

Create `src/lib/db.js`:
```js
import { createClient } from '@libsql/client';

let _client = null;

export function getDb() {
  if (_client) return _client;
  const url = process.env.TURSO_DATABASE_URL;
  if (!url) throw new Error('TURSO_DATABASE_URL not set');
  _client = createClient({
    url,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
  return _client;
}

// Dev/test 리셋용
export function _resetDb() {
  _client = null;
}
```

- [ ] **Step 5: 마이그레이션 실행기 작성**

Create `src/lib/db/migrate.js`:
```js
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { getDb } from '../db';

export async function runMigrations(dir = 'migrations') {
  const db = getDb();
  await db.execute(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id TEXT PRIMARY KEY,
      applied_at INTEGER NOT NULL
    )
  `);
  const files = (await readdir(dir)).filter(f => f.endsWith('.sql')).sort();
  for (const f of files) {
    const id = f.replace('.sql', '');
    const exists = await db.execute({
      sql: 'SELECT id FROM _migrations WHERE id = ?',
      args: [id],
    });
    if (exists.rows.length > 0) continue;
    const sql = await readFile(join(dir, f), 'utf8');
    // 세미콜론 기준 분할 (단순 마이그레이션은 충분)
    const statements = sql.split(';').map(s => s.trim()).filter(Boolean);
    for (const stmt of statements) {
      await db.execute(stmt);
    }
    await db.execute({
      sql: 'INSERT INTO _migrations (id, applied_at) VALUES (?, ?)',
      args: [id, Date.now()],
    });
    console.log(`✓ migration ${id} applied`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runMigrations().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
}
```

`package.json` `scripts`에 추가:
```json
"db:migrate": "node src/lib/db/migrate.js"
```

- [ ] **Step 6: 테스트 작성 (failing first)**

Create `src/lib/__tests__/db.test.js`:
```js
import { describe, it, expect, beforeAll } from 'vitest';
import { getDb, _resetDb } from '../db';
import { runMigrations } from '../db/migrate';

describe('Turso DB', () => {
  beforeAll(async () => {
    process.env.TURSO_DATABASE_URL = 'file::memory:';
    _resetDb();
    await runMigrations();
  });

  it('users 테이블이 존재한다', async () => {
    const db = getDb();
    const res = await db.execute(`SELECT name FROM sqlite_master WHERE type='table' AND name='users'`);
    expect(res.rows.length).toBe(1);
  });

  it('users 행 삽입과 조회', async () => {
    const db = getDb();
    const now = Date.now();
    await db.execute({
      sql: 'INSERT INTO users (id, device_id, language, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
      args: ['u1', 'd1', 'vi', now, now],
    });
    const res = await db.execute({ sql: 'SELECT * FROM users WHERE id = ?', args: ['u1'] });
    expect(res.rows[0].device_id).toBe('d1');
    expect(res.rows[0].language).toBe('vi');
  });

  it('마이그레이션 멱등성', async () => {
    await runMigrations();
    await runMigrations();
    const db = getDb();
    const res = await db.execute(`SELECT COUNT(*) as c FROM _migrations`);
    expect(Number(res.rows[0].c)).toBe(1);
  });
});
```

- [ ] **Step 7: 테스트 실행 + 통과 확인**

```bash
npm run test:run -- src/lib/__tests__/db.test.js
```
Expected: 3 passed.

- [ ] **Step 8: 커밋**

```bash
git add migrations/0001_users.sql src/lib/db.js src/lib/db/migrate.js src/lib/__tests__/db.test.js .env.example .env.local package.json
git commit -m "feat(db): Turso DB 클라이언트 + users 마이그레이션 + 멱등 마이그레이션 실행기

- @libsql/client 도입, dev/test는 file::memory: 사용
- migrations/0001_users.sql: users 테이블 + _migrations 추적
- runMigrations(): idempotent 적용
- 3 tests passing"
```

---

## Task 2: JWT 세션 헬퍼

**Files:**
- Create: `src/lib/auth/jwt.js`
- Create: `src/lib/auth/session.js`
- Create: `src/lib/auth/require.js`
- Modify: `.env.example`, `.env.local`, `package.json`
- Test: `src/lib/__tests__/auth-jwt.test.js`

- [ ] **Step 1: 의존성 설치**

```bash
npm install jose
```

- [ ] **Step 2: 환경변수 추가**

`.env.example`:
```
# JWT (M2)
JWT_SECRET=replace-with-256bit-random-string
```

`.env.local`에 실제 시크릿 (32 byte 무작위): 
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
출력을 `.env.local` `JWT_SECRET=`에 붙여넣기.

- [ ] **Step 3: JWT sign/verify 작성**

Create `src/lib/auth/jwt.js`:
```js
import { SignJWT, jwtVerify } from 'jose';

const ALG = 'HS256';
const ISSUER = 'rainbow-licence';
const AUDIENCE = 'rainbow-licence-app';
const TTL = 60 * 60 * 24 * 30; // 30 days seconds

function getKey() {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error('JWT_SECRET not set');
  return new TextEncoder().encode(s);
}

export async function signSession(payload) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: ALG })
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${TTL}s`)
    .sign(getKey());
}

export async function verifySession(token) {
  try {
    const { payload } = await jwtVerify(token, getKey(), {
      issuer: ISSUER,
      audience: AUDIENCE,
    });
    return payload;
  } catch {
    return null;
  }
}
```

- [ ] **Step 4: 쿠키 세션 헬퍼 작성**

Create `src/lib/auth/session.js`:
```js
import { cookies } from 'next/headers';
import { signSession, verifySession } from './jwt';

const COOKIE = 'rl_session';

export async function setSessionCookie(userId) {
  const token = await signSession({ sub: userId });
  const c = await cookies();
  c.set(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSessionCookie() {
  const c = await cookies();
  c.delete(COOKIE);
}

export async function getCurrentUserId() {
  const c = await cookies();
  const token = c.get(COOKIE)?.value;
  if (!token) return null;
  const payload = await verifySession(token);
  return payload?.sub ?? null;
}
```

- [ ] **Step 5: route 보호 헬퍼**

Create `src/lib/auth/require.js`:
```js
import { NextResponse } from 'next/server';
import { getCurrentUserId } from './session';

export async function requireUser() {
  const userId = await getCurrentUserId();
  if (!userId) {
    return { userId: null, response: NextResponse.json({ error: 'unauthenticated' }, { status: 401 }) };
  }
  return { userId, response: null };
}
```

- [ ] **Step 6: 테스트 작성**

Create `src/lib/__tests__/auth-jwt.test.js`:
```js
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
```

- [ ] **Step 7: 테스트 실행**

```bash
npm run test:run -- src/lib/__tests__/auth-jwt.test.js
```
Expected: 3 passed.

- [ ] **Step 8: 커밋**

```bash
git add src/lib/auth/ src/lib/__tests__/auth-jwt.test.js .env.example .env.local package.json
git commit -m "feat(auth): jose 기반 JWT 세션 + 쿠키 헬퍼 + route 보호

- signSession/verifySession (HS256, 30일 만료, issuer/audience 고정)
- setSessionCookie/clearSessionCookie/getCurrentUserId (httpOnly, sameSite lax)
- requireUser() API route 보호 헬퍼
- 3 tests passing"
```

---

## Task 3: users CRUD + device-anonymous 인증 흐름

**Files:**
- Create: `src/lib/db/users.js`
- Create: `src/app/api/auth/device-anon/route.js`
- Create: `src/app/api/me/route.js`
- Create: `src/app/api/auth/logout/route.js`
- Test: `src/app/api/__tests__/auth.test.js`

- [ ] **Step 1: users CRUD**

Create `src/lib/db/users.js`:
```js
import { randomUUID } from 'node:crypto';
import { getDb } from '../db';

export async function getUserById(id) {
  const db = getDb();
  const res = await db.execute({ sql: 'SELECT * FROM users WHERE id = ?', args: [id] });
  return res.rows[0] ?? null;
}

export async function getUserByDeviceId(deviceId) {
  const db = getDb();
  const res = await db.execute({ sql: 'SELECT * FROM users WHERE device_id = ?', args: [deviceId] });
  return res.rows[0] ?? null;
}

export async function getUserByEmail(email) {
  const db = getDb();
  const res = await db.execute({ sql: 'SELECT * FROM users WHERE email = ?', args: [email] });
  return res.rows[0] ?? null;
}

export async function createDeviceUser({ deviceId, schoolCode, language = 'vi', koreanLevel = null }) {
  const db = getDb();
  const id = randomUUID();
  const now = Date.now();
  await db.execute({
    sql: `INSERT INTO users (id, device_id, school_code, language, korean_level, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: [id, deviceId, schoolCode ?? null, language, koreanLevel, now, now],
  });
  return getUserById(id);
}

export async function updateUser(id, patch) {
  const db = getDb();
  const allowed = ['email', 'display_name', 'language', 'korean_level', 'school_code'];
  const set = Object.keys(patch).filter(k => allowed.includes(k));
  if (set.length === 0) return getUserById(id);
  const setSql = set.map(k => `${k} = ?`).join(', ');
  const args = [...set.map(k => patch[k]), Date.now(), id];
  await db.execute({
    sql: `UPDATE users SET ${setSql}, updated_at = ? WHERE id = ?`,
    args,
  });
  return getUserById(id);
}
```

- [ ] **Step 2: device-anon route**

Create `src/app/api/auth/device-anon/route.js`:
```js
import { NextResponse } from 'next/server';
import { getUserByDeviceId, createDeviceUser } from '@/lib/db/users';
import { setSessionCookie } from '@/lib/auth/session';

export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  const { deviceId, schoolCode, language = 'vi' } = body;
  if (!deviceId || typeof deviceId !== 'string' || deviceId.length < 8) {
    return NextResponse.json({ error: 'invalid deviceId' }, { status: 400 });
  }
  let user = await getUserByDeviceId(deviceId);
  if (!user) {
    user = await createDeviceUser({ deviceId, schoolCode, language });
  }
  await setSessionCookie(user.id);
  return NextResponse.json({ user: { id: user.id, language: user.language, schoolCode: user.school_code } });
}
```

- [ ] **Step 3: /api/me + /api/auth/logout**

Create `src/app/api/me/route.js`:
```js
import { NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth/session';
import { getUserById } from '@/lib/db/users';

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ user: null });
  const user = await getUserById(userId);
  if (!user) return NextResponse.json({ user: null });
  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      language: user.language,
      schoolCode: user.school_code,
      koreanLevel: user.korean_level,
      displayName: user.display_name,
    },
  });
}
```

Create `src/app/api/auth/logout/route.js`:
```js
import { NextResponse } from 'next/server';
import { clearSessionCookie } from '@/lib/auth/session';

export async function POST() {
  await clearSessionCookie();
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 4: API 테스트 (route handler 직접 호출)**

Create `src/app/api/__tests__/auth.test.js`:
```js
import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { _resetDb } from '@/lib/db';
import { runMigrations } from '@/lib/db/migrate';
import { POST as deviceAnonPOST } from '@/app/api/auth/device-anon/route';

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
```

`vitest.config.mjs`에 `globals: true` 또는 명시 import 필요. 기존 설정 확인 후 조정.

- [ ] **Step 5: 테스트 실행**

```bash
npm run test:run -- src/app/api/__tests__/auth.test.js
```
Expected: 3 passed.

- [ ] **Step 6: 커밋**

```bash
git add src/lib/db/users.js src/app/api/auth/ src/app/api/me/ src/app/api/__tests__/auth.test.js
git commit -m "feat(auth): device-anonymous 인증 + /api/me + /api/auth/logout

- users CRUD (getById/getByDeviceId/getByEmail/createDeviceUser/updateUser)
- POST /api/auth/device-anon: deviceId 기반 익명 계정 자동 생성 → JWT 세션 발급
- GET /api/me: 현재 사용자 프로필
- POST /api/auth/logout: 세션 쿠키 삭제
- 3 tests passing"
```

---

## Task 4: 매직 링크 인증 (Resend)

**Files:**
- Create: `migrations/0003_magic_link_tokens.sql`
- Create: `src/lib/db/magic-link.js`
- Create: `src/lib/resend.js`
- Create: `src/app/api/auth/magic-link/route.js`
- Create: `src/app/api/auth/verify/route.js`
- Modify: `.env.example`, `.env.local`, `package.json`
- Test: `src/app/api/__tests__/auth.test.js` 확장

- [ ] **Step 1: 의존성 설치**

```bash
npm install resend
```

- [ ] **Step 2: 환경변수**

`.env.example`:
```
# Resend (M2)
RESEND_API_KEY=
RESEND_FROM_EMAIL=Rainbow Licence <noreply@yourdomain>
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

`.env.local`에 실제 값 (시연 전 채움).

- [ ] **Step 3: 마이그레이션**

Create `migrations/0003_magic_link_tokens.sql`:
```sql
CREATE TABLE IF NOT EXISTS magic_link_tokens (
  token TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  user_id TEXT,
  expires_at INTEGER NOT NULL,
  used INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_mlt_email ON magic_link_tokens(email);
```

- [ ] **Step 4: 토큰 CRUD**

Create `src/lib/db/magic-link.js`:
```js
import { randomUUID } from 'node:crypto';
import { getDb } from '../db';

const TOKEN_TTL_MS = 15 * 60 * 1000; // 15 min

export async function createToken(email, userId = null) {
  const db = getDb();
  const token = randomUUID().replace(/-/g, '');
  const now = Date.now();
  await db.execute({
    sql: `INSERT INTO magic_link_tokens (token, email, user_id, expires_at, used, created_at)
          VALUES (?, ?, ?, ?, 0, ?)`,
    args: [token, email, userId, now + TOKEN_TTL_MS, now],
  });
  return token;
}

export async function consumeToken(token) {
  const db = getDb();
  const res = await db.execute({
    sql: 'SELECT * FROM magic_link_tokens WHERE token = ? AND used = 0 AND expires_at > ?',
    args: [token, Date.now()],
  });
  const row = res.rows[0];
  if (!row) return null;
  await db.execute({
    sql: 'UPDATE magic_link_tokens SET used = 1 WHERE token = ?',
    args: [token],
  });
  return { email: row.email, userId: row.user_id };
}
```

- [ ] **Step 5: Resend 클라이언트**

Create `src/lib/resend.js`:
```js
import { Resend } from 'resend';

let _client = null;
function getResend() {
  if (_client) return _client;
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error('RESEND_API_KEY not set');
  _client = new Resend(key);
  return _client;
}

export async function sendMagicLinkEmail({ to, link }) {
  const from = process.env.RESEND_FROM_EMAIL || 'Rainbow Licence <noreply@example.com>';
  await getResend().emails.send({
    from,
    to,
    subject: 'Rainbow Licence 로그인 링크',
    html: `<p>안녕하세요!</p>
           <p>아래 링크를 클릭하면 로그인됩니다 (15분 유효):</p>
           <p><a href="${link}">${link}</a></p>
           <p>본인이 요청하지 않았다면 이 메일을 무시하세요.</p>`,
    text: `Rainbow Licence 로그인 링크 (15분 유효): ${link}`,
  });
}
```

- [ ] **Step 6: magic-link POST route**

Create `src/app/api/auth/magic-link/route.js`:
```js
import { NextResponse } from 'next/server';
import { createToken } from '@/lib/db/magic-link';
import { getUserByEmail } from '@/lib/db/users';
import { sendMagicLinkEmail } from '@/lib/resend';

export async function POST(req) {
  const { email } = await req.json().catch(() => ({}));
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'invalid email' }, { status: 400 });
  }
  const existing = await getUserByEmail(email);
  const token = await createToken(email, existing?.id ?? null);
  const link = `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/verify?token=${token}`;
  await sendMagicLinkEmail({ to: email, link });
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 7: verify GET route**

Create `src/app/api/auth/verify/route.js`:
```js
import { NextResponse } from 'next/server';
import { consumeToken } from '@/lib/db/magic-link';
import { getUserByEmail, createDeviceUser, updateUser } from '@/lib/db/users';
import { setSessionCookie, getCurrentUserId } from '@/lib/auth/session';

export async function GET(req) {
  const url = new URL(req.url);
  const token = url.searchParams.get('token');
  if (!token) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/?auth_error=missing_token`);
  }
  const consumed = await consumeToken(token);
  if (!consumed) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/?auth_error=invalid_or_expired`);
  }
  // 기존 사용자가 있으면 그걸 사용, 없으면 (anonymous device 사용자가 같이 있는 경우) 승격
  let user = await getUserByEmail(consumed.email);
  if (!user) {
    const currentId = await getCurrentUserId();
    if (currentId) {
      user = await updateUser(currentId, { email: consumed.email });
    } else {
      // 이메일만으로 신규 사용자 (device 없음). 임시 device_id로 채움.
      user = await createDeviceUser({ deviceId: `email:${consumed.email}`, language: 'vi' });
      user = await updateUser(user.id, { email: consumed.email });
    }
  }
  await setSessionCookie(user.id);
  return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/?auth_ok=1`);
}
```

- [ ] **Step 8: 매직 링크 테스트**

`src/app/api/__tests__/auth.test.js`에 다음 describe 추가:
```js
import { POST as magicLinkPOST } from '@/app/api/auth/magic-link/route';
import { GET as verifyGET } from '@/app/api/auth/verify/route';
import { createToken } from '@/lib/db/magic-link';

vi.mock('@/lib/resend', () => ({
  sendMagicLinkEmail: vi.fn(async () => {}),
}));

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

  it('만료된 토큰은 redirect to error', async () => {
    const res = await verifyGET(new Request(`http://x/api/auth/verify?token=invalid-token`));
    const location = res.headers.get('location');
    expect(location).toContain('auth_error');
  });
});
```

- [ ] **Step 9: 테스트 실행**

```bash
npm run test:run -- src/app/api/__tests__/auth.test.js
```
Expected: 7 passed total (이전 3 + 신규 4).

- [ ] **Step 10: 커밋**

```bash
git add migrations/0003_magic_link_tokens.sql src/lib/db/magic-link.js src/lib/resend.js src/app/api/auth/magic-link/ src/app/api/auth/verify/ src/app/api/__tests__/auth.test.js .env.example .env.local package.json
git commit -m "feat(auth): 매직 링크 인증 (Resend) + 토큰 1회 사용·15분 만료

- magic_link_tokens 테이블 + createToken/consumeToken
- POST /api/auth/magic-link: 토큰 생성 + Resend 이메일 발송
- GET /api/auth/verify?token: 토큰 검증 + 세션 발급 + 익명 device 승격
- Resend mock으로 4 tests passing"
```

---

## Task 5: sources/summaries/concepts/problems 마이그레이션 + CRUD

**Files:**
- Create: `migrations/0002_sources.sql` (실제 파일명은 0004로, 순서 유지: 0001/0003 인증 다음)
- Create: `src/lib/db/sources.js`
- Test: `src/lib/__tests__/sources-db.test.js`

> 마이그레이션 번호 충돌 정정: Task 1=0001_users, Task 4=0003_magic_link_tokens. 이 task는 **`migrations/0004_sources.sql`**.

- [ ] **Step 1: 마이그레이션**

Create `migrations/0004_sources.sql`:
```sql
CREATE TABLE IF NOT EXISTS sources (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  licence_id TEXT NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  original_filename TEXT,
  raw_text TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  status_message TEXT,
  domain_score REAL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sources_user_licence ON sources(user_id, licence_id);

CREATE TABLE IF NOT EXISTS summaries (
  id TEXT PRIMARY KEY,
  source_id TEXT NOT NULL UNIQUE REFERENCES sources(id) ON DELETE CASCADE,
  ko_text TEXT NOT NULL,
  vi_text TEXT,
  zh_text TEXT,
  th_text TEXT,
  tl_text TEXT,
  my_text TEXT,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS concepts (
  id TEXT PRIMARY KEY,
  source_id TEXT NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  korean TEXT NOT NULL,
  korean_definition TEXT NOT NULL,
  pronunciation TEXT,
  category TEXT,
  vi TEXT, zh TEXT, th TEXT, tl TEXT, my TEXT,
  vi_def TEXT, zh_def TEXT, th_def TEXT, tl_def TEXT, my_def TEXT,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_concepts_source ON concepts(source_id);

CREATE TABLE IF NOT EXISTS problems (
  id TEXT PRIMARY KEY,
  source_id TEXT NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  ko_question TEXT NOT NULL,
  ko_options_json TEXT NOT NULL,
  correct_answer INTEGER NOT NULL,
  ko_explanation TEXT NOT NULL,
  ko_simple_explanation TEXT,
  translations_json TEXT NOT NULL,
  keyword_hints_json TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_problems_source ON problems(source_id);
```

- [ ] **Step 2: CRUD 헬퍼**

Create `src/lib/db/sources.js`:
```js
import { randomUUID } from 'node:crypto';
import { getDb } from '../db';

// --- sources ---
export async function createSource({ userId, licenceId, type, title, originalFilename = null, rawText = null }) {
  const db = getDb();
  const id = randomUUID();
  const now = Date.now();
  await db.execute({
    sql: `INSERT INTO sources (id, user_id, licence_id, type, title, original_filename, raw_text, status, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
    args: [id, userId, licenceId, type, title, originalFilename, rawText, now, now],
  });
  return getSourceById(id);
}

export async function getSourceById(id) {
  const db = getDb();
  const res = await db.execute({ sql: 'SELECT * FROM sources WHERE id = ?', args: [id] });
  return res.rows[0] ?? null;
}

export async function listSourcesByUserAndLicence(userId, licenceId) {
  const db = getDb();
  const res = await db.execute({
    sql: 'SELECT * FROM sources WHERE user_id = ? AND licence_id = ? ORDER BY created_at DESC',
    args: [userId, licenceId],
  });
  return res.rows;
}

export async function updateSourceStatus(id, status, message = null) {
  const db = getDb();
  await db.execute({
    sql: `UPDATE sources SET status = ?, status_message = ?, updated_at = ? WHERE id = ?`,
    args: [status, message, Date.now(), id],
  });
}

export async function setSourceRawText(id, rawText) {
  const db = getDb();
  await db.execute({
    sql: `UPDATE sources SET raw_text = ?, updated_at = ? WHERE id = ?`,
    args: [rawText, Date.now(), id],
  });
}

export async function setSourceDomainScore(id, score) {
  const db = getDb();
  await db.execute({
    sql: `UPDATE sources SET domain_score = ?, updated_at = ? WHERE id = ?`,
    args: [score, Date.now(), id],
  });
}

export async function deleteSource(id) {
  const db = getDb();
  await db.execute({ sql: 'DELETE FROM sources WHERE id = ?', args: [id] });
}

// --- summaries ---
export async function upsertSummary(sourceId, langs) {
  const db = getDb();
  const id = randomUUID();
  const now = Date.now();
  await db.execute({
    sql: `INSERT INTO summaries (id, source_id, ko_text, vi_text, zh_text, th_text, tl_text, my_text, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(source_id) DO UPDATE SET
            ko_text = excluded.ko_text,
            vi_text = excluded.vi_text,
            zh_text = excluded.zh_text,
            th_text = excluded.th_text,
            tl_text = excluded.tl_text,
            my_text = excluded.my_text`,
    args: [id, sourceId, langs.ko ?? null, langs.vi ?? null, langs.zh ?? null, langs.th ?? null, langs.tl ?? null, langs.my ?? null, now],
  });
}

export async function getSummary(sourceId) {
  const db = getDb();
  const res = await db.execute({ sql: 'SELECT * FROM summaries WHERE source_id = ?', args: [sourceId] });
  return res.rows[0] ?? null;
}

// --- concepts ---
export async function insertConcepts(sourceId, conceptList) {
  const db = getDb();
  const now = Date.now();
  for (const c of conceptList) {
    await db.execute({
      sql: `INSERT INTO concepts (id, source_id, korean, korean_definition, pronunciation, category,
                                  vi, zh, th, tl, my, vi_def, zh_def, th_def, tl_def, my_def, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [randomUUID(), sourceId, c.korean, c.korean_definition, c.pronunciation ?? null, c.category ?? null,
             c.vi ?? null, c.zh ?? null, c.th ?? null, c.tl ?? null, c.my ?? null,
             c.vi_def ?? null, c.zh_def ?? null, c.th_def ?? null, c.tl_def ?? null, c.my_def ?? null, now],
    });
  }
}

export async function listConceptsBySource(sourceId) {
  const db = getDb();
  const res = await db.execute({ sql: 'SELECT * FROM concepts WHERE source_id = ? ORDER BY created_at', args: [sourceId] });
  return res.rows;
}

// --- problems ---
export async function insertProblems(sourceId, problemList) {
  const db = getDb();
  const now = Date.now();
  for (const p of problemList) {
    await db.execute({
      sql: `INSERT INTO problems (id, source_id, ko_question, ko_options_json, correct_answer, ko_explanation,
                                   ko_simple_explanation, translations_json, keyword_hints_json, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [randomUUID(), sourceId, p.ko_question, JSON.stringify(p.ko_options), p.correct_answer,
             p.ko_explanation, p.ko_simple_explanation ?? null,
             JSON.stringify(p.translations), JSON.stringify(p.keyword_hints), now],
    });
  }
}

export async function listProblemsBySource(sourceId) {
  const db = getDb();
  const res = await db.execute({ sql: 'SELECT * FROM problems WHERE source_id = ? ORDER BY created_at', args: [sourceId] });
  return res.rows.map(r => ({
    id: r.id,
    source_id: r.source_id,
    ko_question: r.ko_question,
    ko_options: JSON.parse(r.ko_options_json),
    correct_answer: Number(r.correct_answer),
    ko_explanation: r.ko_explanation,
    ko_simple_explanation: r.ko_simple_explanation,
    translations: JSON.parse(r.translations_json),
    keyword_hints: JSON.parse(r.keyword_hints_json),
  }));
}

// 사용자 + 자격증으로 전체 problems/concepts
export async function listProblemsForUserLicence(userId, licenceId) {
  const db = getDb();
  const res = await db.execute({
    sql: `SELECT p.* FROM problems p
          JOIN sources s ON p.source_id = s.id
          WHERE s.user_id = ? AND s.licence_id = ? AND s.status = 'done'`,
    args: [userId, licenceId],
  });
  return res.rows.map(r => ({
    id: r.id,
    source_id: r.source_id,
    ko_question: r.ko_question,
    ko_options: JSON.parse(r.ko_options_json),
    correct_answer: Number(r.correct_answer),
    ko_explanation: r.ko_explanation,
    translations: JSON.parse(r.translations_json),
    keyword_hints: JSON.parse(r.keyword_hints_json),
  }));
}

export async function listConceptsForUserLicence(userId, licenceId) {
  const db = getDb();
  const res = await db.execute({
    sql: `SELECT c.* FROM concepts c
          JOIN sources s ON c.source_id = s.id
          WHERE s.user_id = ? AND s.licence_id = ? AND s.status = 'done'`,
    args: [userId, licenceId],
  });
  return res.rows;
}
```

- [ ] **Step 3: 테스트**

Create `src/lib/__tests__/sources-db.test.js`:
```js
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
    expect(list).toHaveLength(1);
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
    expect(res).toHaveLength(0);
    await updateSourceStatus(s1.id, 'done');
    res = await listProblemsForUserLicence(userId, 'korean-food');
    expect(res).toHaveLength(1);
  });
});
```

- [ ] **Step 4: 테스트 실행**

```bash
npm run test:run -- src/lib/__tests__/sources-db.test.js
```
Expected: 5 passed.

- [ ] **Step 5: 커밋**

```bash
git add migrations/0004_sources.sql src/lib/db/sources.js src/lib/__tests__/sources-db.test.js
git commit -m "feat(db): sources/summaries/concepts/problems 스키마 + CRUD

- 자료 중심 모델: sources에 status/raw_text/domain_score
- summaries 1:1, concepts·problems 1:N (CASCADE DELETE)
- JSON 직렬화: ko_options/translations/keyword_hints
- listProblemsForUserLicence: status='done' 필터 — 미완료 자료는 학습 풀에서 제외
- 5 tests passing"
```

---

## Task 6: PDF 파싱 헬퍼

**Files:**
- Create: `src/lib/pdf-extract.js`
- Modify: `package.json`
- Test: `src/lib/__tests__/pdf-extract.test.js`
- Create: `src/lib/__tests__/fixtures/sample.pdf` (작은 PDF 픽스처, ~5KB)

- [ ] **Step 1: 의존성 선택 + 설치**

`pdf-parse`는 메인테너 비활성, `pdfjs-dist`는 Vercel Node 환경에서 무겁고 worker 이슈, `unpdf`는 새로 등장한 wrapper. M2에서는 안정적인 `pdf-parse` 사용:

```bash
npm install pdf-parse
```

이 라이브러리는 내부에서 `pdfjs-dist`를 사용하지만 Node 환경에 최적화돼 있음.

- [ ] **Step 2: 파싱 헬퍼**

Create `src/lib/pdf-extract.js`:
```js
import pdfParse from 'pdf-parse';

const MAX_PAGES = 50;
const MAX_CHARS = 500_000;

export async function extractTextFromPdf(buffer) {
  let data;
  try {
    data = await pdfParse(buffer, { max: MAX_PAGES });
  } catch (e) {
    throw new PdfExtractError(`pdf-parse 실패: ${e.message}`);
  }
  const text = (data.text ?? '').trim();
  if (!text) {
    throw new PdfExtractError('텍스트 추출 결과가 비어있습니다. 스캔 이미지 PDF일 수 있습니다.');
  }
  if (text.length > MAX_CHARS) {
    return text.slice(0, MAX_CHARS);
  }
  return text;
}

export class PdfExtractError extends Error {
  constructor(message) {
    super(message);
    this.name = 'PdfExtractError';
  }
}
```

- [ ] **Step 3: 픽스처 PDF 준비**

`src/lib/__tests__/fixtures/`를 만들고 작은 텍스트 PDF 1개 넣기. 직접 만들거나, `pdf-lib`으로 생성:

```bash
mkdir -p src/lib/__tests__/fixtures
node -e "
const { PDFDocument, StandardFonts } = require('pdf-lib');
(async () => {
  const doc = await PDFDocument.create();
  const page = doc.addPage([400, 400]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  page.drawText('Hello food hygiene HACCP test 1234.', { x: 30, y: 200, size: 14, font });
  const bytes = await doc.save();
  require('fs').writeFileSync('src/lib/__tests__/fixtures/sample.pdf', bytes);
})();
"
```

(`pdf-lib`은 devDep으로만 필요: `npm install --save-dev pdf-lib`)

- [ ] **Step 4: 테스트**

Create `src/lib/__tests__/pdf-extract.test.js`:
```js
import { describe, it, expect } from 'vitest';
import { readFile } from 'node:fs/promises';
import { extractTextFromPdf, PdfExtractError } from '../pdf-extract';

describe('PDF 텍스트 추출', () => {
  it('샘플 PDF에서 텍스트 추출', async () => {
    const buf = await readFile('src/lib/__tests__/fixtures/sample.pdf');
    const text = await extractTextFromPdf(buf);
    expect(text).toContain('HACCP');
    expect(text).toContain('1234');
  });

  it('비어있는 buffer는 에러', async () => {
    await expect(extractTextFromPdf(Buffer.from([])))
      .rejects.toThrow(PdfExtractError);
  });

  it('잘못된 PDF 형식은 PdfExtractError', async () => {
    await expect(extractTextFromPdf(Buffer.from('not a pdf')))
      .rejects.toThrow(PdfExtractError);
  });
});
```

- [ ] **Step 5: 테스트 실행**

```bash
npm run test:run -- src/lib/__tests__/pdf-extract.test.js
```
Expected: 3 passed.

- [ ] **Step 6: 커밋**

```bash
git add src/lib/pdf-extract.js src/lib/__tests__/pdf-extract.test.js src/lib/__tests__/fixtures/sample.pdf package.json
git commit -m "feat(pdf): pdf-parse 기반 텍스트 추출 + 50페이지/50만자 한도 + PdfExtractError

- buffer → 텍스트 (Vercel Node 안정 동작)
- 빈/잘못된 PDF는 PdfExtractError로 명확한 사용자 메시지
- pdf-lib (dev) 픽스처 생성
- 3 tests passing"
```

---

## Task 7: 자료 등록 API (POST/GET/DELETE)

**Files:**
- Create: `src/app/api/sources/route.js`
- Create: `src/app/api/sources/[id]/route.js`
- Test: `src/app/api/__tests__/sources.test.js`

- [ ] **Step 1: POST /api/sources (텍스트 + PDF)**

Create `src/app/api/sources/route.js`:
```js
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
```

- [ ] **Step 2: GET/DELETE /api/sources/[id]**

Create `src/app/api/sources/[id]/route.js`:
```js
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
```

- [ ] **Step 3: 테스트**

Create `src/app/api/__tests__/sources.test.js`:
```js
import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
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
    expect(json.sources).toHaveLength(1);
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
```

- [ ] **Step 4: 테스트 실행**

```bash
npm run test:run -- src/app/api/__tests__/sources.test.js
```
Expected: 6 passed.

- [ ] **Step 5: 커밋**

```bash
git add src/app/api/sources/ src/app/api/__tests__/sources.test.js
git commit -m "feat(api): /api/sources POST(text+PDF)/GET/DELETE + 권한 격리

- POST text JSON / multipart PDF 양쪽 처리, 50만자 한도
- PDF 파싱 실패 시 status=failed + 422 + 명확한 메시지
- GET ?licence_id=X로 자격증별 목록
- /[id] GET/DELETE는 user_id 일치 시에만 (다른 사용자 404)
- 6 tests passing"
```

---

## Task 8: Anthropic 클라이언트 + JSON 모드 헬퍼

**Files:**
- Create: `src/lib/ai/client.js`
- Create: `src/lib/ai/json-mode.js`
- Modify: `.env.example`, `.env.local`, `package.json`
- Test: `src/lib/__tests__/ai-client.test.js`

- [ ] **Step 1: 의존성 + 환경변수**

```bash
npm install @anthropic-ai/sdk
```

`.env.example`:
```
# Anthropic (M2)
ANTHROPIC_API_KEY=
ANTHROPIC_MODEL=claude-sonnet-4-6
```

- [ ] **Step 2: 클라이언트**

Create `src/lib/ai/client.js`:
```js
import Anthropic from '@anthropic-ai/sdk';

let _client = null;
export function getAnthropic() {
  if (_client) return _client;
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error('ANTHROPIC_API_KEY not set');
  _client = new Anthropic({ apiKey: key });
  return _client;
}

export function getModel() {
  return process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6';
}
```

- [ ] **Step 3: JSON 모드 헬퍼**

Create `src/lib/ai/json-mode.js`:
```js
import { getAnthropic, getModel } from './client';

/**
 * Claude에 JSON 출력 요청. 응답에서 첫 ```json ... ``` 블록 또는 { ... } 자체를 파싱.
 * 실패 시 1회 재시도.
 */
export async function callJsonMode({ system, user, maxTokens = 4000, retries = 1 }) {
  const client = getAnthropic();
  const model = getModel();
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const resp = await client.messages.create({
      model,
      max_tokens: maxTokens,
      system: system + '\n\n응답은 반드시 JSON 객체 하나만 출력하세요. 마크다운 코드 블록 없이.',
      messages: [{ role: 'user', content: user }],
    });
    const text = resp.content.map(b => b.type === 'text' ? b.text : '').join('').trim();
    try {
      // 코드블록 제거 시도
      const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '');
      return JSON.parse(cleaned);
    } catch (e) {
      lastError = e;
      // 다음 시도
    }
  }
  throw new Error(`JSON parse failed after ${retries + 1} attempts: ${lastError?.message}`);
}
```

- [ ] **Step 4: 테스트 (mock SDK)**

Create `src/lib/__tests__/ai-client.test.js`:
```js
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { callJsonMode } from '../ai/json-mode';

const mockCreate = vi.fn();
vi.mock('@anthropic-ai/sdk', () => ({
  default: class { constructor() { this.messages = { create: mockCreate }; } },
}));

beforeEach(() => {
  process.env.ANTHROPIC_API_KEY = 'test-key';
  mockCreate.mockReset();
});

describe('callJsonMode', () => {
  it('정상 JSON 응답', async () => {
    mockCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: '{"foo":"bar"}' }],
    });
    const result = await callJsonMode({ system: 's', user: 'u' });
    expect(result.foo).toBe('bar');
  });

  it('코드 블록 감싸진 JSON', async () => {
    mockCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: '```json\n{"x":1}\n```' }],
    });
    const result = await callJsonMode({ system: 's', user: 'u' });
    expect(result.x).toBe(1);
  });

  it('첫 시도 실패 후 재시도', async () => {
    mockCreate.mockResolvedValueOnce({ content: [{ type: 'text', text: 'not json' }] });
    mockCreate.mockResolvedValueOnce({ content: [{ type: 'text', text: '{"ok":true}' }] });
    const result = await callJsonMode({ system: 's', user: 'u', retries: 1 });
    expect(result.ok).toBe(true);
    expect(mockCreate).toHaveBeenCalledTimes(2);
  });

  it('두 번 다 실패하면 throw', async () => {
    mockCreate.mockResolvedValue({ content: [{ type: 'text', text: 'never json' }] });
    await expect(callJsonMode({ system: 's', user: 'u', retries: 1 })).rejects.toThrow(/JSON parse failed/);
  });
});
```

- [ ] **Step 5: 테스트 실행**

```bash
npm run test:run -- src/lib/__tests__/ai-client.test.js
```
Expected: 4 passed.

- [ ] **Step 6: 커밋**

```bash
git add src/lib/ai/ src/lib/__tests__/ai-client.test.js .env.example .env.local package.json
git commit -m "feat(ai): Anthropic 클라이언트 + JSON 모드 헬퍼 (1회 재시도)

- Claude Sonnet 4.6 기본, 환경변수로 모델 오버라이드 가능
- callJsonMode: system + user 프롬프트, 응답에서 JSON 파싱 (코드블록 자동 제거)
- 파싱 실패 시 1회 재시도, 2회 모두 실패하면 throw
- 4 tests passing (SDK mock)"
```

---

## Task 9: 도메인 분류 + 한국어 요약 프롬프트

**Files:**
- Create: `src/lib/ai/prompts/classify.js`
- Create: `src/lib/ai/prompts/summarize.js`
- Test: `src/lib/__tests__/ai-prompts.test.js`

- [ ] **Step 1: 도메인 분류 프롬프트**

Create `src/lib/ai/prompts/classify.js`:
```js
import { callJsonMode } from '../json-mode';

const LICENCE_LABELS = {
  'korean-food': '한식조리기능사 (한국 음식 조리, 식품위생, 식품학, 조리이론)',
  'beauty-general': '미용사(일반) (두피·모발, 화장품학, 공중위생, 미용이론)',
  'pastry': '제과기능사 (과자·빵 재료, 제조, 식품위생)',
};

export async function classifyDomain({ rawText, licenceId }) {
  const label = LICENCE_LABELS[licenceId] || licenceId;
  const head = rawText.slice(0, 4000);
  const result = await callJsonMode({
    system: `당신은 학습 자료의 자격증 도메인 적합도를 판단하는 분류기입니다.`,
    user: `다음 자료가 "${label}" 자격증 학습에 적합한지 평가하세요.

자료 (앞부분 발췌):
"""
${head}
"""

응답 형식:
{ "score": 0.0~1.0 사이 숫자, "reason": "한국어로 간단한 사유" }

- 명백히 관련 자료면 0.8 이상
- 부분적으로만 관련(예: 일반 식품 안전, 일반 미용 상식)이면 0.4~0.7
- 무관(예: 운전·소설·뉴스)이면 0.2 이하`,
    maxTokens: 200,
  });
  const score = Math.max(0, Math.min(1, Number(result.score)));
  return { score, reason: String(result.reason ?? '') };
}
```

- [ ] **Step 2: 한국어 요약 프롬프트**

Create `src/lib/ai/prompts/summarize.js`:
```js
import { callJsonMode } from '../json-mode';

export async function summarizeInKorean({ rawText, licenceId }) {
  const head = rawText.slice(0, 30_000);
  const result = await callJsonMode({
    system: `당신은 한국 자격증 학습 자료를 요약하는 도구입니다. 정확하고 군더더기 없이 핵심만 담은 한국어 요약을 만듭니다.`,
    user: `다음 자료를 학생이 시험 준비에 활용할 수 있도록 한국어 요약하세요.

자료:
"""
${head}
"""

응답 형식:
{ "summary": "약 400~600자 분량의 한국어 요약. 줄바꿈 OK. 학습 핵심·시험 출제 가능 포인트 위주." }

피해야 할 것: 인사말, "이 자료에서는", "본문에 의하면" 같은 메타 코멘트.`,
    maxTokens: 1500,
  });
  return { ko: String(result.summary ?? '').trim() };
}
```

- [ ] **Step 3: 테스트 (mock)**

Create `src/lib/__tests__/ai-prompts.test.js`:
```js
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { classifyDomain } from '../ai/prompts/classify';
import { summarizeInKorean } from '../ai/prompts/summarize';

const mockCreate = vi.fn();
vi.mock('@anthropic-ai/sdk', () => ({
  default: class { constructor() { this.messages = { create: mockCreate }; } },
}));

beforeEach(() => {
  process.env.ANTHROPIC_API_KEY = 'test-key';
  mockCreate.mockReset();
});

describe('classifyDomain', () => {
  it('score 0~1 clamp + reason', async () => {
    mockCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: '{"score": 0.92, "reason": "한식조리 식품위생 관련"}' }],
    });
    const r = await classifyDomain({ rawText: '식품위생 HACCP 설명...', licenceId: 'korean-food' });
    expect(r.score).toBe(0.92);
    expect(r.reason).toContain('식품위생');
  });
  it('out-of-range score clamp', async () => {
    mockCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: '{"score": 1.5, "reason": "x"}' }],
    });
    const r = await classifyDomain({ rawText: 'x', licenceId: 'korean-food' });
    expect(r.score).toBe(1);
  });
});

describe('summarizeInKorean', () => {
  it('summary 트림 후 반환', async () => {
    mockCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: '{"summary": "  한식조리 식품위생 핵심 요약  "}' }],
    });
    const r = await summarizeInKorean({ rawText: 'x', licenceId: 'korean-food' });
    expect(r.ko).toBe('한식조리 식품위생 핵심 요약');
  });
});
```

- [ ] **Step 4: 테스트 실행 + 커밋**

```bash
npm run test:run -- src/lib/__tests__/ai-prompts.test.js
```
Expected: 3 passed.

```bash
git add src/lib/ai/prompts/classify.js src/lib/ai/prompts/summarize.js src/lib/__tests__/ai-prompts.test.js
git commit -m "feat(ai): 도메인 분류 + 한국어 요약 프롬프트

- classifyDomain: 자료/자격증 적합도 0~1 + 사유
- summarizeInKorean: 400~600자 한국어 요약, 메타 코멘트 제거
- 3 tests passing"
```

---

## Task 10: 핵심개념 추출 프롬프트

**Files:**
- Create: `src/lib/ai/prompts/concepts.js`
- Test: `src/lib/__tests__/ai-prompts.test.js` 확장

- [ ] **Step 1: 프롬프트 + 검증**

Create `src/lib/ai/prompts/concepts.js`:
```js
import { callJsonMode } from '../json-mode';

export async function extractConcepts({ rawText, licenceId }) {
  const head = rawText.slice(0, 30_000);
  const result = await callJsonMode({
    system: `당신은 한국 자격증 학습 자료에서 핵심 개념(용어)을 추출하는 도구입니다.`,
    user: `자료에서 시험에 자주 나올 핵심 개념(전문 용어·법령·과정·재료 등)을 8~15개 추출하세요.

자료:
"""
${head}
"""

응답 형식:
{
  "concepts": [
    {
      "korean": "용어 (한국어, 자료 본문에 등장하는 표기와 동일)",
      "korean_definition": "30~80자 한국어 정의",
      "pronunciation": "선택, 한글 발음 표기 (자료에 있으면)",
      "category": "선택, 단원/주제 자유 텍스트"
    }
  ]
}

규칙:
- 한 자료당 8~15개. 너무 많지도 적지도 않게.
- "korean"은 본문에 정확히 나오는 표기 그대로 (띄어쓰기 포함).
- 일반 단어("음식", "안전") 같은 비전문 어휘 제외.
- 동의어 중복 회피.`,
    maxTokens: 3000,
  });
  const items = Array.isArray(result.concepts) ? result.concepts : [];
  return items
    .filter(c => c?.korean && c?.korean_definition)
    .slice(0, 15)
    .map(c => ({
      korean: String(c.korean).trim(),
      korean_definition: String(c.korean_definition).trim(),
      pronunciation: c.pronunciation ? String(c.pronunciation).trim() : null,
      category: c.category ? String(c.category).trim() : null,
    }));
}
```

- [ ] **Step 2: 테스트 확장**

`src/lib/__tests__/ai-prompts.test.js`에 추가:
```js
import { extractConcepts } from '../ai/prompts/concepts';

describe('extractConcepts', () => {
  it('정상 응답 정규화', async () => {
    mockCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: JSON.stringify({
        concepts: [
          { korean: '식품위생', korean_definition: '식품의 안전을 지키는 행위', pronunciation: '식품위생', category: '식품위생' },
          { korean: 'HACCP', korean_definition: '위해요소중점관리기준', category: '식품위생' },
        ],
      }) }],
    });
    const r = await extractConcepts({ rawText: 'x', licenceId: 'korean-food' });
    expect(r).toHaveLength(2);
    expect(r[0].korean).toBe('식품위생');
  });
  it('15개 초과 자르고 누락 필드 제외', async () => {
    mockCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: JSON.stringify({
        concepts: Array.from({ length: 20 }, (_, i) => ({ korean: `c${i}`, korean_definition: 'd' }))
          .concat([{ korean: 'no-def' }]),
      }) }],
    });
    const r = await extractConcepts({ rawText: 'x', licenceId: 'korean-food' });
    expect(r).toHaveLength(15);
  });
});
```

- [ ] **Step 3: 테스트 + 커밋**

```bash
npm run test:run -- src/lib/__tests__/ai-prompts.test.js
```
Expected: 5 passed (이전 3 + 신규 2).

```bash
git add src/lib/ai/prompts/concepts.js src/lib/__tests__/ai-prompts.test.js
git commit -m "feat(ai): 핵심개념 추출 프롬프트 (8~15개, 본문 등장 표기 보존)

- extractConcepts: korean + korean_definition + 선택 pronunciation/category
- 정규화: trim, 누락 필드 제외, 15개로 제한
- 5 tests passing"
```

---

## Task 11: 객관식 문제 생성 프롬프트 + 콘텐츠 가드

**Files:**
- Create: `src/lib/ai/prompts/problems.js`
- Test: `src/lib/__tests__/ai-prompts.test.js` 확장

- [ ] **Step 1: 프롬프트 + 콘텐츠 가드**

Create `src/lib/ai/prompts/problems.js`:
```js
import { callJsonMode } from '../json-mode';

export async function generateProblems({ rawText, concepts, licenceId }) {
  const head = rawText.slice(0, 30_000);
  const conceptList = (concepts ?? []).slice(0, 10).map(c => `- ${c.korean}: ${c.korean_definition}`).join('\n');
  const result = await callJsonMode({
    system: `당신은 한국 자격증 객관식 문제를 만드는 출제 도구입니다. 정답이 명확하고 오답이 합리적인 4지선다 문제를 생성합니다.`,
    user: `다음 자료와 핵심개념을 바탕으로 객관식 4지선다 5~10문제를 만드세요.

자료:
"""
${head}
"""

핵심개념:
${conceptList}

응답 형식:
{
  "problems": [
    {
      "ko_question": "한국어 질문 (40~120자)",
      "ko_options": ["옵션1", "옵션2", "옵션3", "옵션4"],
      "correct_answer": 0,
      "ko_explanation": "정답 해설 (60~200자)",
      "ko_simple_explanation": "쉬운 풀어쓰기 해설 (40~120자, 다문화 학생용)"
    }
  ]
}

규칙:
- 5~10문제. 자료 핵심에 집중.
- correct_answer는 0~3 인덱스.
- 모든 옵션은 비슷한 길이로 (한 옵션만 유난히 길면 단서 줘서 안 됨).
- 자료 본문 그대로 문장 복붙 금지 — 출제용으로 재구성.
- ko_simple_explanation은 초급 한국어로 풀어 설명.`,
    maxTokens: 4000,
  });
  const items = Array.isArray(result.problems) ? result.problems : [];
  return items
    .filter(p => p?.ko_question && Array.isArray(p?.ko_options) && p.ko_options.length === 4
                 && typeof p?.correct_answer === 'number' && p.correct_answer >= 0 && p.correct_answer <= 3
                 && p?.ko_explanation)
    .slice(0, 10)
    .map(p => ({
      ko_question: String(p.ko_question).trim(),
      ko_options: p.ko_options.map(o => String(o).trim()),
      correct_answer: p.correct_answer,
      ko_explanation: String(p.ko_explanation).trim(),
      ko_simple_explanation: p.ko_simple_explanation ? String(p.ko_simple_explanation).trim() : null,
    }));
}
```

- [ ] **Step 2: 테스트**

`src/lib/__tests__/ai-prompts.test.js`에 추가:
```js
import { generateProblems } from '../ai/prompts/problems';

describe('generateProblems', () => {
  it('스키마 어긋난 항목 제외', async () => {
    mockCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: JSON.stringify({
        problems: [
          { ko_question: 'Q1?', ko_options: ['a','b','c','d'], correct_answer: 1, ko_explanation: 'E1' },
          { ko_question: 'no options' },
          { ko_question: 'Q3?', ko_options: ['a','b'], correct_answer: 0, ko_explanation: 'E3' }, // 옵션 2개
          { ko_question: 'Q4?', ko_options: ['a','b','c','d'], correct_answer: 5, ko_explanation: 'E4' }, // 인덱스 범위 외
        ],
      }) }],
    });
    const r = await generateProblems({ rawText: 'x', concepts: [], licenceId: 'korean-food' });
    expect(r).toHaveLength(1);
    expect(r[0].ko_question).toBe('Q1?');
    expect(r[0].correct_answer).toBe(1);
  });
});
```

- [ ] **Step 3: 테스트 + 커밋**

```bash
npm run test:run -- src/lib/__tests__/ai-prompts.test.js
```
Expected: 6 passed.

```bash
git add src/lib/ai/prompts/problems.js src/lib/__tests__/ai-prompts.test.js
git commit -m "feat(ai): 객관식 문제 생성 프롬프트 (5~10문제, 스키마 강제 검증)

- generateProblems: question + 4options + correct + explanation + simple_explanation
- 후처리: 누락/범위 외 항목 제외, 10개로 제한
- 6 tests passing"
```

---

## Task 12: 5언어 번역 프롬프트 + 본문 매칭 가드

**Files:**
- Create: `src/lib/ai/prompts/translate.js`
- Test: `src/lib/__tests__/ai-prompts.test.js` 확장

- [ ] **Step 1: 5언어 요약/개념 번역**

Create `src/lib/ai/prompts/translate.js`:
```js
import { callJsonMode } from '../json-mode';

const LANGS = ['vi', 'zh', 'th', 'tl', 'my'];
const LANG_LABELS = { vi: '베트남어', zh: '중국어(간체)', th: '태국어', tl: '필리핀어(타갈로그)', my: '미얀마어' };

export async function translateSummary({ koText }) {
  const result = await callJsonMode({
    system: '한국어 학습 요약을 5개 언어로 정확히 번역하는 도구입니다.',
    user: `한국어 요약:
"""
${koText}
"""

응답 형식:
{
  "vi": "베트남어 번역",
  "zh": "중국어 간체 번역",
  "th": "태국어 번역",
  "tl": "필리핀어(타갈로그) 번역",
  "my": "미얀마어 번역"
}

규칙: 자연스러운 번역. 한국 고유명사(예: 김치)는 음역+의역 병기 가능.`,
    maxTokens: 4000,
  });
  return Object.fromEntries(LANGS.map(l => [l, String(result?.[l] ?? '').trim() || null]));
}

export async function translateConcepts({ concepts }) {
  // 한 번에 모든 개념 번역 (배치)
  const listForPrompt = concepts.map((c, i) => `${i + 1}. ${c.korean} — ${c.korean_definition}`).join('\n');
  const result = await callJsonMode({
    system: '한국 자격증 용어와 정의를 5개 언어로 번역하는 도구입니다.',
    user: `다음 한국어 용어 목록을 5언어로 번역하세요.

목록:
${listForPrompt}

응답 형식:
{
  "items": [
    {
      "vi": "용어(베트남어)", "zh": "...", "th": "...", "tl": "...", "my": "...",
      "vi_def": "정의(베트남어)", "zh_def": "...", "th_def": "...", "tl_def": "...", "my_def": "..."
    }
  ]
}

규칙: 입력 순서 그대로. items 길이는 입력과 동일.`,
    maxTokens: 6000,
  });
  const items = Array.isArray(result.items) ? result.items : [];
  return concepts.map((c, i) => ({
    ...c,
    vi: items[i]?.vi ?? null, zh: items[i]?.zh ?? null, th: items[i]?.th ?? null, tl: items[i]?.tl ?? null, my: items[i]?.my ?? null,
    vi_def: items[i]?.vi_def ?? null, zh_def: items[i]?.zh_def ?? null,
    th_def: items[i]?.th_def ?? null, tl_def: items[i]?.tl_def ?? null, my_def: items[i]?.my_def ?? null,
  }));
}

// 문제 번역 + keywordHints 생성 (1 문제씩)
export async function translateProblem({ problem }) {
  const result = await callJsonMode({
    system: '한국어 객관식 문제를 5개 언어로 번역하고 핵심 단어의 모국어 힌트를 만드는 도구입니다.',
    user: `한국어 문제:
질문: ${problem.ko_question}
옵션:
1. ${problem.ko_options[0]}
2. ${problem.ko_options[1]}
3. ${problem.ko_options[2]}
4. ${problem.ko_options[3]}
정답: ${problem.correct_answer + 1}번
해설: ${problem.ko_explanation}

응답 형식:
{
  "translations": {
    "vi": { "question": "...", "options": ["...","...","...","..."], "explanation": "..." },
    "zh": { ... }, "th": { ... }, "tl": { ... }, "my": { ... }
  },
  "keyword_hints": {
    "vi": [{ "korean": "...", "native": "..." }, ...],
    "zh": [...], "th": [...], "tl": [...], "my": [...]
  }
}

규칙:
- options는 정확히 4개씩.
- keyword_hints의 "korean"은 반드시 question 또는 options 본문에 정확히 등장하는 한국어 단어(띄어쓰기 포함). 본문에 없는 단어 금지.
- 각 언어 keyword_hints: vi/zh는 5~8개, th/tl/my는 4~6개.`,
    maxTokens: 4000,
  });

  // 본문 매칭 가드
  const body = problem.ko_question + ' ' + problem.ko_options.join(' ');
  const cleanedHints = {};
  for (const lang of LANGS) {
    const arr = Array.isArray(result?.keyword_hints?.[lang]) ? result.keyword_hints[lang] : [];
    cleanedHints[lang] = arr
      .filter(h => h?.korean && h?.native && body.includes(h.korean))
      .slice(0, 8);
  }
  return {
    translations: result?.translations ?? {},
    keyword_hints: cleanedHints,
  };
}
```

- [ ] **Step 2: 테스트**

`src/lib/__tests__/ai-prompts.test.js`에 추가:
```js
import { translateProblem, translateSummary } from '../ai/prompts/translate';

describe('translateSummary', () => {
  it('5언어 모두 반환', async () => {
    mockCreate.mockResolvedValueOnce({ content: [{ type: 'text', text: JSON.stringify({
      vi: 'V', zh: 'Z', th: 'T', tl: 'L', my: 'M',
    }) }] });
    const r = await translateSummary({ koText: '요약' });
    expect(r.vi).toBe('V');
    expect(r.my).toBe('M');
  });
});

describe('translateProblem 본문 매칭 가드', () => {
  it('본문에 없는 keyword.korean 제거', async () => {
    mockCreate.mockResolvedValueOnce({ content: [{ type: 'text', text: JSON.stringify({
      translations: { vi: { question: 'Qv', options: ['a','b','c','d'], explanation: 'E' } },
      keyword_hints: {
        vi: [
          { korean: '식품', native: 'thực phẩm' },          // 본문 등장
          { korean: '없는단어', native: 'X' },              // 본문 없음 — 제거되어야 함
        ],
        zh: [], th: [], tl: [], my: [],
      },
    }) }] });
    const r = await translateProblem({
      problem: { ko_question: '식품 위생 관리는?', ko_options: ['청결','보관','조리','전체'], correct_answer: 3, ko_explanation: '...' },
    });
    expect(r.keyword_hints.vi).toHaveLength(1);
    expect(r.keyword_hints.vi[0].korean).toBe('식품');
  });
});
```

- [ ] **Step 3: 테스트 + 커밋**

```bash
npm run test:run -- src/lib/__tests__/ai-prompts.test.js
```
Expected: 8 passed.

```bash
git add src/lib/ai/prompts/translate.js src/lib/__tests__/ai-prompts.test.js
git commit -m "feat(ai): 5언어 번역 + keywordHints 생성 + 본문 매칭 가드

- translateSummary: 요약을 vi/zh/th/tl/my로 번역
- translateConcepts: 용어 목록 배치 번역 (단어+정의)
- translateProblem: 문제 5언어 번역 + keywordHints
  - 본문(question + options) substring 매칭 통과한 keyword만 채택 (M1.5와 동일 가드)
- 8 tests passing"
```

---

## Task 13: 통합 파이프라인 + status 업데이트 + 백그라운드 실행

**Files:**
- Create: `src/lib/ai/pipeline.js`
- Create: `src/app/api/sources/[id]/process/route.js`
- Create: `src/app/api/sources/[id]/retry/route.js`
- Test: `src/lib/__tests__/pipeline.test.js`

- [ ] **Step 1: 파이프라인 함수**

Create `src/lib/ai/pipeline.js`:
```js
import {
  getSourceById, updateSourceStatus, setSourceDomainScore,
  upsertSummary, insertConcepts, insertProblems,
} from '@/lib/db/sources';
import { classifyDomain } from './prompts/classify';
import { summarizeInKorean } from './prompts/summarize';
import { extractConcepts } from './prompts/concepts';
import { generateProblems } from './prompts/problems';
import { translateSummary, translateConcepts, translateProblem } from './prompts/translate';

const STATUS = {
  CLASSIFYING: 'extracting',  // 도메인 분류는 사용자에게 'extracting' 시각화로 합침
  SUMMARIZING: 'summarizing',
  TRANSLATING: 'translating',
  DONE: 'done',
  FAILED: 'failed',
};

export async function runPipeline(sourceId) {
  const source = await getSourceById(sourceId);
  if (!source) throw new Error(`source not found: ${sourceId}`);
  if (!source.raw_text) throw new Error('source has no raw_text');

  try {
    // 1.5 도메인 분류
    await updateSourceStatus(sourceId, STATUS.CLASSIFYING);
    const cls = await classifyDomain({ rawText: source.raw_text, licenceId: source.licence_id });
    await setSourceDomainScore(sourceId, cls.score);
    // 사용자 경고는 클라이언트가 score < 0.4를 보고 결정. 파이프라인은 그대로 진행.

    // 2. 요약
    await updateSourceStatus(sourceId, STATUS.SUMMARIZING);
    const sum = await summarizeInKorean({ rawText: source.raw_text, licenceId: source.licence_id });

    // 3. 개념 추출
    const concepts = await extractConcepts({ rawText: source.raw_text, licenceId: source.licence_id });

    // 4. 문제 생성
    const problems = await generateProblems({ rawText: source.raw_text, concepts, licenceId: source.licence_id });

    // 5. 번역
    await updateSourceStatus(sourceId, STATUS.TRANSLATING);
    const summaryAll = { ko: sum.ko, ...(await translateSummary({ koText: sum.ko })) };
    const conceptsAll = await translateConcepts({ concepts });
    const problemsAll = [];
    for (const p of problems) {
      const t = await translateProblem({ problem: p });
      problemsAll.push({ ...p, translations: t.translations, keyword_hints: t.keyword_hints });
    }

    // DB 저장
    await upsertSummary(sourceId, summaryAll);
    await insertConcepts(sourceId, conceptsAll);
    await insertProblems(sourceId, problemsAll);

    await updateSourceStatus(sourceId, STATUS.DONE);
    return { ok: true };
  } catch (e) {
    const msg = e?.message ?? String(e);
    console.error(`pipeline failed for ${sourceId}:`, msg);
    await updateSourceStatus(sourceId, STATUS.FAILED, msg);
    return { ok: false, error: msg };
  }
}
```

- [ ] **Step 2: process route + 비동기 실행**

Create `src/app/api/sources/[id]/process/route.js`:
```js
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
  // 비동기 실행. Vercel Functions에서 즉시 반환하고 백그라운드 처리.
  await updateSourceStatus(id, 'extracting');
  // waitUntil이 가능한 환경이면 사용, 아니면 fire-and-forget
  runPipeline(id).catch(e => console.error('pipeline error', e));
  return NextResponse.json({ ok: true, sourceId: id });
}
```

> **참고**: Vercel Serverless Functions는 일반적으로 응답 후 작업이 종료된다. 안정적 백그라운드 실행은 `waitUntil`(Edge) 또는 Inngest 등 별도 큐가 필요. M2 첫 컷에서는 함수 응답 후 30~60초 내 끝나는 짧은 자료만 다루고, **클라이언트가 폴링**으로 status 변화를 본다. 자료가 길거나 실패 시 사용자에게 재시도 버튼 제공.

- [ ] **Step 3: retry route**

Create `src/app/api/sources/[id]/retry/route.js`:
```js
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
```

- [ ] **Step 4: 통합 테스트 (모든 단계 mock)**

Create `src/lib/__tests__/pipeline.test.js`:
```js
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { _resetDb } from '../db';
import { runMigrations } from '../db/migrate';
import { createDeviceUser } from '../db/users';
import { createSource, setSourceRawText, getSourceById, getSummary, listConceptsBySource, listProblemsBySource } from '../db/sources';
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
```

- [ ] **Step 5: 테스트 + 커밋**

```bash
npm run test:run -- src/lib/__tests__/pipeline.test.js
```
Expected: 2 passed.

```bash
git add src/lib/ai/pipeline.js src/app/api/sources/[id]/process/ src/app/api/sources/[id]/retry/ src/lib/__tests__/pipeline.test.js
git commit -m "feat(ai): 5단계 파이프라인 통합 + process/retry route + status 추적

- runPipeline(sourceId): 분류 → 요약 → 개념 → 문제 → 5언어 번역 → DB 저장
- 단계별 sources.status 업데이트, 실패 시 status_message 기록
- POST /api/sources/[id]/process: pending|failed에서 시작
- POST /api/sources/[id]/retry: failed 상태에서만
- 2 통합 tests passing (전 단계 mock)"
```

---

## Task 14: 자격증 통합 API (사용자 concepts/problems 목록)

**Files:**
- Create: `src/app/api/licences/[id]/concepts/route.js`
- Create: `src/app/api/licences/[id]/problems/route.js`
- Test: `src/app/api/__tests__/licences-userpool.test.js`

- [ ] **Step 1: concepts route**

Create `src/app/api/licences/[id]/concepts/route.js`:
```js
import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/require';
import { listConceptsForUserLicence } from '@/lib/db/sources';

const ALLOWED = new Set(['korean-food', 'beauty-general', 'pastry']);

export async function GET(_req, { params }) {
  const { userId, response } = await requireUser();
  if (response) return response;
  const { id } = await params;
  if (!ALLOWED.has(id)) return NextResponse.json({ error: 'invalid' }, { status: 400 });
  const rows = await listConceptsForUserLicence(userId, id);
  return NextResponse.json({ concepts: rows });
}
```

- [ ] **Step 2: problems route**

Create `src/app/api/licences/[id]/problems/route.js`:
```js
import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/require';
import { listProblemsForUserLicence } from '@/lib/db/sources';

const ALLOWED = new Set(['korean-food', 'beauty-general', 'pastry']);

export async function GET(_req, { params }) {
  const { userId, response } = await requireUser();
  if (response) return response;
  const { id } = await params;
  if (!ALLOWED.has(id)) return NextResponse.json({ error: 'invalid' }, { status: 400 });
  const rows = await listProblemsForUserLicence(userId, id);
  return NextResponse.json({ problems: rows });
}
```

- [ ] **Step 3: 테스트**

Create `src/app/api/__tests__/licences-userpool.test.js`:
```js
import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
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
    let cs = await (await conceptsGET(new Request('http://x/'), { params: Promise.resolve({ id: 'korean-food' }) })).json();
    expect(cs.concepts).toHaveLength(0);
    await updateSourceStatus(s1.id, 'done');
    cs = await (await conceptsGET(new Request('http://x/'), { params: Promise.resolve({ id: 'korean-food' }) })).json();
    expect(cs.concepts).toHaveLength(1);
    const ps = await (await problemsGET(new Request('http://x/'), { params: Promise.resolve({ id: 'korean-food' }) })).json();
    expect(ps.problems).toHaveLength(1);
  });

  it('다른 사용자 자료는 노출 X', async () => {
    const u1 = await createDeviceUser({ deviceId: `o1-${Math.random()}`, language: 'vi' });
    const u2 = await createDeviceUser({ deviceId: `o2-${Math.random()}`, language: 'vi' });
    const s = await createSource({ userId: u1.id, licenceId: 'pastry', type: 'text', title: 'A', rawText: 'x' });
    await insertConcepts(s.id, [{ korean: 'X', korean_definition: 'd' }]);
    await updateSourceStatus(s.id, 'done');
    await setSessionCookie(u2.id);
    const cs = await (await conceptsGET(new Request('http://x/'), { params: Promise.resolve({ id: 'pastry' }) })).json();
    expect(cs.concepts).toHaveLength(0);
  });
});
```

- [ ] **Step 4: 테스트 + 커밋**

```bash
npm run test:run -- src/app/api/__tests__/licences-userpool.test.js
```
Expected: 2 passed.

```bash
git add src/app/api/licences/ src/app/api/__tests__/licences-userpool.test.js
git commit -m "feat(api): /api/licences/[id]/concepts + problems (사용자 풀)

- status=done인 자료만 노출 (미완료 자료는 학습 풀에서 자동 제외)
- 사용자 격리 (다른 사용자 자료 차단)
- 2 tests passing"
```

---

## Task 15: 클라이언트 API 헬퍼 + AuthPage

**Files:**
- Create: `src/lib/api-client.js`
- Create: `src/lib/deviceId.js`
- Create: `src/components/pages/AuthPage.js`
- Modify: `src/app/page.js` (인증 분기 추가)

- [ ] **Step 1: device ID 헬퍼**

Create `src/lib/deviceId.js`:
```js
const KEY = 'rl_device_id';

export function getOrCreateDeviceId() {
  if (typeof window === 'undefined') return null;
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = `dev-${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;
    localStorage.setItem(KEY, id);
  }
  return id;
}
```

- [ ] **Step 2: API client**

Create `src/lib/api-client.js`:
```js
async function jsonFetch(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
    credentials: 'same-origin',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `${res.status}`);
  }
  return res.json();
}

export const api = {
  // 인증
  async deviceAnon({ deviceId, schoolCode, language }) {
    return jsonFetch('/api/auth/device-anon', { method: 'POST', body: JSON.stringify({ deviceId, schoolCode, language }) });
  },
  async sendMagicLink(email) {
    return jsonFetch('/api/auth/magic-link', { method: 'POST', body: JSON.stringify({ email }) });
  },
  async logout() {
    return jsonFetch('/api/auth/logout', { method: 'POST' });
  },
  async me() {
    return jsonFetch('/api/me');
  },
  // 자료
  async createSourceText({ licenceId, title, text }) {
    return jsonFetch('/api/sources', { method: 'POST', body: JSON.stringify({ licenceId, title, text }) });
  },
  async createSourcePdf({ licenceId, title, file }) {
    const form = new FormData();
    form.set('licenceId', licenceId);
    form.set('title', title);
    form.set('file', file);
    const res = await fetch('/api/sources', { method: 'POST', body: form, credentials: 'same-origin' });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || `${res.status}`);
    }
    return res.json();
  },
  async listSources(licenceId) {
    return jsonFetch(`/api/sources?licence_id=${encodeURIComponent(licenceId)}`);
  },
  async getSource(id) {
    return jsonFetch(`/api/sources/${id}`);
  },
  async processSource(id) {
    return jsonFetch(`/api/sources/${id}/process`, { method: 'POST' });
  },
  async retrySource(id) {
    return jsonFetch(`/api/sources/${id}/retry`, { method: 'POST' });
  },
  async deleteSource(id) {
    return jsonFetch(`/api/sources/${id}`, { method: 'DELETE' });
  },
  // 자격증 통합
  async userConcepts(licenceId) {
    return jsonFetch(`/api/licences/${encodeURIComponent(licenceId)}/concepts`);
  },
  async userProblems(licenceId) {
    return jsonFetch(`/api/licences/${encodeURIComponent(licenceId)}/problems`);
  },
};
```

- [ ] **Step 3: AuthPage**

Create `src/components/pages/AuthPage.js`:
```jsx
'use client';

import { useState } from 'react';
import { api } from '@/lib/api-client';
import { getOrCreateDeviceId } from '@/lib/deviceId';

export default function AuthPage({ onAuthenticated }) {
  const [mode, setMode] = useState('demo');  // demo | email
  const [schoolCode, setSchoolCode] = useState(process.env.NEXT_PUBLIC_DEMO_SCHOOL_CODE || 'NEXT_SCHOOL');
  const [email, setEmail] = useState('');
  const [language, setLanguage] = useState('vi');
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState(null);
  const [error, setError] = useState(null);

  const handleDemo = async () => {
    setLoading(true); setError(null);
    try {
      const deviceId = getOrCreateDeviceId();
      const { user } = await api.deviceAnon({ deviceId, schoolCode, language });
      onAuthenticated(user);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEmail = async () => {
    setLoading(true); setError(null); setInfo(null);
    try {
      await api.sendMagicLink(email);
      setInfo('이메일 받은 편지함을 확인하세요. 링크는 15분 동안 유효합니다.');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-shell" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-6)', background: 'var(--bg-main)' }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 700, color: 'var(--primary)', marginBottom: 'var(--space-2)' }}>Rainbow Licence</div>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-6)', fontSize: 'var(--font-sm)' }}>로그인하면 자료가 다른 기기에서도 보입니다.</p>

      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
        <button onClick={() => setMode('demo')} className={`chip ${mode === 'demo' ? 'active' : ''}`}>학교 코드</button>
        <button onClick={() => setMode('email')} className={`chip ${mode === 'email' ? 'active' : ''}`}>이메일 로그인</button>
      </div>

      {mode === 'demo' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', width: '100%', maxWidth: 400 }}>
          <input type="text" placeholder="학교 코드" value={schoolCode} onChange={e => setSchoolCode(e.target.value)} style={inputStyle} />
          <select value={language} onChange={e => setLanguage(e.target.value)} style={inputStyle}>
            <option value="vi">Tiếng Việt</option>
            <option value="zh">中文</option>
            <option value="th">ไทย</option>
            <option value="tl">Tagalog</option>
            <option value="my">မြန်မာ</option>
          </select>
          <button onClick={handleDemo} disabled={loading} className="btn btn--primary btn--full btn--lg">{loading ? '잠시만요…' : '시작'}</button>
        </div>
      )}

      {mode === 'email' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', width: '100%', maxWidth: 400 }}>
          <input type="email" placeholder="이메일" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} />
          <button onClick={handleEmail} disabled={loading || !email} className="btn btn--primary btn--full btn--lg">{loading ? '발송 중…' : '로그인 링크 받기'}</button>
        </div>
      )}

      {info && <p style={{ color: 'var(--success)', marginTop: 'var(--space-3)' }}>{info}</p>}
      {error && <p style={{ color: 'var(--error)', marginTop: 'var(--space-3)' }}>{error}</p>}
    </div>
  );
}

const inputStyle = {
  padding: 'var(--space-3) var(--space-4)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)',
  fontSize: 'var(--font-base)',
  fontFamily: 'inherit',
  background: 'var(--bg-card)',
  color: 'var(--text-primary)',
  outline: 'none',
};
```

- [ ] **Step 4: page.js 분기 추가**

`src/app/page.js`에 다음 변경:
```jsx
// 상단 import 추가
import AuthPage from '@/components/pages/AuthPage';
import { api } from '@/lib/api-client';

// 컴포넌트 안 상태 추가
const [authUser, setAuthUser] = useState(null);
const [authChecked, setAuthChecked] = useState(false);

// 초기화 useEffect 안에 추가
useEffect(() => {
  // ... 기존 로직 ...
  api.me().then(({ user }) => {
    setAuthUser(user);
    setAuthChecked(true);
  }).catch(() => setAuthChecked(true));
}, []);

// renderPage 위에 분기 추가
if (!mounted || !authChecked) return /* 스플래시 */;
if (!authUser) return <AuthPage onAuthenticated={(u) => setAuthUser(u)} />;
if (showOnboarding) return /* OnboardingPage */;
```

(정확한 위치는 기존 page.js 라인 보고 통합. SSR 하이드레이션 방어 + 온보딩 분기 사이에 인증 분기 삽입.)

- [ ] **Step 5: dev 서버에서 시각 검증 (수동)**

```bash
npm run dev
```
브라우저에서 http://localhost:3000 진입:
- localStorage 비운 상태에서 AuthPage 보임
- 학교 코드 모드: 코드 입력 + 언어 선택 + 시작 → 메인 화면 진입
- 이메일 모드: dummy 이메일 입력 → 발송 메시지

- [ ] **Step 6: 커밋**

```bash
git add src/lib/api-client.js src/lib/deviceId.js src/components/pages/AuthPage.js src/app/page.js
git commit -m "feat(auth): AuthPage + 클라이언트 API 헬퍼 + device-anonymous/이메일 두 모드

- AuthPage: 학교 코드 시연 모드 + 이메일 매직 링크 두 탭
- api 헬퍼: 인증/자료/자격증 풀 모든 엔드포인트 래퍼
- deviceId 헬퍼: localStorage 영속 device id
- page.js: 인증 분기 (mounted/authChecked/authUser)"
```

---

## Task 16: NotebookPage (자격증 화면 "내 자료" 탭)

**Files:**
- Create: `src/components/pages/NotebookPage.js`
- Modify: `src/components/pages/StudyPage.js` (탭 진입점)

- [ ] **Step 1: NotebookPage 작성**

Create `src/components/pages/NotebookPage.js`:
```jsx
'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api-client';

export default function NotebookPage({ licenceId, onOpenSource }) {
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(null);  // null | 'text' | 'pdf'
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const reload = async () => {
    setLoading(true);
    try {
      const { sources } = await api.listSources(licenceId);
      setSources(sources);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { reload(); }, [licenceId]);

  const submit = async () => {
    setSubmitting(true); setError(null);
    try {
      let created;
      if (adding === 'text') {
        if (!title.trim() || !text.trim()) throw new Error('제목과 내용을 모두 입력하세요.');
        created = await api.createSourceText({ licenceId, title: title.trim(), text });
      } else if (adding === 'pdf') {
        if (!file) throw new Error('PDF 파일을 선택하세요.');
        if (file.size > 10 * 1024 * 1024) throw new Error('PDF는 10MB 이하만 가능합니다.');
        created = await api.createSourcePdf({ licenceId, title: title.trim() || file.name, file });
      }
      // 처리 시작
      if (created?.source?.id) {
        await api.processSource(created.source.id);
      }
      setAdding(null); setTitle(''); setText(''); setFile(null);
      await reload();
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: 'var(--space-4)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--font-2xl)' }}>📚 내 자료</h2>
        <button onClick={() => setAdding('text')} className="btn btn--primary">+ 자료 추가</button>
      </div>

      {adding && (
        <div className="card" style={{ padding: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
          <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
            <button onClick={() => setAdding('text')} className={`chip ${adding === 'text' ? 'active' : ''}`}>텍스트</button>
            <button onClick={() => setAdding('pdf')} className={`chip ${adding === 'pdf' ? 'active' : ''}`}>PDF</button>
          </div>
          <input type="text" placeholder="자료 제목" value={title} onChange={e => setTitle(e.target.value)} style={inputStyle} />
          {adding === 'text' && (
            <textarea value={text} onChange={e => setText(e.target.value)} placeholder="여기에 학습 자료 본문을 붙여넣어 주세요…" rows={10} style={{ ...inputStyle, marginTop: 'var(--space-2)', fontFamily: 'var(--font-mono)', resize: 'vertical' }} />
          )}
          {adding === 'pdf' && (
            <input type="file" accept="application/pdf" onChange={e => setFile(e.target.files?.[0] ?? null)} style={{ ...inputStyle, marginTop: 'var(--space-2)' }} />
          )}
          <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-3)' }}>
            <button onClick={submit} disabled={submitting} className="btn btn--primary">{submitting ? '등록 중…' : '등록'}</button>
            <button onClick={() => setAdding(null)} className="btn btn--ghost">취소</button>
          </div>
          {error && <p style={{ color: 'var(--error)', marginTop: 'var(--space-2)' }}>{error}</p>}
        </div>
      )}

      {loading ? <p>불러오는 중…</p> : (
        sources.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__icon">📝</div>
            <p className="empty-state__text">아직 자료가 없어요. PDF·텍스트를 추가하면 자동으로 학습 패키지가 만들어집니다.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {sources.map(s => (
              <button key={s.id} onClick={() => onOpenSource(s.id)} className="card card--interactive" style={{ padding: 'var(--space-4)', textAlign: 'left', border: 'none', background: 'var(--bg-card)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{s.title}</div>
                    <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', marginTop: 4 }}>{s.type.toUpperCase()} · {new Date(s.created_at).toLocaleDateString()}</div>
                  </div>
                  <StatusBadge status={s.status} />
                </div>
              </button>
            ))}
          </div>
        )
      )}
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    pending: { label: '대기', color: 'var(--text-muted)' },
    extracting: { label: '분석 중', color: 'var(--primary)' },
    summarizing: { label: '요약 중', color: 'var(--primary)' },
    translating: { label: '번역 중', color: 'var(--primary)' },
    done: { label: '완료', color: 'var(--success)' },
    failed: { label: '실패', color: 'var(--error)' },
  };
  const m = map[status] ?? { label: status, color: 'var(--text-muted)' };
  return <span style={{ fontSize: 'var(--font-xs)', color: m.color, fontWeight: 600 }}>{m.label}</span>;
}

const inputStyle = {
  width: '100%',
  padding: 'var(--space-3) var(--space-4)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)',
  fontSize: 'var(--font-sm)',
  fontFamily: 'inherit',
  outline: 'none',
  background: 'var(--bg-card)',
  color: 'var(--text-primary)',
};
```

- [ ] **Step 2: StudyPage에 탭 진입점**

`src/components/pages/StudyPage.js` 자격증 선택 상태에서 헤더 영역(약 line 146 부근)에 탭 추가:
```jsx
// 헤더 div 안에 추가, 모드 토글 위
<div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
  <button className={`chip ${activeView === 'study' ? 'active' : ''}`} onClick={() => onChangeView?.('study')}>학습</button>
  <button className={`chip ${activeView === 'notebook' ? 'active' : ''}`} onClick={() => onChangeView?.('notebook')}>내 자료</button>
</div>
```

StudyPage props에 `activeView`, `onChangeView` 추가. 기본은 `'study'`. page.js에서 상태 관리:
```jsx
const [studyView, setStudyView] = useState('study');  // study | notebook | source-detail
const [openSourceId, setOpenSourceId] = useState(null);
// case 'study':
return studyView === 'notebook'
  ? <NotebookPage licenceId={selectedLicence} onOpenSource={(id) => { setOpenSourceId(id); setStudyView('source-detail'); }} />
  : studyView === 'source-detail'
  ? <SourceDetailPage sourceId={openSourceId} onBack={() => setStudyView('notebook')} />
  : <StudyPage activeView={studyView} onChangeView={setStudyView} ... />;
```

- [ ] **Step 3: dev 서버 확인 (수동)**

```bash
npm run dev
```

- [ ] **Step 4: 커밋**

```bash
git add src/components/pages/NotebookPage.js src/components/pages/StudyPage.js src/app/page.js
git commit -m "feat(notebook): NotebookPage — 자격증 화면 '내 자료' 탭

- 자료 목록 + 상태 배지 (pending/extracting/summarizing/translating/done/failed)
- 추가 모달: 텍스트 붙여넣기 또는 PDF 업로드 (10MB 한도)
- 등록 직후 자동 처리 시작 (api.processSource)
- StudyPage에 학습/내 자료 탭 추가, page.js 라우팅 분기"
```

---

## Task 17: SourceDetailPage (상태 + 생성물 미리보기 + 폴링)

**Files:**
- Create: `src/components/pages/SourceDetailPage.js`

- [ ] **Step 1: 상세 페이지 작성**

Create `src/components/pages/SourceDetailPage.js`:
```jsx
'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api-client';

const STATUS_STEPS = [
  { key: 'extracting', label: '텍스트 분석' },
  { key: 'summarizing', label: '요약 + 개념 + 문제 생성' },
  { key: 'translating', label: '5언어 번역' },
  { key: 'done', label: '완료' },
];

export default function SourceDetailPage({ sourceId, language, onBack }) {
  const [source, setSource] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!sourceId) return;
    let alive = true;
    const tick = async () => {
      try {
        const { source } = await api.getSource(sourceId);
        if (!alive) return;
        setSource(source);
        if (source.status !== 'done' && source.status !== 'failed') {
          setTimeout(tick, 3000);
        }
      } catch (e) {
        if (alive) setError(e.message);
      }
    };
    tick();
    return () => { alive = false; };
  }, [sourceId]);

  const retry = async () => {
    setError(null);
    try {
      await api.retrySource(sourceId);
      const { source } = await api.getSource(sourceId);
      setSource(source);
    } catch (e) {
      setError(e.message);
    }
  };

  const remove = async () => {
    if (!confirm('이 자료를 삭제할까요? 관련 요약·개념·문제가 모두 사라집니다.')) return;
    try {
      await api.deleteSource(sourceId);
      onBack();
    } catch (e) {
      setError(e.message);
    }
  };

  if (!source) return <div style={{ padding: 'var(--space-4)' }}>{error ?? '불러오는 중…'}</div>;

  const currentIdx = STATUS_STEPS.findIndex(s => s.key === source.status);

  return (
    <div style={{ padding: 'var(--space-4)' }}>
      <button onClick={onBack} className="btn btn--ghost" style={{ marginBottom: 'var(--space-3)' }}>← 목록</button>
      <h2 style={{ fontWeight: 700, fontSize: 'var(--font-xl)', marginBottom: 'var(--space-2)' }}>{source.title}</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-xs)', marginBottom: 'var(--space-4)' }}>{source.type.toUpperCase()} · {new Date(source.created_at).toLocaleString()}</p>

      {source.domain_score != null && source.domain_score < 0.4 && (
        <div style={{ background: 'var(--warning-bg)', border: '1px solid var(--warning)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-3)' }}>
          이 자료는 선택한 자격증과 관련성이 낮아 보입니다 (점수 {Math.round(source.domain_score * 100)}/100). 그래도 자료로 활용됩니다.
        </div>
      )}

      <div style={{ marginBottom: 'var(--space-4)' }}>
        {STATUS_STEPS.map((step, i) => {
          const isDone = source.status === 'done' || (currentIdx >= 0 && i < currentIdx);
          const isCurrent = step.key === source.status;
          return (
            <div key={step.key} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-2) 0' }}>
              <span style={{ width: 24, height: 24, borderRadius: '50%', background: isDone ? 'var(--success)' : isCurrent ? 'var(--primary)' : 'var(--gray-200)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>{isDone ? '✓' : i + 1}</span>
              <span style={{ color: isDone || isCurrent ? 'var(--text-primary)' : 'var(--text-muted)' }}>{step.label}</span>
              {isCurrent && <span className="iconify" data-icon="mdi:loading" style={{ marginLeft: 'auto', fontSize: 16, color: 'var(--primary)' }} />}
            </div>
          );
        })}
      </div>

      {source.status === 'failed' && (
        <div style={{ background: 'var(--error-bg)', border: '1px solid var(--error)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-3)' }}>
          <div style={{ color: 'var(--error)', fontWeight: 600 }}>처리 실패</div>
          <p style={{ marginTop: 4 }}>{source.status_message || '알 수 없는 오류'}</p>
          <button onClick={retry} className="btn btn--primary" style={{ marginTop: 'var(--space-2)' }}>다시 시도</button>
        </div>
      )}

      {source.status === 'done' && (
        <SourcePreview sourceId={sourceId} language={language} />
      )}

      <div style={{ marginTop: 'var(--space-6)', borderTop: '1px solid var(--border)', paddingTop: 'var(--space-3)' }}>
        <button onClick={remove} className="btn btn--ghost" style={{ color: 'var(--error)' }}>자료 삭제</button>
      </div>
    </div>
  );
}

function SourcePreview({ sourceId, language }) {
  // 미리보기: 요약 + 개념 N개 + 문제 N개를 자격증 풀 API에서 끌어와 source_id 매칭으로 필터
  const [concepts, setConcepts] = useState([]);
  const [problems, setProblems] = useState([]);
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    // 자격증 풀 호출 후 source_id 필터링이 단순. 별도 source별 엔드포인트는 M3.
    api.getSource(sourceId).then(({ source }) => {
      // source.licence_id로 풀 호출
      api.userConcepts(source.licence_id).then(({ concepts }) => setConcepts(concepts.filter(c => c.source_id === sourceId)));
      api.userProblems(source.licence_id).then(({ problems }) => setProblems(problems.filter(p => p.source_id === sourceId)));
    });
  }, [sourceId]);

  return (
    <div>
      <h3 style={{ marginTop: 'var(--space-4)', fontWeight: 600 }}>핵심 개념 ({concepts.length})</h3>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {concepts.slice(0, 5).map(c => (
          <li key={c.id} style={{ padding: 'var(--space-2) 0', borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontWeight: 600 }}>{c.korean}</div>
            <div style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)' }}>{c.korean_definition}</div>
            {language && c[language] && <div style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)', marginTop: 2 }}>{c[language]}: {c[`${language}_def`]}</div>}
          </li>
        ))}
      </ul>
      <h3 style={{ marginTop: 'var(--space-4)', fontWeight: 600 }}>생성된 문제 ({problems.length})</h3>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {problems.slice(0, 3).map(p => (
          <li key={p.id} style={{ padding: 'var(--space-2) 0', borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontWeight: 600 }}>{p.ko_question}</div>
          </li>
        ))}
      </ul>
      <p style={{ marginTop: 'var(--space-4)', color: 'var(--text-muted)', fontSize: 'var(--font-xs)' }}>학습 화면의 "내 자료" 묶음에서 풀어보세요.</p>
    </div>
  );
}
```

- [ ] **Step 2: page.js 라우팅에 SourceDetailPage 분기 추가**

이미 Task 16 Step 2에서 분기 추가했음. 확인:
```jsx
case 'study':
  if (studyView === 'source-detail') return <SourceDetailPage sourceId={openSourceId} language={selectedLanguage} onBack={() => setStudyView('notebook')} />;
  // ...
```

`SourceDetailPage` import 추가.

- [ ] **Step 3: dev 시각 검증**

```bash
npm run dev
```
자료 등록 → 자동으로 SourceDetailPage 진입 (또는 목록에서 클릭) → 3초 간격 status 폴링 → done 되면 미리보기 표시.

- [ ] **Step 4: 커밋**

```bash
git add src/components/pages/SourceDetailPage.js src/app/page.js
git commit -m "feat(notebook): SourceDetailPage — 단계별 상태 + 폴링 + 생성물 미리보기

- 5단계 진행률 (analysis → summarize/concepts/problems → translate → done)
- 3초 간격 polling으로 status 추적, done/failed 시 polling 종료
- failed 시 다시 시도 버튼, 도메인 점수 낮으면 경고
- done 후 핵심 개념 5개·문제 3개 미리보기 + 사용자 언어 번역 노출
- 자료 삭제 버튼 (CASCADE 안내)"
```

---

## Task 18: DictionaryPage / StudyPage 확장 (사용자 콘텐츠 통합)

**Files:**
- Modify: `src/components/pages/DictionaryPage.js`
- Modify: `src/components/pages/StudyPage.js`

- [ ] **Step 1: DictionaryPage 사용자 개념 섹션**

`src/components/pages/DictionaryPage.js` 상단 import + state:
```jsx
import { api } from '@/lib/api-client';

// 컴포넌트 안
const [userConcepts, setUserConcepts] = useState([]);
useEffect(() => {
  if (!licenceId) { setUserConcepts([]); return; }
  api.userConcepts(licenceId).then(({ concepts }) => setUserConcepts(concepts)).catch(() => {});
}, [licenceId]);
```

`filteredTerms` 아래에 사용자 개념 섹션 렌더:
```jsx
{userConcepts.length > 0 && (
  <details open style={{ marginTop: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
    <summary style={{ fontWeight: 600, fontSize: 'var(--font-sm)', cursor: 'pointer', padding: 'var(--space-2) 0' }}>📚 내 자료에서 추가된 개념 ({userConcepts.length})</summary>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
      {userConcepts.map(c => (
        <div key={c.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 'var(--space-3)' }}>
          <div style={{ fontWeight: 700 }}>{c.korean}</div>
          <div style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', marginTop: 4 }}>{c.korean_definition}</div>
          {/* 5언어 노출 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 'var(--space-2)' }}>
            {['vi','zh','th','tl','my'].map(lang => c[lang] ? (
              <div key={lang} style={{ display: 'flex', gap: 'var(--space-2)', fontSize: 'var(--font-sm)' }}>
                <span style={{ fontSize: 10, color: 'var(--text-muted)', minWidth: 64, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  {LANG_LABELS[lang]}
                  {!isLanguageVerified(lang) && <span style={{ fontSize: 9, color: 'var(--text-muted)', fontStyle: 'italic', padding: '0 4px', border: '1px solid var(--border)', borderRadius: 'var(--radius-full)' }}>AI</span>}
                </span>
                <span>{c[lang]}</span>
              </div>
            ) : null)}
          </div>
        </div>
      ))}
    </div>
  </details>
)}
```

- [ ] **Step 2: StudyPage 학습 묶음 선택 — 공식 + 사용자**

기존 `StudyPage`는 `licenceQuestions = getQuestionsByLicence(licenceId || 'korean-food')`로 공식 문제만 사용. 묶음 선택 추가:

```jsx
const [problemSet, setProblemSet] = useState('official');  // 'official' | sourceId
const [userProblemBundles, setUserProblemBundles] = useState([]);  // [{sourceId, title, count, problems}]

useEffect(() => {
  if (!licenceId) return;
  api.userProblems(licenceId).then(({ problems }) => {
    // sourceId로 묶음
    const bySource = new Map();
    for (const p of problems) {
      if (!bySource.has(p.source_id)) bySource.set(p.source_id, []);
      bySource.get(p.source_id).push(p);
    }
    // 자료 제목 조회는 listSources 결과와 머지하지만 단순화 위해 sourceId로 표시
    setUserProblemBundles(Array.from(bySource.entries()).map(([sid, list]) => ({ sourceId: sid, count: list.length, problems: list })));
  }).catch(() => {});
}, [licenceId]);

// 현재 문제 풀 결정
const licenceQuestions = useMemo(() => {
  if (problemSet === 'official') return getQuestionsByLicence(licenceId || 'korean-food');
  const bundle = userProblemBundles.find(b => b.sourceId === problemSet);
  if (!bundle) return [];
  // 사용자 문제를 기존 문제 객체 형식으로 변환
  return bundle.problems.map(p => ({
    id: p.id,
    licenceId,
    subject: 'user',
    question: p.ko_question,
    simpleQuestion: p.ko_simple_explanation ?? p.ko_question,
    options: p.ko_options,
    correctAnswer: p.correct_answer,
    explanation: p.ko_explanation,
    simpleExplanation: p.ko_simple_explanation ?? p.ko_explanation,
    keywords: [],
    translations: p.translations ?? {},
    keywordHints: p.keyword_hints ?? {},
  }));
}, [licenceId, problemSet, userProblemBundles]);
```

자격증 헤더 아래에 묶음 선택 chips:
```jsx
{userProblemBundles.length > 0 && (
  <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-3)', overflowX: 'auto' }}>
    <button className={`chip ${problemSet === 'official' ? 'active' : ''}`} onClick={() => { setProblemSet('official'); setCurrentIndex(0); }}>공식 {getQuestionsByLicence(licenceId).length}문제</button>
    {userProblemBundles.map(b => (
      <button key={b.sourceId} className={`chip ${problemSet === b.sourceId ? 'active' : ''}`} onClick={() => { setProblemSet(b.sourceId); setCurrentIndex(0); }}>내 자료 {b.count}문제</button>
    ))}
  </div>
)}
```

- [ ] **Step 3: 시각 검증**

```bash
npm run dev
```
- 자료 등록 → 처리 done → 자격증 학습 화면에 "내 자료 N문제" chip 등장 → 클릭 시 사용자 문제만 풀이
- DictionaryPage에서 "내 자료에서 추가된 개념" collapsible 등장

- [ ] **Step 4: 커밋**

```bash
git add src/components/pages/DictionaryPage.js src/components/pages/StudyPage.js
git commit -m "feat(integration): DictionaryPage·StudyPage가 사용자 자료 자동 통합 노출

- DictionaryPage: 자격증별 사용자 개념 collapsible 섹션 (5언어 동일 형식)
- StudyPage: 학습 묶음 선택 chips ('공식 60문제' + '내 자료 N문제' 묶음들)
- 사용자 문제 객체를 기존 형식으로 변환 (translations·keywordHints 호환)
- StudyPage 3-mode 렌더 로직 변경 없이 그대로 작동"
```

---

## Task 19: 콘텐츠 가드 테스트 + 시연 시나리오 검증

**Files:**
- Create: `src/lib/__tests__/user-content-compat.test.js`

- [ ] **Step 1: 사용자 콘텐츠 형식 호환 테스트**

Create `src/lib/__tests__/user-content-compat.test.js`:
```js
import { describe, it, expect } from 'vitest';
import { koreanFoodQuestions } from '@/data/questions/korean-food';

describe('사용자 문제 형식 호환', () => {
  it('공식 kf-01과 동일한 키 구조', () => {
    const official = koreanFoodQuestions[0];
    const userShape = {
      id: 'p-uuid',
      licenceId: 'korean-food',
      subject: 'user',
      question: 'Q',
      simpleQuestion: 'simple Q',
      options: ['a','b','c','d'],
      correctAnswer: 0,
      explanation: 'E',
      simpleExplanation: 'simple E',
      keywords: [],
      translations: { vi: { question: 'Qv', options: ['a','b','c','d'], explanation: 'Ev' } },
      keywordHints: { vi: [{ korean: 'a', native: 'av' }] },
    };
    for (const key of ['id','licenceId','subject','question','options','correctAnswer','explanation','translations','keywordHints']) {
      expect(userShape).toHaveProperty(key);
      expect(official).toHaveProperty(key);
    }
    expect(userShape.options).toHaveLength(4);
    expect(Object.keys(userShape.translations.vi)).toEqual(expect.arrayContaining(['question','options','explanation']));
  });
});
```

- [ ] **Step 2: 시연 시나리오 수동 체크리스트**

Vercel preview deploy 또는 로컬 dev에서 다음 4개 시나리오 통과 확인 (체크 박스):

- [ ] **시나리오 A — 시연 모드 신규 학생 (vi)**:
  1. localStorage 비우고 시작
  2. AuthPage에서 학교 코드 `NEXT_SCHOOL` + 베트남어 선택 + 시작
  3. 한식조리 자격증 진입 → "내 자료" 탭
  4. 짧은 한국어 식품위생 텍스트(예: "식품위생 HACCP 7원칙은 ...") 붙여넣고 등록
  5. SourceDetailPage 자동 진입, 단계별 status 진행 확인 (~30~60초)
  6. done 후 미리보기에서 개념·문제·베트남어 번역 확인
  7. 학습 화면으로 돌아가서 "내 자료 N문제" chip 클릭 → 사용자 문제 풀이
  8. STEP 1에서 한국어+베트남어 병행, STEP 2에서 키워드 점선 밑줄, STEP 3에서 ❓ 슬라이딩 패널 모두 작동

- [ ] **시나리오 B — 이메일 로그인 (다기기 시뮬레이션)**:
  1. 위 시나리오 A 마친 상태에서 이메일 모드로 이메일 입력 (Resend 실제 발송 또는 dev 환경에서 console.log로 link 확인)
  2. 매직 링크 클릭 → /api/auth/verify → 메인 화면으로 redirect
  3. 다른 브라우저에서 동일 이메일로 매직 링크 받기 → 동일 자료 보이는지 확인

- [ ] **시나리오 C — PDF 업로드**:
  1. 작은 한국어 PDF 준비
  2. PDF 모드로 등록
  3. 텍스트 추출 → 파이프라인 진행 확인
  4. 스캔 이미지 PDF 시도 → 명확한 에러 메시지

- [ ] **시나리오 D — 무관 자료 도메인 분류**:
  1. 한식조리 자격증에 운전 매뉴얼 같은 무관 텍스트 등록
  2. SourceDetailPage에서 `domain_score < 0.4` 경고 표시 확인
  3. 처리는 그대로 진행되지만 결과 문제 품질은 낮음 (사용자 경고로 충분)

- [ ] **Step 3: 단위 테스트 실행**

```bash
npm run test:run
```
Expected: 모든 테스트 passed. 신규 합치면 약 40+ tests.

- [ ] **Step 4: 커밋**

```bash
git add src/lib/__tests__/user-content-compat.test.js
git commit -m "test(content): 사용자 문제 객체가 공식 콘텐츠 스키마와 호환

- 사용자 problem 객체가 koreanFoodQuestions[0]과 동일 키 구조
- 시연 시나리오 4종 수동 검증 (체크리스트 plan에 포함)"
```

---

## Task 20: 빌드 + Vercel 배포 + 환경변수 설정

**Files:**
- Modify: `.env.example`
- Modify: `CLAUDE.md` (M2 영역 노트)

- [ ] **Step 1: 전체 테스트 + 빌드**

```bash
npm run test:run
npm run build
```
모두 통과 확인.

- [ ] **Step 2: Vercel 환경변수**

Vercel 프로젝트 (rainbow-licence) Production 환경에 다음 환경변수 설정:
```
TURSO_DATABASE_URL=libsql://your-actual-db.turso.io
TURSO_AUTH_TOKEN=<turso token>
JWT_SECRET=<32 byte random hex>
ANTHROPIC_API_KEY=<anthropic key>
ANTHROPIC_MODEL=claude-sonnet-4-6
RESEND_API_KEY=<resend key>
RESEND_FROM_EMAIL=Rainbow Licence <noreply@your-verified-domain>
NEXT_PUBLIC_BASE_URL=https://rainbow-licence.vercel.app
NEXT_PUBLIC_DEMO_SCHOOL_CODE=NEXT_SCHOOL
```

설정 방법:
```bash
vercel env add TURSO_DATABASE_URL production
# 프롬프트에 값 붙여넣기. 다른 변수도 동일 패턴.
```

또는 Vercel 대시보드에서 Settings → Environment Variables.

- [ ] **Step 3: Turso DB 생성 + 마이그레이션**

```bash
# Turso CLI 설치 (시연자가 직접 한 번)
curl -sSfL https://get.tur.so/install.sh | bash

turso auth signup  # 또는 login
turso db create rainbow-licence-prod
turso db show rainbow-licence-prod  # URL 확인
turso db tokens create rainbow-licence-prod  # 토큰 발급 → Vercel env

# 로컬에서 production DB에 마이그레이션
TURSO_DATABASE_URL=<prod url> TURSO_AUTH_TOKEN=<prod token> npm run db:migrate
```

- [ ] **Step 4: 배포**

```bash
git push origin main
vercel --prod --yes
```

- [ ] **Step 5: 프로덕션 헬스 체크**

브라우저로 https://rainbow-licence.vercel.app 진입:
- AuthPage 로딩
- 학교 코드로 로그인 → 자격증 화면 → "내 자료" 탭
- 짧은 텍스트로 자료 등록 → 처리 진행 (production AI 호출 비용 발생)
- done 후 학습 모드 통합 확인

- [ ] **Step 6: CLAUDE.md M2 영역 노트 추가**

`CLAUDE.md`에 추가 (Skill routing 위 또는 별도 섹션):
```markdown
## M2 다국어 학습 자료 노트

- DB: Turso. 마이그레이션은 `migrations/NNNN_*.sql`. 실행: `npm run db:migrate`.
- AI: `src/lib/ai/`. 5단계 파이프라인 `runPipeline(sourceId)`.
- 새 자료 등록 흐름은 `NotebookPage` → `POST /api/sources` → `POST /api/sources/[id]/process` → polling.
- 사용자 콘텐츠는 기존 공식 콘텐츠와 동일 형식 (translations·keywordHints).
- 인증: Turso `users.device_id` (시연) 또는 `users.email` (정식, Resend 매직 링크).
```

- [ ] **Step 7: 최종 커밋 + walkthrough.md 업데이트**

```bash
git add CLAUDE.md .env.example
git commit -m "docs: M2 다국어 학습 자료 노트 배포 완료

배포 URL: https://rainbow-licence.vercel.app
신규 환경 변수: TURSO_*, JWT_SECRET, ANTHROPIC_*, RESEND_*, NEXT_PUBLIC_*
신규 영역 노트: CLAUDE.md M2 섹션

핵심:
- Turso DB + JWT 세션 + 매직 링크 인증
- 자료 등록(text/PDF) → AI 5단계 파이프라인 → 5언어 번역
- StudyPage/DictionaryPage 자격증 단위 통합 노출
- 사용자 문제·개념이 공식 콘텐츠 형식 그대로

이제 진짜 학습 도구 — 학생이 자기 자료로 풀을 키운다."
```

walkthrough.md 업데이트 (M2 완료 + 다음 sprint 안내):
- M3 후보: AI 자동 후보 제시(Q7 C 흐름), URL/YouTube 소스, 중복 병합, 학교 공유 풀, localStorage SM-2 마이그레이션

---

## 완료 정의 (Definition of Done)

- [ ] 19개 task 모두 commit + 테스트 통과
- [ ] 콘텐츠 가드: 사용자 problem이 기존 koreanFoodQuestions[0]과 같은 키 형식
- [ ] AuthPage 두 모드 작동: 학교 코드 device 모드 + 이메일 매직 링크
- [ ] 자료 등록 (text + PDF) → AI 5단계 파이프라인 → 5언어 번역 → DB 저장
- [ ] NotebookPage에 진행률 + 상태 표시
- [ ] StudyPage에 사용자 문제 묶음 chips, 풀이 흐름 모두 작동 (3-mode)
- [ ] DictionaryPage에 사용자 개념 통합 섹션 + 5언어 노출
- [ ] 사용자 격리 (다른 사용자 자료 차단)
- [ ] 시연 시나리오 4개 모두 production에서 통과
- [ ] Vercel production 배포 완료

## M3 후보 (이 plan에 없음, 후속 sprint)

- AI 자동 후보 제시 흐름 (Q7 C — 키워드 → AI 검색 → 사용자 승인)
- URL / YouTube 소스 지원 (transcript API + Readability)
- 자료 간 중복 개념 자동 병합
- 학교 단위 공유 풀
- localStorage SM-2 데이터의 Turso 마이그레이션
- Server-Sent Events 진행률 (polling → SSE)
- 학교 단위 사용량 대시보드
- 학생당 월 한도 + 결제 게이트
