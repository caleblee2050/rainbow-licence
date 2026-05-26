# Design System — Rainbow Licence

## Product Context
- **What this is:** 한국 국가기술자격증 학습 PWA (한식조리·미용·제과 등 6개 자격증). 단계별 학습 모드(쉬운 한국어 풀어쓰기 → 키워드 힌트 → 실전 한국어 → 모의고사)와 5개 언어 용어 사전.
- **Who it's for:** NEXT SCHOOL 다문화 학교의 외국인 출신 학생(청소년·성인). 1차 사용자는 학생, 의사결정자는 교장선생님 → 공공사업 평가위원·담당 공무원.
- **Space/industry:** 자격증 학습 / 외국인 한국어 학습 / 다문화 교육 / 공공 교육 사업
- **Project type:** 모바일 우선 반응형 웹 앱 (Next.js App Router)

## Memorable Thing
> "공공기관이 만들 만한 신뢰감 위에, 다국적 학생들이 '내 거다'라고 느끼는 따뜻함과 자랑스러움이 얹힌다."

모든 디자인 결정은 이 한 줄을 위해 작동한다. 어린이 학습앱 슬롭(보라 그라데이션·풀무지개·과한 곡선) 회피, SaaS 슬롭(인터·일률 카드그리드) 회피, 동시에 권위가 차갑지 않게.

## Aesthetic Direction
- **Direction:** Editorial × Multicultural Museum (다문화 박물관 카탈로그 × 학술지)
- **Decoration level:** intentional — 5개 언어 자체를 자랑스러운 시각 요소로 활용. 무지개 풀그라데이션 ❌, 5색 절제 블록·플래그 도트 ✅.
- **Mood:** 차분한 권위 + 흙·종이의 따뜻함. 박물관 전시 카탈로그를 펼친 느낌의 학습 도구.
- **Reference feel:** Smithsonian online catalog, Penguin Classics study guide, 다누리/EBS 진중한 톤

## Color
- **Approach:** restrained — 2개 컬러(딥 틸 + 테라코타) + 따뜻한 모래 배경 + 차콜 텍스트. 무지개·보라 일절 사용 안 함.
- **Primary (Deep Teal):** `#0B5563` — 박물관·차분한 권위·학술 신뢰. UI 크롬·헤더·CTA·선택 강조.
- **Primary Light:** `#16798C` — 호버·세컨더리 강조
- **Primary Soft:** `rgba(11, 85, 99, 0.08)` — 진척바 트랙·약한 배경
- **Accent (Warm Terracotta):** `#C25A3F` — 흙·다문화적 환대. 진척바 채움, 진척 상태, 액센트 디테일에 절제 사용.
- **Accent Soft:** `#E8C4B5` — 가벼운 액센트 배경, 호버 톤
- **Background (Warm Sand):** `#F5EFE6` — 따뜻한 모래색. 종이·페이지 느낌. `#FAFAF7`(차가운) `#F0F2FF`(차가운 라일락) 둘 다 ❌.
- **Surface (Card):** `#FFFFFF` — 카드/패널 배경
- **Border:** `#E5DED2` — 따뜻한 톤의 경계선
- **Text Primary:** `#1E1E1E` — 차콜
- **Text Secondary:** `#5A5048` — 따뜻한 회색
- **Text Muted:** `#8A7E70`
- **Text Inverse:** `#FFFFFF` (딥 틸 배경 위)
- **Semantic:**
  - Success: `#2D7A39` (진중한 그린 — 정답·합격)
  - Warning: `#C77700` (머스타드 — 주의·복습 필요)
  - Error: `#B23A2E` (테라코타 가까운 빨강 — 오답·실패)
  - Info: `#1565C0` (딥 블루 — 정보·도움말)
- **Dark mode:** 향후 M2에서 별도 정의. 단순 invert 금지. 표면 재설계 + 채도 10-20% 감소.

## Typography

### Font Stack
| 역할 | 폰트 | 사유 |
|---|---|---|
| Display (한글 헤딩) | **Pretendard Variable 600-700** | 한글 디스플레이 표준, 다국어 폴백 깔끔 |
| Display (영문/숫자 강조) | **Fraunces** (variable, opsz 24+) | 세리프 → 학술·매거진 신뢰감. Q1·STEP 라벨 등 액센트 |
| Body (한글·다국어) | **Pretendard Variable 400-500** | 다국어 글리프 광범위(베트남어·중국어 fallback) |
| Body (영문 fallback) | **Inter Tight** (또는 Geist) | 한글 없는 영문 컨텍스트 |
| Data/Tables (숫자) | **Geist** (tabular-nums) | 정답률·D-day·점수 등 |
| Mono (발음·코드) | **JetBrains Mono** | `[ho-hwa]` 발음 표기, 코드 |

### Font Loading
- **From:** Google Fonts + Pretendard CDN (cdn.jsdelivr.net/gh/orioncactus/pretendard)
- **Strategy:** `font-display: swap`. Preconnect 추가. Pretendard 가변 폰트 1개 로드로 weight 무한 표현.

