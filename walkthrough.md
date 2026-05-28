# Rainbow Licence — 세션 핸드오프 (2026-05-28)

> 다음 세션이 시작되면 이 파일부터 읽고 컨텍스트 복원할 것.

## 📊 현재 좌표

| 항목 | 값 |
|------|------|
| 프로덕션 URL | https://rainbow-licence.vercel.app |
| 마지막 배포 | `dpl_4ZHVx64ie9VY5aVuFwKeHs5TMyLp` (2026-05-28, notebook chip fix 포함) |
| 저장소 | https://github.com/caleblee2050/rainbow-licence |
| 브랜치 | `main` — `58d09ac` 까지 origin push 완료 |
| 테스트 | 76 passing |
| Turso prod DB | `rainbow-licence-prod` @ aws-us-west-2 |
| LLM 게이트웨이 | kie.ai (`https://api.kie.ai/claude/v1/messages`), 모델 `claude-sonnet-4-6` |

## 🗓️ 진행 마일스톤

| 단계 | 완료 | 주요 commit |
|------|------|------|
| M1 베타 디자인 | 이전 세션 | — |
| M1.5 공식 콘텐츠 5언어 번역 | 이전 세션 | — |
| M2 다국어 학습 자료 노트 (NotebookLM 풍) | 2026-05-28 | T1~T19 (commits `86be319`~`0355f04`) |
| M2 T20 배포 + kie.ai 통합 | 2026-05-28 | `7a80c55` |
| **M3-A 학습 흐름 확장** (STEP 0/4 + 오류 핸들링) | **2026-05-28** | **`969ddba`** |
| M3-A 후속 — NotebookPage chip nav fix | 2026-05-28 | `58d09ac` |

## ✅ 이번 세션에서 완료된 작업

### 1. kie.ai 게이트웨이로 전환 + 전역룰 명시
- **글로벌**: `~/.claude/CLAUDE.md` 새 섹션 "LLM API 게이트웨이 (kie.ai 우선 — 전역 기본값)" 박음. 이후 모든 신규 프로젝트는 kie.ai 기본 사용.
- **rainbow-licence**: `src/lib/ai/client.js`를 `baseURL='https://api.kie.ai/claude'` + `authToken=KIE_API_KEY`로 라우팅. Anthropic SDK 그대로 재활용 (kie.ai가 `/v1/messages` Anthropic-native 지원).
- 환경변수 `ANTHROPIC_API_KEY/MODEL` → `KIE_API_KEY/LLM_MODEL` 일괄 전환 (테스트 3종 포함).

### 2. M2 T20 production 배포
- Turso prod DB `rainbow-licence-prod` 생성, 3개 마이그레이션 적용
- Vercel env 9개 등록 (TURSO_*, JWT_SECRET, KIE_API_KEY, LLM_MODEL, NEXT_PUBLIC_*)
- `vercel --prod` 성공 → production alias 적용
- 라이브 smoke test 통과 (홈 200, /api/auth/device-anon, /api/me)
- `migrate.js` ESM 디렉토리 import → `.js` 확장자 명시 수정

### 3. M3-A 학습 흐름 확장
**핵심**: HomePage가 광고하는 5단계 학습법 중 STEP 0 / STEP 4가 미구현이었던 갭 해소.

#### 신규 컴포넌트
- **`src/components/pages/TermsLearnPage.js`** (STEP 0): 플래시카드 좌우 스와이프. 자격증별 40+ 용어 × 5언어. 한국어 ↔ 모국어 플립 + 안다/모른다 버튼 → SM-2 `recordAnswer` 연동. 종료 시 이해도 % + 모르는 단어 chip 리스트. 미검수 언어(th/tl/my)는 "AI 번역" 배지.
- **`src/components/pages/MockExamPage.js`** (STEP 4): 60문제 무작위 + 60분 카운트다운. 답안 점프 10x6 그리드. 5분 미만 잔여 시 타이머 빨강 + glow. 미답변 경고 모달. 결과: 점수/합격(60+)/과목별 정답률/오답 노트 상위 10개.

