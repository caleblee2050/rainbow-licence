# Rainbow Licence — 세션 핸드오프 (2026-05-27)

> 다음 세션이 시작되면 이 파일부터 읽고 컨텍스트 복원할 것.

## 📊 현재 좌표

**프로젝트**: 한국 국가기술자격증 학습 PWA. 다문화 학교(NEXT SCHOOL) 학생 + 공공사업 평가위원이 1차 사용자/의사결정자.

**프로덕션 URL**: https://rainbow-licence.vercel.app  
**저장소**: https://github.com/caleblee2050/rainbow-licence  
**브랜치**: `main`, origin보다 **20 commits ahead** (아직 push 안 함)

## ✅ M1 시연 베타 — 완료 (2026-05-26)

13 tasks 모두 끝나고 Vercel production 배포까지 완료. 디자인 V3 (Deep Teal + Terracotta) + 콘텐츠 3개 자격증 (180 문제 + 120 용어) + DEMO 모드 + 시연 친화.

핵심 산출물:
- `docs/superpowers/specs/2026-05-26-rainbow-licence-beta-design.md` — 베타 설계
- `DESIGN.md` — D2 디자인 시스템 (Deep Teal `#0B5563` + Terracotta `#C25A3F`)
- `docs/superpowers/plans/2026-05-26-m1-demo-beta.md` — M1 13 tasks 계획
- `docs/superpowers/designs/2026-05-26/` — 9개 AI 목업 + 비교 보드

## 🚨 M1.5 다국어 본질 복원 — 진행 중 (2026-05-27)

### 발견된 문제

시연 베타 검토 중 사용자가 발견: **5개 언어 헤더 디테일은 있지만 실질 콘텐츠는 한국어 only**. STEP 1 "번역" 모드도 한국어 풀어쓰기일 뿐 모국어 번역 없음. "다문화 도구"가 아니라 "한국어 시험앱" 수준.

내가 처음 brainstorming할 때 "쉬운 한국어가 더 학습 효과 있다"고 합리화한 게 잘못. 실제로는 모국어 번역 데이터가 빠진 상태였음.

### M1.5 계획 (사용자 옵션 A 선택 — 본질 회복)

`docs/superpowers/plans/2026-05-27-multilingual-restoration.md` — 8 tasks:

1. **M1.5-1 ✅ 완료** (`e910b3c`) — 스키마 + 헬퍼 + 테스트
   - `src/lib/translations.js` 신규: `getTranslatedQuestion`, `getTranslatedOptions`, `getTranslatedExplanation`, `getKeywordHints`, `isLangVerified`, `getLangBadge`, `LANG_CODES`, `VERIFIED_LANGS`
   - `demoMode.js`: `getLanguageStatus` returns `'verified'`/`'ai-translation'` (was `'preview'`)
   - 콘텐츠 가드 테스트 placeholders (`it.skip`) 3개 자격증

2. **M1.5-2 ✅ 완료** (`1785c7c`) — 한식조리 60Q × 5언어
   - `translations.{vi,zh,th,tl,my}.{question,options,explanation}` 60문제 채움
   - `keywordHints.{vi,zh,th,tl,my}[].{korean,native}` 4-8개씩 5언어 채움
   - 콘텐츠 가드 3개 테스트 활성화, 통과
   - 작업 시간 88분 (sonnet 서브에이전트)
   - **품질 검증 완료** — vi/zh 자연스럽고 정확, th/tl/my "AI 번역" 표기로 노출 예정

3. **M1.5-3 ❌ 2회 실패** — 미용일반 60Q × 5언어
   - 1차 시도 (sonnet): 90분 작업 후 빈손 종료. Working tree clean, 0 진행.
   - 2차 시도 (opus): 9분 후 "socket closed unexpectedly" 에러. 0 진행.
   - **명백한 한계**: 60Q×5언어 한 턴 dispatch는 안 됨. 분할 필요.

4. **M1.5-4 ⏳ 미시작** — 제과 60Q × 5언어
5. **M1.5-5 ⏳ 미시작** — StudyPage 3-mode 재설계 (한+모국 병행 / 키워드 popover / ❓ 토글)
6. **M1.5-6 ⏳ 미시작** — 진단 결과 → 초기 모드 매핑 + 5언어 정책 변경
7. **M1.5-7 ⏳ 미시작** — DictionaryPage 5언어 전체 노출
8. **M1.5-8 ⏳ 미시작** — Vercel 재배포 + 시나리오 검증

## 🛠 수정한 파일 (이번 세션)

