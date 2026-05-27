# Rainbow Licence — Agent Instructions

## Project Overview
한국 국가기술자격증 학습 PWA. 다문화 학교(NEXT SCHOOL) 학생 + 공공사업 평가위원이 1차 사용자/의사결정자.
상세: `docs/superpowers/specs/2026-05-26-rainbow-licence-beta-design.md`

## Design System
Always read DESIGN.md before making any visual or UI decisions.
All font choices, colors, spacing, and aesthetic direction are defined there.
Do not deviate without explicit user approval.
In QA mode, flag any code that doesn't match DESIGN.md.

## M2 다국어 학습 자료 노트 (2026-05-28 배포 완료)

- **DB**: Turso. 마이그레이션은 `migrations/NNNN_*.sql`. 실행: `npm run db:migrate` (Production은 `TURSO_DATABASE_URL`/`TURSO_AUTH_TOKEN` 환경변수 prod 값으로 실행).
- **LLM**: kie.ai 게이트웨이 (Anthropic-native `/v1/messages`). `src/lib/ai/client.js`에서 `baseURL: 'https://api.kie.ai/claude'` + `authToken: KIE_API_KEY`. 모델은 `LLM_MODEL` env (기본 `claude-sonnet-4-6`).
- **AI 파이프라인**: `src/lib/ai/`. 5단계 `runPipeline(sourceId)` — classify → summarize(KO) → concepts → problems → translate(5lang). 본문 매칭 가드는 `prompts/translate.js` 안에 내장.
- **자료 등록 흐름**: `NotebookPage` → `POST /api/sources` → `POST /api/sources/[id]/process` → polling (`SourceDetailPage`, 3s).
- **사용자 콘텐츠 통합**: `src/lib/user-content-compat.js`를 통해 사용자 problem이 공식 콘텐츠와 동일 schema(`translations`, `keywordHints`)로 정규화. `DictionaryPage`/`StudyPage`는 양쪽 풀을 동일하게 다룸.
- **인증**: 두 모드 공존. (a) `users.device_id` (시연·익명) — `/api/auth/device-anon`. (b) `users.email` (정식) — Resend 매직 링크 `/api/auth/magic-link` + `/verify`. 세션은 JWT 쿠키 (`src/lib/auth/`).
- **테스트 환경변수**: `KIE_API_KEY=test-key` (SDK mock 통과용). `vitest` 환경은 라우트/DB 테스트의 경우 `// @vitest-environment node` 필수.
- **migrate.js ESM**: 디렉토리 import 금지 (`from '../db.js'`처럼 `.js` 확장자 명시).

## Skill routing
When the user's request matches an available skill, invoke it via the Skill tool.
- 디자인 시스템/플랜 리뷰 → `/design-consultation` 또는 `/plan-design-review`
- 화면 변형 비교 → `/design-shotgun`
- 디자인 게이트형 검증 → `/design-review`
- 버그/에러 → `/investigate`
- QA/테스트 → `/qa` 또는 `/qa-only`
- 코드 리뷰 → `/review`
- 배포/PR → `/ship` 또는 `/land-and-deploy`
