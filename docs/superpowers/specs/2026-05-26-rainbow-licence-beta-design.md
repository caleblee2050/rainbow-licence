# Rainbow Licence — 시연 베타 설계 문서

- **작성일**: 2026-05-26
- **저자**: caleblee2050 + Claude
- **상태**: 사용자 승인 대기

## 1. 배경 및 재정의

### 1.1 프로젝트 출처
다문화 학교(`NEXT SCHOOL`) 교장선생님의 요청으로 시작. 이 학교의 외국인 출신 학생(청소년·성인)이 한국 국가기술자격증 시험을 준비할 때 쓸 학습 도구.

### 1.2 처음 가정 → 재정의

| 차원 | 처음 가정 | 재정의 |
| --- | --- | --- |
| 목표 | lean MVP / PMF 검증 | 다문화 학교 시연 → 공공사업 제안 가능 수준 |
| 1차 사용자 | 외국인 노동자 일반 | NEXT SCHOOL 학생 (다문화 청소년/성인 학생) |
| 의사결정자 | 사용자 본인(₩9,900/월 결제) | 교장선생님 → 공공 평가위원/담당 공무원 |
| 품질 바 | "허접해도 OK, 빨리 검증" | 공공 평가 통과 가능 수준 |
| 수익 모델 | B2C 구독 | (단기) 무료/학교용 → (장기) 기관 라이선스·공공 위탁 |
| 검증 지표 | DAU·결제율 | 학생 실사용 + 학습 효과(정답률·풀이량) → 제안서 데이터 |

### 1.3 핵심 함의
프리미엄 결제 UI(₩9,900/월)는 시연 컨텍스트에서 노이즈. 평가위원/교장선생님에게 보일 화면에선 숨기거나 "기관 도입 문의"로 교체.

## 2. M1: 시연 베타 (3주 스프린트)

### 2.1 성공 조건
교장선생님께 보여드렸을 때 "이거 학생들 손에 줘도 되겠다" 소리가 나오고, 공공 평가위원에게 보여도 부끄럽지 않은 완성도.

### 2.2 4개 트랙

**1) 안정화**
- `src/lib/studyEngine.js`의 `getStudyData()`에 default deep-merge 추가 — 옛 localStorage(예: `premium` 키 없음) 대응
- `isPremium`, `getStreak`, `getStats` 등 함수 전부 빈 데이터/누락 키 폴백 점검
- ErrorBoundary 추가 — 한 컴포넌트가 터져도 전체 앱 안 죽게

**2) 콘텐츠 — 자격증 3개 풀 충실**

| 자격증 | 현재 | 목표 | 사유 |
| --- | --- | --- | --- |
| 한식조리기능사 | 15문제 / 23용어 | 60문제 / 40용어 | 인기 1위, 베이스 있음 |
| 미용사(일반) | 10문제 / 12용어 | 60문제 / 40용어 | 다국어 시험 가능, 외국인 수요 큼 |
| 제과기능사 | 0 / 0 | 60문제 / 40용어 | 다국어 시험 가능, 다양성 어필 |

각 문제에 `simpleQuestion` + `simpleExplanation` 둘 다 채움 (STEP 1 모드 의미 살리려면 필수).

**3) 프리미엄/결제 처리**
- 환경변수 `NEXT_PUBLIC_DEMO_MODE=true` 추가
- DEMO 모드: 프리미엄 배너 → "📋 기관 도입 문의" 카드로 교체
- DEMO 모드: STEP 0 잠금 등 프리미엄 게이트 해제 (학생이 모든 기능 체험)

**4) 시연 친화 + 배포**
- 헤더에 "데모 초기화" 숨김 버튼 (Cmd+Shift+R은 브라우저 강력 새로고침과 충돌하므로 별도 단축키, 예: Alt+Shift+D 또는 로고 5회 클릭) — 시연 때 새 학생처럼 처음부터 시연 가능
- 학교명 `NEXT_PUBLIC_SCHOOL_NAME=NEXT SCHOOL` ENV로 주입, 헤더에 작게 표시
- Vercel 배포 + 메타태그/OG 이미지
- (선택) 커스텀 도메인

### 2.3 M1에서 의도적으로 안 하는 것
- 관리자 대시보드 (반/그룹별 통계) → M2
- 학생 계정 시스템 → M2 (M1은 localStorage 단일 사용자)
- 결제 통합 → M2 이후
- 접근성 WCAG 풀 인증 → M2
- 6개 자격증 전체 콘텐츠 → M2

### 2.4 콘텐츠 전략

**저작권 정책**: Q-net 공개 기출문제 무단 복제는 위험. 옵션 A 채택 — Q-net 공개기출 + 시중 문제집의 패턴·주제·난이도 분석 후 우리가 변형해서 새 문항 작성. "○○년도 기출 변형" 식 표기는 평가 시 신뢰도 +.

**자격증 1개당 콘텐츠 생성 워크플로**:
1. 본인: Q-net 공개기출 + 시중 교재로 출제 범위/빈출 주제 매핑 (반나절)
2. 본인 + AI: 단원별 빈도 맞춰 60문제 초안 작성 (1일)
3. 본인: `simpleQuestion` / `simpleExplanation` 작성 또는 검수 (1일) — 차별점, 가장 공들임
4. 본인 + AI: 5개 언어 용어 40개 (1차) (반나절)
5. 본인: 5개 언어 검수

**5개 언어 정책 (M1)**:
- vi (베트남어), zh (중국어): 검수 완료 → 노출
- th (태국어), tl (필리핀어), my (미얀마어): "준비 중" 표기, 사전에서만 표시 (학습 모드의 번역은 vi/zh 우선)
- M2에서 다문화 학교 학생들과 검수 진행하면 전 언어 노출