```
Created:
- docs/superpowers/specs/2026-05-26-rainbow-licence-beta-design.md
- docs/superpowers/plans/2026-05-26-m1-demo-beta.md
- docs/superpowers/plans/2026-05-27-multilingual-restoration.md
- docs/superpowers/designs/2026-05-26/ (9 mockups + compare.html)
- CLAUDE.md, DESIGN.md
- src/lib/demoMode.js, src/lib/translations.js
- src/lib/__tests__/*.test.js (multiple)
- src/components/ErrorBoundary.js
- src/data/questions/{korean-food,beauty-general,pastry}/index.js (split)
- src/data/terms/{korean-food,beauty-general,pastry}/index.js (split)
- src/data/__tests__/{korean-food,beauty-general,pastry}.test.js
- .env.example, .env.local
- vitest.config.mjs
- walkthrough.md (이 파일)

Modified:
- src/app/layout.js, src/app/globals.css (V3 tokens)
- src/components/layout/{TopNav,BottomNav}.js
- src/components/ui/PremiumBanner.js
- src/components/pages/{HomePage,OnboardingPage,StudyPage,LicencePage,DictionaryPage,CommunityPage}.js
- src/lib/studyEngine.js (migration fix)
- src/data/questions.js, src/data/terms.js (re-export to split files)
- src/data/questions/korean-food.js (+translations +keywordHints — 6411 lines)
- src/data/terms/{korean-food,beauty-general,pastry}.js
- package.json (vitest + plugin-react + jsdom + testing-library)
- .gitignore (.env.local exclusion)
```

## 🔍 미해결 이슈

### 1. 미용·제과 다국어 번역 미완료 (M1.5-3, M1.5-4)
- 60Q × 5언어 한 턴 처리 불가능 확인
- 다음 세션에서 **chunk 전략** 필요

### 2. 다국어 번역 후속 작업 (M1.5-5~8)
- StudyPage 재설계 (3-mode 실효화)
- 진단 → 자동 모드 매핑
- DictionaryPage 5언어 전체 노출 (데이터는 이미 있음, 정책만 풀면 됨)
- Vercel 재배포

### 3. Git push 안 됨
- 20 commits ahead of origin/main
- `git push` 필요 (사용자 결정 시 실행)

### 4. 사전 변경 사항 (이전 세션 영향)
- `.gitignore`, `package-lock.json`에 unstaged 변동 있었으나 작업 중 해소됨

## 🎯 다음 세션 작업 — 추천 순서

### 옵션 A — 본래 계획 그대로 (chunks로 분할)
다음 세션에서 미용·제과 콘텐츠를 chunk 분할로 마저 작성:
1. M1.5-3a: 미용 bg-01~20 (sonnet, ~30분)
2. M1.5-3b: 미용 bg-21~40 (sonnet, ~30분)
3. M1.5-3c: 미용 bg-41~60 (sonnet, ~30분)
4. M1.5-4a-c: 제과 ps-01~20, ps-21~40, ps-41~60 (~1.5시간)
5. M1.5-5: StudyPage 재설계 (~30분, 코드 작업)
6. M1.5-6: 진단 → 모드 매핑 (~20분)
7. M1.5-7: DictionaryPage (~15분)
8. M1.5-8: 배포 + 검증 (~20분)
**총 추정**: 3.5-4.5시간

### 옵션 B — 현실적 시연 위주 축소
한식조리만으로 충분히 다국어 학습 데모 가능. 미용·제과는 M2:
1. **건너뛰기**: M1.5-3, M1.5-4 (미용·제과 5언어)
2. **즉시 진행**: M1.5-5 (StudyPage 재설계), M1.5-6, M1.5-7, M1.5-8
3. **교장선생님 안내**: "한식조리는 5언어 완성, 미용·제과는 한국어 + 다국어 진행 중" 명시
**총 추정**: ~1.5시간

### 옵션 C — 정직한 단계 분할
한식조리 다국어 시연 환경 즉시 배포 후, 미용·제과는 별도 다음 sprint:
1. M1.5-5~8 즉시 실행 (한식조리만 다국어 활성)
2. 시연 후 사용자 피드백 받고 M1.5-3, M1.5-4 결정
**총 추정**: ~1.5시간

### 추천
**옵션 C**가 가장 안전. 한식조리만으로도 다국어 학습 차별점은 충분히 시연 가능하고, 평가위원 반응 보고 나머지 자격증 콘텐츠 확장 결정 가능.

## 🔑 다음 세션 진입 시 즉시 할 일

1. 이 `walkthrough.md` 파일 읽기
2. `git log --oneline -25` 로 커밋 히스토리 확인
3. 사용자에게 옵션 A/B/C 어느 길로 갈지 확인
4. 결정에 따라 해당 task부터 dispatch

## 💡 학습/주의사항

- **서브에이전트 작업 단위**: 60문제 × 5언어 (= ~3300 string translations) 한 턴 불가. 20문제 chunk가 최대 안전 단위로 보임.
- **Co-Authored-By footer**: 서브에이전트는 그 푸터 붙이면 안 됨 (Claude Opus 4.7 사칭으로 harness가 경고). 명시적으로 "no Co-Authored-By footer" 지시 필수.
- **한식조리 번역 품질 검증 완료**: vi/zh 도메인 정확, th/tl/my 도 자연스러움. 같은 quality bar 유지.
