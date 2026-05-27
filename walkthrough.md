# Rainbow Licence — 세션 핸드오프 (2026-05-28)

> 다음 세션이 시작되면 이 파일부터 읽고 컨텍스트 복원할 것.

## 📊 현재 좌표

**프로젝트**: 한국 국가기술자격증 학습 PWA (다문화 학교 NEXT SCHOOL용 + 공공평가위원 시연).
**프로덕션 URL**: https://rainbow-licence.vercel.app (M1.5 시점 배포본)
**저장소**: https://github.com/caleblee2050/rainbow-licence
**브랜치**: `main` — origin과 동기화 완료 (push 됨, 최신 commit `0355f04`)

## ✅ M2 다국어 학습 자료 노트 — 구현 완료 (2026-05-28)

NotebookLM-스타일 기능. 학생이 PDF/텍스트 자료 등록 → AI가 요약·핵심개념·객관식 문제 자동 생성 → 5언어 번역 → 기존 StudyPage/DictionaryPage에 자격증 단위로 통합 노출.

### 핵심 산출물

- **19 commits** (T1~T19) on `main`, push 완료
- **76 tests passing** (M1.5의 32 → M2의 76)
- 빌드 성공 (Next.js 16.1.6, Turbopack, API routes 11개 + UI page 3개 신규)
- **API routes 신규**:
  - `/api/auth/device-anon`, `/api/auth/magic-link`, `/api/auth/verify`, `/api/auth/logout`, `/api/me`
  - `/api/sources` (POST text/PDF, GET list), `/api/sources/[id]` (GET/DELETE)
  - `/api/sources/[id]/process`, `/api/sources/[id]/retry`
  - `/api/licences/[id]/concepts`, `/api/licences/[id]/problems`
- **UI 신규**: `AuthPage`, `NotebookPage`, `SourceDetailPage`
- **UI 확장**: `DictionaryPage`(사용자 개념 collapsible 섹션), `StudyPage`(학습 묶음 chips)

### 완성된 작업 흐름

| Task | Commit | 비고 |
|------|--------|------|
| T1 Turso DB + users migration | `86be319` + `1e1cb7d` 보정 | code review Important 2건 (__dirname 절대 경로 + db.batch 트랜잭션) |
| T2 JWT 세션 헬퍼 | `1f14572` | jose, HS256, 30일, sameSite=lax |
| T3 device-anonymous 인증 + /api/me | `9fb87f2` | |
| T4 매직 링크 (Resend) | `4f63a6a` | 15분 만료, 1회 사용 |
| T5 sources/summaries/concepts/problems CRUD | `79c8766` | CASCADE DELETE, JSON 직렬화 |
| T6 PDF 파싱 | `2375cad` | pdf-parse `lib/pdf-parse.js` 직접 import + Uint8Array 우회 |
| T7 자료 등록 API | `e9e997d` | multipart + JSON 양쪽 처리 |
| T8 Anthropic 클라이언트 + JSON 모드 | `8c7c3aa` | callJsonMode 1회 재시도 |
| T9 도메인 분류 + 한국어 요약 | `95f1624` | |
| T10 핵심개념 추출 | `b0d0e0c` | 8~15개, 본문 등장 표기 보존 |
| T11 객관식 문제 생성 | `5b7c775` | 5~10문제, 스키마 강제 |
| T12 5언어 번역 + 본문 매칭 가드 | `1470322` | **M1.5에서 수동 보정했던 14+ 패턴을 파이프라인 단계에서 자동 처리** |
| T13 파이프라인 통합 + process/retry | `c0fb272` | runPipeline 5단계 + status 추적 |
| T14 자격증 통합 API | `a4a40a7` | status=done 필터 + 사용자 격리 |
| T15 클라이언트 API + AuthPage | `085c16a` | page.js 인증 분기 |
| T16 NotebookPage | `7e5b3b4` | 자격증 화면 "내 자료" 탭 + chip 진입점 |
| T17 SourceDetailPage + 폴링 | `d59d9a1` | 3s polling, 5단계 진행률, 재시도 |
| T18 Dict/Study 사용자 콘텐츠 통합 | `dcab41a` | 사용자 problem을 기존 형식으로 변환, 3-mode 그대로 작동 |
| T19 콘텐츠 가드 + 시연 시나리오 | `0355f04` | user-content-compat 가드 + `docs/superpowers/plans/2026-05-28-m2-demo-scenarios.md` |

## 🚨 T20 배포 — 미완료, 다음 세션에서 진행

### 남은 작업 (다음 세션 진입 시 즉시 할 일)

#### 1. Turso DB 준비