### Type Scale (mobile / desktop)
```
display-xl   Fraunces  40px / 56px   line: 1.1   weight: 600
display-lg   Fraunces  32px / 44px   line: 1.15  weight: 600
display-md   Pretendard 28px / 36px   line: 1.2   weight: 700
h1           Pretendard 24px / 32px   line: 1.25  weight: 700
h2           Pretendard 20px / 26px   line: 1.3   weight: 600
h3           Pretendard 18px / 22px   line: 1.35  weight: 600
body-lg      Pretendard 17px / 18px   line: 1.55  weight: 400
body         Pretendard 15px / 16px   line: 1.6   weight: 400
body-sm      Pretendard 13px / 14px   line: 1.55  weight: 400
caption      Pretendard 12px / 12px   line: 1.5   weight: 500
mono         JetBrains  13px / 13px   line: 1.5   weight: 400
data         Geist      14px / 14px   line: 1.4   weight: 500   tabular-nums
```

## Spacing
- **Base unit:** 8px (4px subgrid for hairlines)
- **Density:** comfortable — 학습 도구라 가독성·여유 우선
- **Scale:** `2xs(2) xs(4) sm(8) md(16) lg(24) xl(32) 2xl(48) 3xl(64)`

## Layout

### Approach
**hybrid** — 학습 화면(StudyPage)은 grid-disciplined, 홈·온보딩·꿀팁은 editorial 여백 허용.

### Breakpoints
```
sm   < 640px    모바일 (1열, 하단 5탭 네비)
md   ≥ 640px    태블릿 (1열 + 사이드 패널, 또는 2열)
lg   ≥ 1024px   데스크탑 (좌 사이드바 + 메인 + 우 통계 패널)
xl   ≥ 1280px   와이드 데스크탑 (좌 사이드바 + 더 넓은 메인 + 우 패널)
```

### Desktop 구조 (확정)
- **좌측 사이드바**: 폭 220px. 브랜드 워드마크 상단, 5개 네비 항목(홈/자격증/학습/사전/꿀팁), 하단에 학교명 + 사용자 아바타.
- **메인 콘텐츠**: max-width 720px, 좌측 여백 32px.
- **우측 통계 패널** (학습 화면 한정): 폭 280px. D-day, 오늘 풀이수, 정답률, 복습 카드.

### Grid
- 모바일: 1열, gutter 16px
- 태블릿+: 2-3열 컴포넌트 그리드, gutter 16-24px

### Max Content Width
- 학습 카드·읽기 화면: **720px** (가독성 우선)
- 홈 대시보드·자격증 리스트: **960px**
- 사전: **1080px** (테이블 폭)

### Border Radius
- xs: `4px` — 작은 칩·태그
- sm: `6px` — 인풋·작은 버튼
- md: `8px` — 카드 (현재 24-32px에서 대폭 축소)
- lg: `12px` — 큰 패널·모달
- full: `9999px` — 아바타·언어 플래그 픽
- **금지:** `radius-2xl(32px)` 같은 토이 라운드는 사용하지 않음

### Shadow
- `shadow-xs: 0 1px 2px rgba(30, 30, 30, 0.04)` — 카드 1단계
- `shadow-sm: 0 2px 4px rgba(30, 30, 30, 0.06), 0 1px 2px rgba(30, 30, 30, 0.04)` — 카드 hover·기본 패널
- `shadow-md: 0 4px 12px rgba(30, 30, 30, 0.08), 0 2px 4px rgba(30, 30, 30, 0.04)` — 모달·팝오버
- 무지개·컬러 글로우 ❌

## Motion

### Approach
**minimal-functional** — 학습 도구는 모션이 학습 방해. 의미 없는 애니메이션 ❌. 의미 있는 상태 전환만.

### Easing
- enter: `cubic-bezier(0, 0, 0.2, 1)` (ease-out)
- exit: `cubic-bezier(0.4, 0, 1, 1)` (ease-in)
- move: `cubic-bezier(0.4, 0, 0.2, 1)` (ease-in-out)

### Duration
- micro (호버·상태): 80-120ms
- short (페이드·슬라이드 in): 180-240ms
- medium (페이지 전환·모달): 280-380ms
- long: 거의 사용 안 함. 정답 confetti 정도만 (700ms).

### 허용되는 모션
- 정답 시 ✅ 체크 페이드인 + 가벼운 확정 confetti
- 페이지 전환 가벼운 페이드/슬라이드
- 호버 시 카드 살짝 떠오름 (translateY -1px)

### 금지 모션
- 자동재생 캐러셀
- 끊임없는 펄스·반짝임 효과
- 헤더 컬러 사이클링

## 5-Language Identity

브랜드의 핵심 시각 자산. 보이지 않게 숨기지 않고, **자랑스럽게** 노출. 다만 절제하여.