#### 라우팅·UI·정책 통합
- `src/app/page.js`: `studyView='mock-exam'`, `dictionaryView='browse'|'learn'` 분기. `<ErrorBoundary>`로 main wrap. `goToTermsLearn`/`goToMockExam` 콜백 + 자격증 미선택 시 `korean-food` 기본.
- `src/components/pages/HomePage.js`: 단계별 학습법 5개 카드를 클릭 가능 button으로 전환. STEP 0/4는 `isPremiumGateUnlocked()` 체크.
- `src/components/pages/DictionaryPage.js`: 자격증 선택 시 그라데이션 "플래시카드로 학습 시작" CTA.
- `src/components/pages/StudyPage.js`: chip에 🎯 모의고사 추가. `isLocked` 조건에 `isPremiumGateUnlocked()` 추가 → DEMO 모드 잠금 해제.

#### 오류 핸들링
- `src/lib/api-client.js`: `fetch` 호출을 `try/catch` wrap → 네트워크 실패 시 한글 메시지 throw.
- silent `.catch(() => {})` 3곳 → `console.warn` 전환 (page.js me, StudyPage userProblems, DictionaryPage userConcepts).
- `ErrorBoundary` 컴포넌트 page.js main 영역에 통합.

### 4. NotebookPage navigation fix (`58d09ac`)
- 시연 중 사용자 발견: 학습 → 내 자료 진입 후 학습으로 돌아갈 길이 없음.
- StudyPage와 동일한 학습/내자료/🎯모의고사 chip을 NotebookPage 상단에도 렌더링.
- `page.js`에서 `activeView`/`onChangeView`/`onStartMockExam` props를 NotebookPage에 전달.

## 🛠️ 이번 세션 변경 파일

```
NEW  src/components/pages/TermsLearnPage.js    # STEP 0 플래시카드 학습
NEW  src/components/pages/MockExamPage.js      # STEP 4 60문제/60분 모의고사

MOD  src/app/page.js                           # 라우팅 + ErrorBoundary + Notebook props 전달
MOD  src/components/pages/HomePage.js          # 단계별 카드 클릭 가능 + 진입 CTA
MOD  src/components/pages/DictionaryPage.js    # 학습 시작 그라데이션 CTA + silent fail 제거
MOD  src/components/pages/StudyPage.js         # 모의고사 chip + DEMO 잠금 해제
MOD  src/components/pages/NotebookPage.js      # 동일 chip 영역 추가 (학습 복귀)
MOD  src/lib/ai/client.js                      # kie.ai baseURL + authToken
MOD  src/lib/db/migrate.js                     # ESM .js 확장자
MOD  src/lib/api-client.js                     # 네트워크 오류 처리
MOD  src/lib/__tests__/ai-client.test.js       # KIE_API_KEY env
MOD  src/lib/__tests__/ai-prompts.test.js      # KIE_API_KEY env
MOD  src/lib/__tests__/pipeline.test.js        # KIE_API_KEY env
MOD  .env.example                              # KIE_API_KEY/LLM_MODEL
MOD  CLAUDE.md                                 # M2 영역 노트
MOD  walkthrough.md                            # (이 파일)
MOD  ~/.claude/CLAUDE.md (글로벌)              # kie.ai 전역룰 박음
```

## 🎯 다음 세션 진입 시 즉시 할 일

### 1. 브라우저 시연 시나리오 검증 (수동)
배포 후 https://rainbow-licence.vercel.app 에서 다음 흐름 확인:

#### M2 시나리오 (`docs/superpowers/plans/2026-05-28-m2-demo-scenarios.md`)
- **A (vi 시연)**: 학교 코드 NEXT_SCHOOL → 텍스트 자료 등록 → 5단계 파이프라인 → 학습 풀 노출
- **B (이메일 매직 링크)**: **Resend 도메인 verify 후 활성** — 현재는 디바이스 익명 모드만
- **C (PDF 업로드)**: 한국어 PDF → 텍스트 추출 → 파이프라인 완료
- **D (도메인 분류)**: 무관 자료(예: 운전 매뉴얼) → `domain_score < 0.4` 경고 표시

