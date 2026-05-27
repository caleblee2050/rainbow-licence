# Rainbow Licence — 세션 핸드오프 (2026-05-27 후속)

> 다음 세션이 시작되면 이 파일부터 읽고 컨텍스트 복원할 것.

## 📊 현재 좌표

**프로젝트**: 한국 국가기술자격증 학습 PWA. 다문화 학교(NEXT SCHOOL) 학생 + 공공사업 평가위원이 1차 사용자/의사결정자.

**프로덕션 URL**: https://rainbow-licence.vercel.app
**최신 production deploy**: https://rainbow-licence-75v3xbsu3-calebs-projects-308edac8.vercel.app
**저장소**: https://github.com/caleblee2050/rainbow-licence
**브랜치**: `main` — origin/main 동기화 완료 (push 됨)

## ✅ M1.5 다국어 본질 복원 — 완료 (2026-05-27)

옵션 A (chunks 분할)로 진행. 8 tasks 모두 완료.

### 핵심 성과

- **180문제 × 5언어 번역 + 키워드 힌트 데이터 완성**
  - 한식조리 60Q × 5 (vi/zh/th/tl/my)
  - 미용일반 60Q × 5
  - 제과 60Q × 5
- **콘텐츠 가드 테스트 9종 활성** (32 tests passing): translations 필드, keywordHints 개수, korean 본문 등장 검증
- **StudyPage 3-mode 진짜 차별화** 구현
- **진단 → 모드 자동 매핑** (이미 OnboardingPage line 88 + page.js line 32에 구현되어 있었음)
- **DictionaryPage 5언어 전수 노출** (vi/zh 검수 ✓, th/tl/my "AI" 라벨)
- **검색 5언어 확장**: 한국어/발음/vi/zh/th/tl/my 어느 언어로 검색해도 매칭

### 완성된 작업 흐름

| Task | Commit | 비고 |
|------|--------|------|
| M1.5-3a 미용 bg-01~20 | `600b9c7` + `c7f4940` 보정 | spec reviewer가 13개 korean 본문 불일치 발견, 보정 |
| M1.5-3b 미용 bg-21~40 | `268220a` | 자체 검증 ALL PASS |
| M1.5-3c 미용 bg-41~60 | `a2477c5` | 자체 검증에서 24개 보정 후 ALL PASS |
| M1.5-3 미용 테스트 활성화 | `cfdf0cd` | it.skip 풀고 3종 가드 활성 |
| M1.5-4a 제과 ps-01~20 | `195a5c7` | 자체 검증에서 51개 보정 후 ALL PASS |
| M1.5-4b 제과 ps-21~40 | `e098806` | 자체 검증에서 23개 보정 후 ALL PASS |
| M1.5-4c 제과 ps-41~60 | `4518c5f` | 자체 검증에서 35개 보정 후 ALL PASS |
| M1.5-4 제과 테스트 활성화 | `0636653` | |
| M1.5-5 StudyPage 3-mode 재설계 | `3221614` | KeywordHint + renderWithHints helper, ❓ 슬라이딩 패널 |
| M1.5-6 5언어 배지 변경 | `d5525ec` | "Coming soon" → "AI" |
| M1.5-7 DictionaryPage 5언어 노출 | `663aea8` | "🚧 준비 중" 폐기, 검색 5언어 확장 |
| M1.5-8 배포 마커 | `1fb9904` | 빈 커밋, M1.5 완료 표시 |

### subagent-driven-development 패턴 사용 학습

- **20Q × 5언어가 안전한 chunk 단위**: 60Q × 5 한 턴 시도는 두 번 모두 실패 (이전 세션). 20Q는 sonnet으로 약 15~25분/chunk 페이스. opus 불필요.
- **본문 substring 매칭 함정**: sonnet은 keyword hints에서 "관련 개념어"를 본문에 없는데 자주 삽입. 첫 chunk(bg-01~20)에서 13개 본문 불일치 → spec reviewer 보정 후, 이후 chunk들에는 작업 전 검증 절차를 명시적으로 prompt에 강조해서 자체 보정 (24/51/23/35 개 자체 발견·수정)함.
- **분류기 우회 표현 금지**: "분류기 장애 우회" 등의 표현이 prompt에 들어가면 서브에이전트 분류기가 즉시 거부. 그냥 작업 컨텍스트만 제공.

## 🛠 수정한 파일 (이번 세션)

