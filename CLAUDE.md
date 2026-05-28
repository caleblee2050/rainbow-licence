# Rainbow Licence — Agent Instructions

## Project Overview
한국 국가기술자격증 학습 PWA. 다문화 학교(NEXT SCHOOL) 학생 + 공공사업 평가위원이 1차 사용자/의사결정자.
상세: `docs/superpowers/specs/2026-05-26-rainbow-licence-beta-design.md`

## Design System
Always read DESIGN.md before making any visual or UI decisions.
All font choices, colors, spacing, and aesthetic direction are defined there.
Do not deviate without explicit user approval.
In QA mode, flag any code that doesn't match DESIGN.md.

## 학습 흐름 (M3-A 완성, 2026-05-28)

5단계 학습법 (HomePage 광고 + 실제 동작 일치):

| STEP | 컴포넌트 | 경로 | 진입점 |
|------|---------|------|-------|
| 0 용어 사전 학습 | `TermsLearnPage.js` | dictionaryView='learn' | 홈 STEP 0 카드 / 사전 탭 그라데이션 CTA |
| 1 완전 번역 | `StudyPage.js` (mode='step1') | studyView='study' | 학습 탭 모드 토글 |
| 2 키워드 힌트 | `StudyPage.js` (mode='step2') | studyView='study' | 학습 탭 모드 토글 |
| 3 실전 한국어 | `StudyPage.js` (mode='step3') | studyView='study' | 학습 탭 모드 토글 |
| 4 실전 모의고사 | `MockExamPage.js` | studyView='mock-exam' | 홈 STEP 4 카드 / 학습 탭 🎯 chip |

- **STEP 0**: 플래시카드 좌우 스와이프. SM-2 `recordAnswer(`term-${licenceId}-${korean}`, licenceId, '용어', isCorrect)`.
- **STEP 4**: 60문제 무작위 × 60분 카운트다운. 5분 미만 시 빨강 강조. 답안 점프 10x6 그리드.
- **chip 영역 일관성**: StudyPage / NotebookPage 둘 다 상단에 학습/내자료/🎯모의고사 chip 렌더 — 사용자가 어떤 sub-view든 다른 view로 자유롭게 이동 가능.

## M2 다국어 학습 자료 노트 (2026-05-28 배포 완료)

- **DB**: Turso. 마이그레이션은 `migrations/NNNN_*.sql`. 실행: `npm run db:migrate` (Production은 `TURSO_DATABASE_URL`/`TURSO_AUTH_TOKEN` 환경변수 prod 값으로 실행).
- **LLM**: kie.ai 게이트웨이 (Anthropic-native `/v1/messages`). `src/lib/ai/client.js`에서 `baseURL: 'https://api.kie.ai/claude'` + `authToken: KIE_API_KEY`. 모델은 `LLM_MODEL` env (기본 `claude-sonnet-4-6`).
- **AI 파이프라인**: `src/lib/ai/`. 5단계 `runPipeline(sourceId)` — classify → summarize(KO) → concepts → problems → translate(5lang). 본문 매칭 가드는 `prompts/translate.js` 안에 내장.
- **자료 등록 흐름**: `NotebookPage` → `POST /api/sources` → `POST /api/sources/[id]/process` → polling (`SourceDetailPage`, 3s).
- **사용자 콘텐츠 통합**: `src/lib/user-content-compat.js`를 통해 사용자 problem이 공식 콘텐츠와 동일 schema(`translations`, `keywordHints`)로 정규화. `DictionaryPage`/`StudyPage`는 양쪽 풀을 동일하게 다룸.
- **인증**: 두 모드 공존. (a) `users.device_id` (시연·익명) — `/api/auth/device-anon`. (b) `users.email` (정식) — Resend 매직 링크 `/api/auth/magic-link` + `/verify`. 세션은 JWT 쿠키 (`src/lib/auth/`).
- **테스트 환경변수**: `KIE_API_KEY=test-key` (SDK mock 통과용). `vitest` 환경은 라우트/DB 테스트의 경우 `// @vitest-environment node` 필수.
- **migrate.js ESM**: 디렉토리 import 금지 (`from '../db.js'`처럼 `.js` 확장자 명시).

## DEMO 모드 정책

- `NEXT_PUBLIC_DEMO_MODE=true` → `isDemoMode()` true.
- `isPremiumGateUnlocked()`이 모든 잠금 조건에 일관되게 적용되어야 함 (StudyPage `isLocked`, HomePage STEP 0/4 카드 등).
- `shouldHidePremium()` true 시 `PremiumBanner` → `InstitutionInquiryCard`로 자동 교체.
- TopNav 로고 5회 클릭 → 데모 초기화 (`localStorage.removeItem('rainbow_study')`).

## 오류 핸들링 표준

- **fetch 호출**: 모든 네트워크 호출은 `api-client.js`의 `jsonFetch`/`createSourcePdf` 통과. 네트워크 실패 시 "네트워크 연결을 확인해주세요" 한글 메시지 throw.
- **silent fail 금지**: `.catch(() => {})` 패턴은 금지. 최소 `console.warn('[ComponentName] 설명:', e.message)`로 흔적 남기기.
- **페이지 단위 fallback**: `<ErrorBoundary>`로 `<main>` 감쌌으므로 unhandled error는 한글 fallback UI로 표시 + "다시 시도" 버튼.

## Skill routing
When the user's request matches an available skill, invoke it via the Skill tool.
- 디자인 시스템/플랜 리뷰 → `/design-consultation` 또는 `/plan-design-review`
- 화면 변형 비교 → `/design-shotgun`
- 디자인 게이트형 검증 → `/design-review`
- 버그/에러 → `/investigate`
- QA/테스트 → `/qa` 또는 `/qa-only`
- 코드 리뷰 → `/review`
- 배포/PR → `/ship` 또는 `/land-and-deploy`