### 표현 패턴
1. **헤더 언어 픽**: 현재 선택 언어 플래그 + 라벨 노출. 그 아래 작은 점 5개 (각 언어 색)로 "5개 언어 모두 지원" 시각화.
2. **온보딩 카드**: 5개 언어 카드 동등 크기, 동등 무게. "주류"가 없음을 시각적으로 표현.
3. **사전 검색 결과**: 한국어 단어 + 발음 + 5개 언어 번역 동시 노출.

### 5-Language Color Codes (디테일 표시용, 메인 팔레트와 별개)
```
vi (베트남어)    #C25A3F   testaccotta — 우리 액센트와 일치
zh (중국어)      #B91C1C   진중한 빨강
th (태국어)      #1F6F8B   가벼운 청록
tl (필리핀어)    #2D7A39   진중한 그린
my (미얀마어)    #6B4226   따뜻한 브라운
```

(이 5색은 **풀 그라데이션으로 사용 ❌**. 작은 도트·플래그 칩 같은 디테일에만 사용.)

## Component Tokens (요약)

### Button
- **Primary**: `bg: var(--primary)` `text: white` `radius: md` `padding: 12px 24px` `weight: 600`
  - hover: `bg: var(--primary-light)`
  - active: `transform: translateY(1px)`
- **Secondary**: `bg: transparent` `border: 1px solid var(--primary)` `text: var(--primary)`
- **Ghost**: `bg: transparent` `text: var(--text-secondary)`
- **CTA (학습 시작·정답 확인)**: full-width on mobile, max-width 320px on desktop

### Card (학습 옵션 카드)
- `bg: white` `border: 1px solid var(--border)` `radius: md` `padding: 16px 20px`
- 선택 시: `border: 2px solid var(--primary)` `bg: var(--primary-soft)`
- 정답: `border: 2px solid var(--success)` `bg: rgba(45, 122, 57, 0.06)`
- 오답: `border: 2px solid var(--error)` `bg: rgba(178, 58, 46, 0.06)`

### Tag / Pill (STEP·과목·언어 등)
- `radius: full` `padding: 4px 10px` `font-size: 12px` `weight: 500`
- 색상 분기: 기본 회색, primary는 틸, accent는 테라코타

### Input
- `border: 1px solid var(--border)` `radius: sm` `padding: 10px 14px`
- focus: `border: 2px solid var(--primary)` `box-shadow: 0 0 0 3px var(--primary-soft)`

### Bottom Nav (모바일)
- `bg: white` `border-top: 1px solid var(--border)` `height: 64px`
- 활성: `color: var(--primary)`, 아이콘 위 작은 점

### Side Nav (데스크탑)
- `bg: var(--primary)` 또는 `bg: var(--bg)` `width: 220px`
- 활성 항목: 좌측 4px 액센트 바

## Approved Design Direction
**Variant D2 — Deep Teal + Terracotta**
- 모바일 목업: `docs/superpowers/designs/2026-05-26/d2-teal-mobile.png`
- 데스크탑 목업: `docs/superpowers/designs/2026-05-26/d2-teal-desktop.png`
- 비교 보드: `docs/superpowers/designs/2026-05-26/compare.html`

## 안티슬롭 (이 시스템에서 절대 안 함)
- 보라/바이올렛 그라데이션 (`#667EEA → #764BA2` 등)
- 풀 무지개 그라데이션 (브랜드명 Rainbow 함정)
- 핫핑크 액센트 (`#FF6B9D` 등)
- Inter / Roboto / Open Sans / Space Grotesk (오버유즈 폰트, AI 슬롭 시그널)
- system-ui 단독 폰트 (타이포 포기 시그널)
- 32px+ 라운드 (토이 느낌)
- 우주박스·랜덤 블롭 배경
- 중앙정렬 일색
- 3열 아이콘 카드 그리드 (SaaS 슬롭)

## Decisions Log
| Date | Decision | Rationale |
|---|---|---|
| 2026-05-26 | 시스템 V3 채택 — Editorial × Multicultural Museum | 메모러블 띵(공공 신뢰 + 다문화 따뜻함) 달성. 기존 V2(보라 그라데이션·풀무지개)는 AI 슬롭 패턴 + 어린이 학습앱 인상으로 공공 평가 부적합 판단 |
| 2026-05-26 | Pretendard + Fraunces 페어링 채택 | 한글 디스플레이 표준 + 세리프 학술 신뢰. 다국어 폴백 자동화 |
| 2026-05-26 | 보라 그라데이션 폐지 | AI 슬롭 안티패턴. 공공 평가위원 인상 부정적 |
| 2026-05-26 | 5색 그라데이션 → 5색 절제 디테일 | 다양성 시각화는 유지하되 어린이앱 느낌 제거 |
| 2026-05-26 | radius xl/2xl(24-32px) → md(8-12px) 축소 | 토이 느낌 제거, 학습 도구다움 회복 |