기존 다른 프로젝트에서 사용했던 **Turso 계정·키가 이미 있을 가능성 큼**. 사용자가 "예전에 다 제공된 것들이 있으니 직접 찾아보고"라고 함. 다음 위치 확인:

- `~/.config/turso/` 또는 `~/.turso/`
- 다른 프로젝트의 `.env.local` (예: 다른 Next.js/PWA 프로젝트들)
- 사용자가 직접 알려주는 값

확인 후 둘 중 하나:
- **기존 DB 재활용**: `rainbow-licence-prod` 또는 유사 이름 검색 (`turso db list`)
- **신규 DB 생성**:
  ```bash
  turso db create rainbow-licence-prod
  turso db show rainbow-licence-prod  # libsql URL
  turso db tokens create rainbow-licence-prod  # auth token
  ```

#### 2. Vercel 환경변수 설정

production 환경에 다음 8개:

```
TURSO_DATABASE_URL=libsql://...
TURSO_AUTH_TOKEN=<turso token>
JWT_SECRET=<32 byte hex — node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">
ANTHROPIC_API_KEY=<anthropic key>
ANTHROPIC_MODEL=claude-sonnet-4-6
RESEND_API_KEY=<resend key>  (선택, 매직 링크 활성화)
RESEND_FROM_EMAIL=Rainbow Licence <noreply@verified-domain>
NEXT_PUBLIC_BASE_URL=https://rainbow-licence.vercel.app
NEXT_PUBLIC_DEMO_SCHOOL_CODE=NEXT_SCHOOL
```

설정:
```bash
vercel env add TURSO_DATABASE_URL production
# 프롬프트에 값 붙여넣기. 다른 변수도 동일.
```

#### 3. Production DB 마이그레이션

로컬에서 production DB로 마이그레이션 실행:
```bash
TURSO_DATABASE_URL=<prod url> TURSO_AUTH_TOKEN=<prod token> npm run db:migrate
```
4개 마이그레이션이 적용됨: `0001_users`, `0003_magic_link_tokens`, `0004_sources` (0002는 의도적으로 빈 자리).

#### 4. 배포

```bash
vercel --prod --yes
```
M1.5 배포 패턴과 동일 — Claude Code auto mode 분류기가 production 배포 명령은 차단할 수 있음. 차단되면 사용자에게 직접 실행 요청.

#### 5. 시연 시나리오 검증

`docs/superpowers/plans/2026-05-28-m2-demo-scenarios.md`의 시나리오 A~D 수동 체크리스트:
- A: vi 시연 모드 (학교 코드 → 텍스트 자료 → 학습)
- B: 이메일 매직 링크 다기기
- C: PDF 업로드
- D: 무관 자료 도메인 분류

#### 6. CLAUDE.md M2 영역 노트 추가

```markdown
## M2 다국어 학습 자료 노트

- DB: Turso. 마이그레이션은 `migrations/NNNN_*.sql`. 실행: `npm run db:migrate`.
- AI: `src/lib/ai/`. 5단계 파이프라인 `runPipeline(sourceId)`.
- 자료 등록 흐름: `NotebookPage` → `POST /api/sources` → `POST /api/sources/[id]/process` → polling.
- 사용자 콘텐츠는 기존 공식 콘텐츠와 동일 형식 (translations·keywordHints).
- 인증: Turso `users.device_id` (시연) 또는 `users.email` (정식, Resend 매직 링크).
```

#### 7. walkthrough.md "M2 배포 완료" 업데이트

배포 끝나면 production URL + 마지막 배포 commit 기록.

## 🛠 수정한 파일 (이번 세션, M2)

### 신규 파일
```
migrations/
  0001_users.sql
  0003_magic_link_tokens.sql
  0004_sources.sql

src/lib/
  db.js                       # Turso 클라이언트
  db/migrate.js               # 마이그레이션 실행기 (batch 트랜잭션)
  db/users.js                 # users CRUD
  db/sources.js               # sources/summaries/concepts/problems CRUD
  db/magic-link.js            # 토큰 CRUD
  auth/jwt.js                 # jose sign/verify
  auth/session.js             # 쿠키 헬퍼
  auth/require.js             # requireUser
  pdf-extract.js              # PDF → 텍스트
  ai/client.js                # Anthropic 클라이언트
  ai/json-mode.js             # callJsonMode + 재시도
  ai/prompts/classify.js
  ai/prompts/summarize.js
  ai/prompts/concepts.js
  ai/prompts/problems.js
  ai/prompts/translate.js     # 본문 매칭 가드 포함
  ai/pipeline.js              # runPipeline 5단계 통합
  api-client.js               # 클라이언트 fetch 헬퍼
  deviceId.js                 # localStorage uuid
  resend.js                   # 매직 링크 이메일

src/app/api/
  auth/device-anon/route.js
  auth/magic-link/route.js
  auth/verify/route.js
  auth/logout/route.js
  me/route.js
  sources/route.js
  sources/[id]/route.js
  sources/[id]/process/route.js
  sources/[id]/retry/route.js
  licences/[id]/concepts/route.js
  licences/[id]/problems/route.js

src/components/pages/
  AuthPage.js
  NotebookPage.js
  SourceDetailPage.js

src/lib/__tests__/
  db.test.js
  auth-jwt.test.js
  sources-db.test.js
  pdf-extract.test.js
  ai-client.test.js
  ai-prompts.test.js
  pipeline.test.js
  user-content-compat.test.js
  fixtures/sample.pdf

src/app/api/__tests__/
  auth.test.js
  sources.test.js
  licences-userpool.test.js

docs/superpowers/specs/2026-05-28-multilingual-notebook-design.md
docs/superpowers/plans/2026-05-28-multilingual-notebook.md
docs/superpowers/plans/2026-05-28-m2-demo-scenarios.md
```