### 2.5 실행 순서 (3주)

**Week 1 — 안정화 + 한식조리 60문제**
- Day 1-2: 버그픽스, ErrorBoundary, 데모모드 ENV 셋업, Vercel 배포
- Day 3-5: 한식조리 60문제 + 40용어

**Week 2 — 미용일반 + 시연 친화**
- Day 6-7: 시연 친화 기능 (NEXT SCHOOL 주입, 데모초기화, OG/메타)
- Day 8-10: 미용(일반) 60문제 + 40용어

**Week 3 — 제과 + 마무리**
- Day 11-13: 제과 60문제 + 40용어
- Day 14: 5개 언어 정책 적용 (vi/zh 검수 완료, 나머지 "준비 중")
- Day 15: 전체 QA, 시연 리허설, 폴리시

### 2.6 일찍 배포하는 이유
Week 1 끝에 Vercel 배포 → 본인이 폰으로 매일 dogfooding 가능 + 교장선생님께 "진행 중 봐주세요" URL 공유 가능 + 시연 당일 인프라 사고 0.

## 3. 아키텍처

### 3.1 변경 없음
현재 구조 유지: Next.js 16.1.6 App Router, React 19, JS 기반, localStorage 영속화.

```
src/
  app/
    layout.js, page.js, globals.css
  components/
    layout/   (TopNav, BottomNav)
    ui/       (PremiumBanner — DEMO 모드 분기 추가)
    pages/    (HomePage, OnboardingPage, LicencePage, StudyPage, DictionaryPage, CommunityPage)
  data/
    licences.js   (수정 없음, 6개 메타데이터 유지)
    questions.js  (3개 자격증 60문제씩 채움)
    terms.js      (3개 자격증 40용어씩 채움)
  lib/
    studyEngine.js  (default deep-merge + DEMO 분기 + ErrorBoundary 헬퍼)
```

### 3.2 신규 모듈

- `src/lib/demoMode.js` — `isDemoMode()`, `getSchoolName()` 헬퍼. ENV 읽고 캐싱.
- `src/components/ErrorBoundary.js` — React ErrorBoundary, 시연 중 fallback UI.

### 3.3 환경변수

```
NEXT_PUBLIC_DEMO_MODE=true|false
NEXT_PUBLIC_SCHOOL_NAME=NEXT SCHOOL
```

`.env.local` (dev), Vercel 환경변수(prod) 둘 다 셋업.

## 4. 데이터 모델

### 4.1 questions.js — 항목 스키마 (기존과 동일)

```js
{
  id: 'kf-01',
  licenceId: 'korean-food',
  subject: 'food-hygiene',
  question: '...',           // 시험 원문 스타일
  simpleQuestion: '...',     // 쉬운 한국어 풀어쓰기 (STEP 1)
  options: ['...', ...],     // 4개
  correctAnswer: 3,          // index
  explanation: '...',        // 시험 원문 해설
  simpleExplanation: '...',  // 쉬운 한국어 해설
  keywords: ['...']          // 태그
}
```

### 4.2 terms.js — 항목 스키마 (기존과 동일)

```js
{
  korean: '...',
  pronunciation: '...',
  category: '...',
  vi: '...', zh: '...', th: '...', tl: '...', my: '...'
}
```

**M1 정책**: th/tl/my 미검수분은 빈 문자열로 두고 UI에서 fallback 처리.

## 5. M2 스케치 (시연 후 재설계)

M1 끝나고 학교 피드백 받은 뒤 별도 brainstorm으로 다시 정의. 후보 항목:

- 관리자/교사 대시보드 (반별 진도·정답률·약점)
- 학생 계정 분리 (Turso DB 마이그레이션 — Phase 2-B 주석에 이미 의도 명시)
- 남은 자격증 3개 콘텐츠 (제빵·미용피부·한식산업기사)
- 5개 언어 완전 검수
- WCAG 2.1 AA 접근성
- 개인정보처리방침·이용약관·운영자 정보 (공공 기준)
- 기관 라이선스/사용량 분석 (B2G·B2B 영업 자료화)

## 6. 비범위 (Out of Scope)

본 설계 문서는 M1에 집중. 다음은 명시적으로 다루지 않음:
- 결제 시스템 통합
- 모바일 앱 (iOS/Android 네이티브)
- 오프라인 모드
- 실시간 동기화
- AI 챗봇/AI 튜터
- 학생 간 소셜 기능

## 7. 위험 및 완화책

| 위험 | 완화책 |
| --- | --- |
| 콘텐츠 저작권 분쟁 | 옵션 A (기출 패턴 분석 후 변형 작성). "기출 변형" 표기. |
| 5개 언어 중 검수 어려운 언어 | M1은 vi/zh만 검수해서 노출, 나머지 "준비 중" |
| 시연 중 마이그레이션 버그 재발 | default deep-merge + ErrorBoundary, 시연 전 Vercel preview에서 다양한 localStorage 시나리오 QA |
| 3주 안에 콘텐츠 다 못 채움 | 자격증 우선순위: 한식조리 → 미용일반 → 제과. 제과 미달성 시 "Coming soon"으로 노출 |
| 교장선생님 일정 변경/시연 갑자기 앞당김 | Week 1 끝에 배포해두면 언제든 URL 공유 가능 |

## 8. 다음 단계

1. 이 설계 문서를 사용자 검토
2. `superpowers:writing-plans` 스킬로 M1의 단계별 실행 계획 생성 (Day 1-15 각 단계의 작업 정의·DoD·검증 방법)
3. 계획 승인 후 Day 1 작업 시작
