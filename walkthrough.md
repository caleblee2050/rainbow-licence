# Rainbow Licence — 세션 핸드오프 (2026-05-28, M3-A 학습 흐름 확장)

> 다음 세션이 시작되면 이 파일부터 읽고 컨텍스트 복원할 것.

## 📊 현재 좌표

**프로젝트**: 한국 국가기술자격증 학습 PWA (다문화 학교 NEXT SCHOOL용 + 공공평가위원 시연).
**프로덕션 URL**: https://rainbow-licence.vercel.app — **M3-A 배포 완료 (2026-05-28, deployment `dpl_E8BNJ72Byg1FFgG5YZCJmkHwRs92`)**
**저장소**: https://github.com/caleblee2050/rainbow-licence
**브랜치**: `main` — commit `969ddba` push 완료, production alias 적용됨

**라이브 검증** (2026-05-28):
- 홈 GET 200 (~947ms first hit)
- `/api/auth/device-anon` POST + `/api/me` 정상 (DB/JWT 회로 통과)
- 번들에 신규 키워드 (`MockExam`, `TermsLearn`, `모의고사`, `용어 학습`, `플래시카드`) 포함 확인

## ✅ 이전 세션 (M2 T20 배포)

`7a80c55` — kie.ai 게이트웨이 전환 + Turso prod DB + Vercel env 9개 + production 배포 완료. 라이브 smoke test 통과. 상세는 git log.

## ✅ 이번 세션 (M3-A 학습 흐름 완성)

사용자가 "학습 부분 부족, UI/UX 쓸만하게, 오류 스스로 체크"를 요청. HomePage가 광고하는 5단계 학습법 중 **STEP 0(용어 사전 학습)과 STEP 4(실전 모의고사)가 미구현**이었던 핵심 갭 해소.

### 신규 컴포넌트

#### `src/components/pages/TermsLearnPage.js` (STEP 0)
- 플래시카드 좌우 스와이프 학습 모드 (사용자 선택)
- 자격증별 40+ 용어 × 5언어 데이터 활용 (`src/data/terms/`)
- 카드 플립: 한국어/발음 ↔ 모국어 번역 + 미검수 언어는 "AI 번역 (검수 진행 중)" 표시
- 안다/모른다 버튼 → SM-2 `recordAnswer(`term-${licenceId}-${korean}`, licenceId, '용어', isCorrect)` 연동
- 종료 화면: 이해도 % + 모르는 단어 chip 리스트 (다시 학습 가이드)
- 진입: `dictionary` 탭에서 자격증 선택 후 그라데이션 CTA 또는 HomePage STEP 0 카드

#### `src/components/pages/MockExamPage.js` (STEP 4)
- 60문제 무작위 + 60분 카운트다운 (`useEffect` setInterval, 종료 시 자동 제출)
- 진행 표시 + 답안 점프 10x6 그리드 (어느 문제든 빠르게 이동)
- 5분 미만 잔여 시 타이머 빨강 + glow shadow 강조
- 미답변 상태로 제출 시 모달 경고 ("N문제 미답변 — 그래도 제출?")
- 종료 다이얼로그 ("진행 상황이 사라집니다")
- 결과 화면: 점수 + 합격(60+) 여부 + 과목별 정답률 그래프 + 오답 노트 상위 10개 + recordAnswer 일괄 기록
- 진입: StudyPage 상단 "🎯 모의고사" chip 또는 HomePage STEP 4 카드

### 라우팅 / 진입 통합

#### `src/app/page.js`
- `studyView` 추가: `'mock-exam'`. 자격증 + studyView=='mock-exam'이면 `<MockExamPage />`
- `dictionaryView` 추가: `'browse'|'learn'`. 자격증 + dictionaryView=='learn'이면 `<TermsLearnPage />`
- `goToTermsLearn()`, `goToMockExam()` 콜백 + 자격증 미선택 시 `korean-food` 기본 fallback
- `<ErrorBoundary>`로 main 영역 감싸기 (페이지 단위 fallback UI)
- `api.me()` silent fail → `console.warn` 전환

#### `src/components/pages/HomePage.js`
- 단계별 학습법 5개 카드를 클릭 가능 button으로 전환
- 각 카드에 onClick (STEP 0/4는 신규 진입점, 1/2/3은 학습 페이지로)
- STEP 0/4: `isPremiumGateUnlocked()` 체크로 DEMO 모드에서 잠금 해제, 일반 모드에선 🔒 표시
- chevron arrow 추가 (탐험 가능성 시그널)

#### `src/components/pages/DictionaryPage.js`
- `selectedLicence`가 있을 때 상단에 그라데이션 "플래시카드로 학습 시작" CTA
- 자격증 미선택 시 사전 모드만 (기존 그대로)

#### `src/components/pages/StudyPage.js`
- chip 영역에 "🎯 모의고사" chip 추가 (accent color)
- `isLocked` 조건에 `isPremiumGateUnlocked()` 추가 → DEMO 모드 잠금 해제

### 오류 핸들링

#### `src/lib/api-client.js`
- `jsonFetch` 및 `createSourcePdf`의 `fetch` 호출을 `try/catch`로 wrap
- 네트워크 실패(`TypeError`) → "네트워크 연결을 확인해주세요" 한글 메시지로 명확히 throw
- 기존엔 unhandled rejection으로 silent fail

#### Silent fail 패턴 제거
- `.catch(() => {})` 3곳을 `console.warn` + 한 줄 메시지로 전환:
  - `src/app/page.js` me 호출
  - `src/components/pages/StudyPage.js` userProblems
  - `src/components/pages/DictionaryPage.js` userConcepts