### 수정 파일
```
src/app/page.js                          # auth 분기 + studyView 라우팅
src/components/pages/StudyPage.js        # activeView chip + 학습 묶음 chips + user→공식 형식 매핑
src/components/pages/DictionaryPage.js   # 사용자 개념 collapsible 섹션
.env.example                             # TURSO/JWT/Anthropic/Resend/NEXT_PUBLIC 환경변수
.env.local                               # 로컬 값 (.gitignore 제외)
package.json                             # @libsql/client, jose, resend, @anthropic-ai/sdk, pdf-parse, pdf-lib(dev)
```

## 💡 학습/주의사항 (이번 세션에서 강화)

- **본문 매칭 가드 자동화**: M1.5에서 spec reviewer가 수동으로 14+개 보정했던 `keywordHints.korean` 본문 등장 패턴이 이제 `translateProblem` 안에서 `body.includes(h.korean)` 후처리로 자동 필터. 학생이 올린 자료에서도 동일 품질 보장.
- **pdf-parse@1.x 함정**: index.js가 테스트 데이터를 자동 require하는 버그 → `pdf-parse/lib/pdf-parse.js` 직접 import. 또 Node Buffer 직접 전달은 XRef 파싱 깨짐 → 순수 `Uint8Array` 생성 후 전달.
- **next/headers cookies() async**: Next.js 16에서 `await cookies()` 필수. 테스트 mock 시에도 동기 반환이지만 호출부는 `await`.
- **vitest 환경 분리**: 라우트 핸들러·DB 테스트는 `// @vitest-environment node` 지시어 필수 (jsdom에서 jose TextEncoder cross-realm 이슈).
- **자동 분류기 차단**: home dir env 스캔, production 배포 명령은 명시적 사용자 승인 없이 차단됨. T20 배포 단계에서 사용자가 직접 명령 실행하거나 settings에 permission 추가 필요.
- **AskUserQuestion 한글 escape 금지**: literal UTF-8만 (이 세션에서 메모리에 박음 — `~/.claude/projects/-Volumes-AIPART-dev/memory/feedback_korean_askuserquestion.md`)

## 🎯 다음 세션 진입 시 즉시 할 일

1. 이 walkthrough.md 읽기
2. `git log --oneline -22` 로 commit 히스토리 확인 (`0355f04` 까지)
3. `npm run test:run` 확인 (76 passing 유지여야 정상)
4. **T20 배포 진행**:
   a. Turso 키·DB 위치 찾기 (사용자에게 물어보거나 `turso db list` 실행)
   b. JWT_SECRET 발급 (`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)
   c. ANTHROPIC_API_KEY 위치 확인 (사용자 또는 시크릿 매니저)
   d. RESEND_API_KEY 위치 확인 (선택)
   e. `vercel env add` 8개 변수
   f. `npm run db:migrate` production DB
   g. `vercel --prod --yes` (분류기 차단 시 사용자에게 직접 실행 요청)
   h. 시연 시나리오 4종 검증
   i. CLAUDE.md M2 섹션 + walkthrough.md "배포 완료" 업데이트
5. M3 후보 작업 검토 (AI 자동 후보 제시, URL/YouTube 소스, 중복 병합 등)

## M3 후보 (M2 spec 13.2에 정리됨)

- AI 자동 후보 제시 흐름 (Q7 C 흐름)
- URL / YouTube 소스 지원
- 자료 간 중복 개념 자동 병합
- 학교 단위 공유 풀
- localStorage SM-2 마이그레이션
- SSE 진행률 (현재 polling)
- 학교 단위 사용량 대시보드