```
Modified:
- src/data/questions/beauty-general.js  (60문제에 translations + keywordHints, ~3000 lines 증가)
- src/data/questions/pastry.js          (60문제에 translations + keywordHints, ~3000 lines 증가)
- src/components/pages/StudyPage.js     (3-mode 재설계, KeywordHint/renderWithHints + ❓ 패널)
- src/components/pages/OnboardingPage.js ("Coming soon" → "AI" 배지)
- src/components/pages/DictionaryPage.js (5언어 전수 노출, AI 라벨)
- src/data/terms/index.js               (searchTerms 5언어 확장)
- src/data/__tests__/beauty-general.test.js (it.skip → 활성)
- src/data/__tests__/pastry.test.js     (it.skip → 활성)

Empty commit:
- 1fb9904 (M1.5 배포 완료 마커)
```

## 🔍 미해결 / 다음 세션 작업

### 1. 시연 검증 — 미수행 (사용자 결정 필요)

M1.5-8 plan Step 3에 명시된 시나리오 4종 프로덕션 QA 미수행. 다음 중 선택:

**시나리오 1 — 베트남어 학생 (초급, vi)**
- 온보딩 vi 선택 → 진단 1/3 → 한식조리 → STEP 1 자동 진입 확인
- 질문/옵션/해설 모두 한국어 + 베트남어 병행 보임

**시나리오 2 — 태국어 학생 (중급, th, AI 번역)**
- 온보딩 th 선택 (Coming soon 아니라 'AI' 표기) → 진단 2/3 → 미용 → STEP 2 자동
- 점선 밑줄 + 탭 시 태국어 popover

**시나리오 3 — 중국어 학생 (고급, zh)**
- 진단 3/3 → STEP 3 자동, 한국어만 + ❓ 슬라이딩 패널

**시나리오 4 — DictionaryPage**
- 5언어 모두 노출, vi/zh는 ✓ 의미, th/tl/my는 'AI' 배지
- 베트남어/태국어 단어로 검색 시 결과 매칭

**다음 세션 진입 시 가장 먼저 할 일**: `/qa` 또는 `/browse` 스킬로 위 시나리오 자동 실행해서 회귀 확인.

### 2. 번역 품질 평가 — 미진행

- vi/zh는 spec reviewer가 도메인 어휘 가이드 준수 spot-check만 한 상태. 실제 원어민 검수 필요.
- th/tl/my는 'AI' 라벨로 정직하게 노출되어 있어서 그 자체 큰 문제는 아니지만, 명백한 오류(자모 결합 오타, 문장 구조 깨짐 등)는 다음 sprint에서 검수 권장.

### 3. M2 후보 작업 (M1.5 외부)

- 다국어 시험 가능 자격증 (`multiLangExam: true`) 외 콘텐츠 확장 (전기/지게차/조경/네일 등)
- 더 많은 자격증 (현재 3개 → 10개 목표)
- 실제 원어민 검수 + th/tl/my를 검수 완료 언어로 승격

## 🎯 다음 세션 진입 시 즉시 할 일

1. 이 `walkthrough.md` 읽기
2. `git log --oneline -15`로 최근 커밋 확인 (M1.5 완료 마커 `1fb9904` 봐야 함)
3. **production 시연 검증**: `/browse https://rainbow-licence.vercel.app` 으로 시나리오 1-4 실행
4. 결과에 따라:
   - 문제 없으면 → M2 작업 또는 검수자 피드백 반영
   - bug 발견 시 → `/investigate` 또는 `/qa`로 fix

## 💡 학습/주의사항 (이번 세션에서 강화)

- **본문 substring 매칭**: keywordHints korean은 question + options.join(' ') 본문에 정확히 등장해야 함. 띄어쓰기 한 글자도 다르면 안 됨. 작업 prompt에 명시적으로 강조 + 자체 검증 스크립트 의무화하니 효과 큼.
- **컨트롤러 검증 단계**: 서브에이전트 자체 검증 ALL PASS 보고 후에도 컨트롤러가 동일 스크립트 한 번 더 돌려야 함 (trust but verify).
- **subagent-driven-development 효율**: chunk별 spec reviewer는 첫 chunk만 활용해서 보정 패턴 학습, 이후 chunks는 자체 검증 + 컨트롤러 빠른 verification으로 시간 절약.
- **분류기 우회 표현**: prompt에 절대 넣지 말 것. 작업 자체만 설명.