- DevTools에서 즉시 발견 가능

#### ErrorBoundary
- 컴포넌트 자체는 이전부터 존재 (`src/components/ErrorBoundary.js`)
- 이번에 `src/app/page.js`의 `<main>` 영역에 통합 → 어느 페이지든 unhandled error 발생 시 한글 fallback + "다시 시도" 버튼

### 검증

- ✅ 76 tests passing (회귀 없음)
- ✅ `next build` 성공
- ✅ Production 배포 완료 (`dpl_E8BNJ72Byg1FFgG5YZCJmkHwRs92`). 라이브 smoke test + 번들 키워드 확인 통과.

## 🚧 다음 세션 진입 시 즉시 할 일

### 1. 라이브 시연 시나리오 검증 (수동, 브라우저)
배포 후 https://rainbow-licence.vercel.app 에서 다음 새 흐름 수동 확인:

#### STEP 0 (용어 학습)
- 홈 → 단계별 학습법 → STEP 0 클릭 → 자격증 자동 선택(없으면 한식조리) → 플래시카드 진입
- 사전 탭 진입 → 자격증 chip 선택 → "플래시카드로 학습 시작" 그라데이션 CTA → 카드 학습
- 카드 탭 → 번역 표시 → 안다/모른다 → 다음 카드
- 좌우 스와이프로 이전/다음 이동 가능한지 (모바일/터치 환경)
- 끝까지 풀면 결과 화면 + 모르는 단어 chip 리스트
- 베트남어(vi)·중국어(zh)는 검수 완료 배지 없음, 태국어(th)·필리핀어(tl)·미얀마어(my)는 "AI 번역 (검수 진행 중)" 노출

#### STEP 4 (모의고사)
- 홈 → STEP 4 클릭 또는 학습 탭 → 🎯 모의고사 chip → 모의고사 진입
- 60분 타이머 카운트다운 시작 (5분 미만 시 빨강 강조)
- 답안 점프 10x6 그리드로 임의 문제 이동
- 미답변 상태 제출 → 경고 모달 → 그래도 제출 시 결과
- 결과: 점수/합격 여부/과목별 정답률/오답 노트 상위 10개
- 다시 풀기 / 학습으로 돌아가기 버튼

### 2. 발견 오류 자동/수동 fix
- 라이브에서 발견되는 console.error / network 오류 / UI 깨짐 fix

### 3. M3 후보 다음 단계 (사용자와 우선순위 협의)
- Resend 도메인 verify + 매직 링크 활성화 (시연 시나리오 B)
- AI 자동 후보 제시 흐름 (Q7 C 흐름)
- URL / YouTube 소스 지원
- 자료 간 중복 개념 자동 병합
- 학교 단위 공유 풀 / 사용량 대시보드
- localStorage SM-2 → Turso 마이그레이션
- SSE 진행률 (현재 polling)

## 🛠 이번 세션 수정·신규 파일

```
NEW  src/components/pages/TermsLearnPage.js    # STEP 0 플래시카드 학습
NEW  src/components/pages/MockExamPage.js      # STEP 4 60문제/60분 모의고사

MOD  src/app/page.js                           # 라우팅 + ErrorBoundary + silent fail 제거
MOD  src/components/pages/HomePage.js          # 단계별 카드 클릭 가능 + 진입 CTA
MOD  src/components/pages/DictionaryPage.js    # 학습 시작 그라데이션 CTA + silent fail 제거
MOD  src/components/pages/StudyPage.js         # 모의고사 chip + DEMO 잠금 해제
MOD  src/lib/api-client.js                     # 네트워크 오류 처리 강화
MOD  walkthrough.md                            # (이 파일) M3-A 기록
```

## 💡 학습/주의사항 (이번 세션에서 강화)

- **상위 학습법 광고 vs 실제 구현 갭**: HomePage가 사용자에게 STEP 0~4를 노출하면서 실제로는 1/2/3만 작동했음 — 시연자가 직접 빈 카드를 누르면 무반응이었던 핵심 UX 결함. 사용자 광고와 코드 동작은 항상 일치해야.
- **DEMO 모드 정책 점검**: `isPremiumGateUnlocked()`가 `isDemoMode()`만 보는데, 이를 호출하는 곳마다 일관되게 적용되어야 함. HomePage는 적용됐었지만 StudyPage의 freeLimit 잠금은 빠져 있었음.
- **silent fail 검출**: `.catch(() => {})` 패턴은 console에 흔적도 안 남기므로 시연 중 데이터 누락이 발생해도 알 수 없음. 최소 `console.warn`으로라도 흔적 남겨야.
- **모바일 터치 제스처**: TouchStart/TouchEnd로 50px 임계값 스와이프 감지. 트랙패드 환경에선 작동 안 할 수 있음 — 데스크탑 시연 시 카드 탭으로 동일 흐름.
- **MockExamPage useEffect 의존성**: `submitted`와 `submit` 콜백 두 가지 의존성. `submit`을 `useCallback`으로 묶어서 매 렌더마다 새 함수 안 만들도록 처리.

## M3 후보 (M2 spec 13.2)

- AI 자동 후보 제시 흐름 (Q7 C 흐름)
- URL / YouTube 소스 지원
- 자료 간 중복 개념 자동 병합
- 학교 단위 공유 풀
- localStorage SM-2 마이그레이션 (Turso로)
- SSE 진행률 (현재 polling)
- 학교 단위 사용량 대시보드