#### M3-A 신규 시나리오
- **STEP 0 (용어 학습)**: 홈 STEP 0 카드 또는 사전 탭 → 자격증 선택 → 플래시카드 → 안다/모른다 → 종료 통계 + 모르는 단어 리스트
- **STEP 4 (모의고사)**: 홈 STEP 4 카드 또는 학습 탭 🎯 chip → 60분 타이머 진행 → 답안 점프 그리드 / 미답변 경고 → 결과 (과목별 정답률 + 오답 노트)
- **내비게이션**: 내 자료 진입 후 학습/모의고사 chip으로 자유롭게 복귀 가능한지

### 2. 발견 오류 fix
- DevTools console에서 새 `console.warn` 외에 unexpected error 있는지
- 모바일 터치 환경 좌우 스와이프 작동 여부
- 모의고사 중 다른 탭 이동 후 복귀 시 타이머·답안 유지

### 3. M3 다음 단계 (우선순위 협의)
- Resend 도메인 verify + 매직 링크 활성화 (시연 시나리오 B)
- AI 자동 후보 제시 흐름 (Q7 C 흐름)
- URL / YouTube 소스 지원
- 자료 간 중복 개념 자동 병합
- 학교 단위 공유 풀 / 사용량 대시보드
- localStorage SM-2 → Turso 마이그레이션
- SSE 진행률 (현재 polling)

## 💡 누적 학습/주의사항

### 인프라
- **kie.ai = Anthropic-native /v1/messages 지원**: `baseURL` 한 줄 + `authToken` 옵션으로 SDK 코드 그대로 재사용. `apiKey` 대신 `authToken`을 써야 Bearer 헤더 생성. `x-api-key`는 kie.ai에서 거부.
- **Vercel auto classifier**: `vercel --prod --yes`는 매 배포마다 명시적 사용자 승인 필요. env 등록·DB 마이그레이션은 통과. `&&`로 여러 명령 chain하면 차단 시 전체 abort되니 commit/push는 deploy와 분리 실행.
- **migrate.js ESM**: Node 24에서 디렉토리 import 미지원. `.js` 확장자 필수.
- **Turso settings.json 토큰 만료**: 사용자가 "로그인 됐다"고 해도 CLI에서 별도 검증 필요. 만료되면 `turso auth login` 재실행.
- **kie.ai 비용**: smoke test 1회당 `credits_consumed: 0.1`. 5언어 번역 5건 × 5스텝 = 약 125회 호출 → 비용 모니터링 필요.

### UX·UI
- **광고 vs 구현 갭**: 사용자에게 노출되는 UI(예: HomePage 단계별 학습법)와 실제 동작은 항상 일치해야. 빈 카드 누르면 무반응이 가장 안 좋은 첫인상.
- **DEMO 모드 정책 일관성**: `isPremiumGateUnlocked()`을 잠금 조건 모든 곳에 적용. 한 곳이라도 빠지면 시연 흐름 차단.
- **silent fail 검출**: `.catch(() => {})` 패턴은 console에 흔적 안 남음 → 최소 `console.warn`으로라도 흔적 남기기.
- **모바일 터치 제스처**: TouchStart/TouchEnd 50px 임계값. 데스크탑 트랙패드는 작동 안 할 수 있어 카드 탭 대체 흐름 필수.
- **하위 페이지에서 상위로 돌아갈 길 확보**: NotebookPage에서 발견된 갇힘 — chip 영역을 일관되게 sub-view 모두에 렌더링.

### 코드
- **본문 매칭 가드 자동화** (M2 T12): M1.5의 14+ 수동 보정 패턴을 `translateProblem` 안에서 자동 처리 (`body.includes(h.korean)` 후처리).
- **pdf-parse@1.x 함정**: `pdf-parse/lib/pdf-parse.js` 직접 import + 순수 `Uint8Array` 사용 (Node Buffer는 XRef 깨짐).
- **next/headers cookies() async**: Next.js 16에서 `await cookies()` 필수.
- **vitest 환경 분리**: 라우트·DB 테스트는 `// @vitest-environment node` 지시어 (jsdom에서 jose TextEncoder cross-realm 이슈).
- **MockExamPage useEffect 의존성**: `submit`을 `useCallback`으로 묶어서 매 렌더마다 새 함수 안 만들도록 처리.
- **AskUserQuestion 한글 escape 금지**: literal UTF-8만 (메모리: `~/.claude/projects/-Volumes-AIPART-dev/memory/feedback_korean_askuserquestion.md`)
