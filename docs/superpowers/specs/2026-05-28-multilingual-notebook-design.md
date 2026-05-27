# 다국어 학습 자료 노트 (Notebook) — M2 설계

**작성일**: 2026-05-28
**범위**: M2 스프린트 (M1.5 다국어 본질 복원 직후 다음 큰 기능)
**연관 문서**: `2026-05-26-rainbow-licence-beta-design.md` (베타 설계), `DESIGN.md` (V3 디자인 시스템)

## 1. 개요

다문화 학생이 자기 교재(PDF)·강의노트(텍스트)를 자격증 학습 풀에 추가하면, 서버가 자동으로 **요약 + 핵심개념 + 객관식 문제**를 생성하고 **5언어로 번역**한다. 생성물은 기존 `StudyPage`와 `DictionaryPage`에 자격증 단위로 통합되어 자동 노출된다.

이전 sprint들에서는 공식 콘텐츠 180문제 × 5언어를 손수 작성했다. M2에서는 학생이 자기 자료로 동일 품질의 학습 패키지를 생성할 수 있게 만든다.

핵심 가치 한 줄: **"교재만 던지면, 5언어 풀어쓴 학습 풀이 자동으로 자란다."**

## 2. 왜 이 기능이 지금 필요한가

M1.5 시연 베타 검토에서 다음이 확인됐다:
- 다문화 학생은 자격증 종류별로 다양한 교재·강의노트를 이미 가지고 있다.
- 그러나 한국어로 된 자료라 자기 모국어로 정리·이해하지 못한다.
- 단순 번역(파파고·구글) 으로는 시험에 도움 안 된다. 핵심 개념 추출과 문제 풀이가 필요하다.
- 공식 콘텐츠 180문제만으로는 모의고사 풀이 부족.

이 기능은 학생이 가진 자료 자산을 학습 자산으로 자동 전환한다. NotebookLM의 다국어·자격증 시험 특화 버전이다.

## 3. 결정 기록 (brainstorming 세션 Q1~Q9)

| Q | 결정 | 의미 |
|---|------|------|
| Q1 | A+C | 학생 직접 등록 + AI 반자동 후보 제시, 두 진입점 (단 AI 후보 제시는 M3로 미룸) |
| Q2 | D | 요약 + 핵심개념 + 자동 객관식 문제 모두 생성 (단순 번역 아님) |
| Q3 | A | 자격증 단위 통합 (Study/Dictionary에 자동 노출) |
| Q4 | B | 텍스트 + PDF만 (URL/YouTube는 M3) |
| Q5 | B | Turso DB + 인증 시스템 도입 |
| Q6 | A | 개인 자료만 (학교 공유 풀 없음) |
| Q7 | C | AI 후보 제시는 반자동 (단 M2 외부) |
| Q8 | X | 자료 중심 아키텍처 (자격증 단위 노출, 중복 일단 허용) |
| Q9 | A | spec 그대로 진행 |

## 4. 사용자 흐름

### 4.1 첫 진입 (시연 모드)

1. 학생이 앱 진입 (이미 온보딩 완료된 상태 가정)
2. 자격증 화면(예: 한식조리) 진입 → 기존 탭 + 신규 탭 **"내 자료"**
3. **"내 자료"** 탭이 비어있다면 안내: *"여기에 자료를 추가하면 자동으로 학습 패키지가 만들어져요."*

### 4.2 자료 추가 — 직접 등록

1. **"자료 추가"** 버튼 → 선택지 두 개
   - **텍스트 붙여넣기**: textarea + 자료 제목 입력
   - **PDF 업로드**: file picker (1개씩, 10MB 한도)
2. **자격증 자동 태그**: 현재 보고 있는 자격증 ID로 자동 설정 (사용자가 변경 가능)
3. **"등록"** → 자료가 `sources` 테이블에 `status='pending'`으로 저장
4. 즉시 **"내 자료"** 목록에 새 카드 추가 (처리 진행률 표시)

### 4.3 백그라운드 처리

자료 등록 직후 비동기 파이프라인 시작. 사용자는 다른 작업 가능. 카드에 단계별 상태 표시.

```
pending → extracting → summarizing → translating → done
                                              ↓
                                          failed (재시도 버튼)
```

### 4.4 처리 완료 후

1. 카드가 `done` 상태로 전환. 사용자에게 알림 (in-app banner).
2. 카드 클릭 → **자료 상세 페이지**
   - 요약 (한국어 + 사용자 모국어)
   - 추출된 핵심개념 N개
   - 생성된 객관식 문제 N개 (미리보기)
3. 동시에 같은 자격증의:
   - **DictionaryPage**: 추출된 개념이 사용자 모드 섹션에 추가됨
   - **StudyPage**: 학습 묶음 선택지에 "내 자료: [자료 제목] (N문제)" 항목 추가

### 4.5 학습

학생은 기존 모드(STEP 1/2/3)를 그대로 사용. 단지 풀에 사용자 자료의 문제가 추가되어 있을 뿐. 모든 다국어·키워드 힌트·해설 UX 동일.

## 5. 데이터 모델 (Turso SQL)

### 5.1 마이그레이션 컨텍스트

기존 학습 데이터는 `localStorage` 기반(SM-2 카드, 스트릭, 통계). M2에서 Turso DB를 도입하지만 **기존 localStorage 데이터는 계속 작동**한다.

- 신규 데이터(users, sources, summaries, concepts, problems, user_progress 등)는 Turso에 저장
- 기존 SM-2 카드·통계는 localStorage에서 점진 마이그레이션 (별도 sprint)
- M2 핵심은 **새 기능을 Turso에 안착**하는 것

### 5.2 스키마

```sql
-- 사용자
CREATE TABLE users (
  id TEXT PRIMARY KEY,                          -- uuid
  email TEXT UNIQUE,                            -- nullable for anonymous device users
  device_id TEXT UNIQUE,                        -- localStorage uuid for device-bound auth
  school_code TEXT,                             -- 'NEXT_SCHOOL' 등
  display_name TEXT,
  language TEXT NOT NULL DEFAULT 'vi',          -- vi/zh/th/tl/my
  korean_level TEXT,                            -- beginner/intermediate/advanced
  created_at INTEGER NOT NULL                   -- unix ms
);

-- 사용자 등록 자료
CREATE TABLE sources (
  id TEXT PRIMARY KEY,                          -- uuid
  user_id TEXT NOT NULL REFERENCES users(id),
  licence_id TEXT NOT NULL,                     -- korean-food | beauty-general | pastry
  type TEXT NOT NULL,                           -- text | pdf
  title TEXT NOT NULL,                          -- 사용자 입력 제목
  original_filename TEXT,                       -- PDF인 경우
  raw_text TEXT,                                -- 추출된 텍스트 (PDF 파싱 후 또는 사용자 입력)
  status TEXT NOT NULL DEFAULT 'pending',       -- pending | extracting | summarizing | translating | done | failed
  status_message TEXT,                          -- 실패 시 에러 메시지
  domain_score REAL,                            -- 0~1, AI 사전 분류 (자격증 도메인 적합도)
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- 자료당 1개 요약 (5언어 모두 한 row)
CREATE TABLE summaries (
  id TEXT PRIMARY KEY,
  source_id TEXT NOT NULL UNIQUE REFERENCES sources(id) ON DELETE CASCADE,
  ko_text TEXT NOT NULL,                        -- 한국어 원문 요약 (~500자)
  vi_text TEXT,
  zh_text TEXT,
  th_text TEXT,
  tl_text TEXT,
  my_text TEXT,
  created_at INTEGER NOT NULL
);

-- 자료당 N개 개념
CREATE TABLE concepts (
  id TEXT PRIMARY KEY,
  source_id TEXT NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  korean TEXT NOT NULL,                         -- 한국어 용어
  korean_definition TEXT NOT NULL,              -- 한국어 정의
  pronunciation TEXT,                           -- 발음 표기
  category TEXT,                                -- 사용자 자료의 단원/주제 (자유 텍스트)
  vi TEXT, zh TEXT, th TEXT, tl TEXT, my TEXT,  -- 5언어 번역 (단어만)
  vi_def TEXT, zh_def TEXT, th_def TEXT,
  tl_def TEXT, my_def TEXT,                     -- 5언어 정의 번역
  created_at INTEGER NOT NULL
);

-- 자료당 N개 객관식 문제 (기존 콘텐츠 스키마와 호환)
CREATE TABLE problems (
  id TEXT PRIMARY KEY,
  source_id TEXT NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  ko_question TEXT NOT NULL,
  ko_options_json TEXT NOT NULL,                -- ["옵션1", "옵션2", "옵션3", "옵션4"]
  correct_answer INTEGER NOT NULL,              -- 0~3
  ko_explanation TEXT NOT NULL,
  ko_simple_explanation TEXT,                   -- 쉬운 한국어 풀어쓰기
  translations_json TEXT NOT NULL,              -- 기존 형식: {vi: {question,options[4],explanation}, zh:..., th:..., tl:..., my:...}
  keyword_hints_json TEXT NOT NULL,             -- 기존 형식: {vi: [{korean, native}], zh:..., ...}
  created_at INTEGER NOT NULL
);

-- 인덱스
CREATE INDEX idx_sources_user_licence ON sources(user_id, licence_id);
CREATE INDEX idx_concepts_source ON concepts(source_id);
CREATE INDEX idx_problems_source ON problems(source_id);
```

### 5.3 기존 콘텐츠와의 관계

기존 공식 콘텐츠는 정적 JS 파일(`src/data/questions/*.js`, `src/data/terms/*.js`)에 그대로 둔다. 사용자 콘텐츠(`problems`, `concepts`)는 Turso. 조회 시 클라이언트가 두 소스를 머지한다.

```
StudyPage.getProblemsForLicence(licenceId) =
  officialProblems(licenceId)        // 정적 JS, 60문제
  + userProblems(userId, licenceId)  // Turso 쿼리, N문제
```

`problems` 테이블의 `translations_json`과 `keyword_hints_json`은 기존 공식 콘텐츠 스키마(`src/data/questions/korean-food.js`의 kf-01 형식)와 **정확히 동일**하다. 그래서 StudyPage 렌더 로직 변경 없이 사용자 문제를 그대로 표시 가능.

## 6. API 엔드포인트

모두 Next.js Route Handlers (App Router, `src/app/api/`).

| Method | Path | 역할 |
|---|---|---|
| POST | `/api/auth/magic-link` | 매직 링크 발송 (Resend) |
| GET | `/api/auth/verify` | 매직 링크 토큰 검증 + 세션 발급 |
| POST | `/api/auth/device-anon` | 시연 모드 익명 device 계정 생성 |
| GET | `/api/me` | 현재 사용자 프로필 |
| POST | `/api/sources` | 자료 등록 (text 또는 multipart/form-data PDF) |
| GET | `/api/sources?licence_id=X` | 자격증별 사용자 자료 목록 |
| GET | `/api/sources/[id]` | 자료 상세 + 처리 상태 + 생성물 요약 |
| POST | `/api/sources/[id]/process` | 처리 시작 (이미 처리 중이면 멱등) |
| POST | `/api/sources/[id]/retry` | 실패한 단계 재시도 |
| DELETE | `/api/sources/[id]` | 자료 삭제 (관련 생성물 CASCADE) |
| GET | `/api/licences/[id]/concepts` | 사용자가 추가한 그 자격증 개념 목록 |
| GET | `/api/licences/[id]/problems` | 사용자가 추가한 그 자격증 문제 목록 |

## 7. AI 파이프라인

### 7.1 단계 (각 단계 후 DB status 업데이트)

| 단계 | 입력 | 출력 | 비용(추정) |
|---|---|---|---|
| 1. extracting | PDF 파일 또는 텍스트 입력 | `sources.raw_text` | $0 (pdf-parse) |
| 1.5 도메인 분류 | raw_text + licence_id | `sources.domain_score` (0~1) | ~$0.01 |
| 2. summarizing | raw_text | `summaries.ko_text` | ~$0.10 |
| 3. concept extraction | raw_text | 한국어 `concepts` N개 | ~$0.15 |
| 4. problem generation | raw_text + concepts | 한국어 `problems` 5~10개 | ~$0.30 |
| 5. translating | 한국어 요약/개념/문제 | 5언어 번역 + keywordHints | ~$1.00 |
| **총** | | | **~$1.55/자료** |

### 7.2 모델 선택

- 모든 단계 **Claude Sonnet 4.6** (`claude-sonnet-4-6`).
- 프롬프트는 한국어로 작성하되 출력은 단계별 스키마 강제(JSON mode).
- M1.5의 콘텐츠 가드(keywordHints.korean이 본문에 등장)와 동일한 후처리 검증 통과 시까지 1회 재시도.

### 7.3 실행 방식

Vercel Functions의 백그라운드 처리. `POST /api/sources/[id]/process`는 즉시 반환하고 처리는 비동기. 클라이언트는 `GET /api/sources/[id]`로 폴링(2~5초 간격) 또는 Server-Sent Events.

M2 첫 컷은 폴링. SSE는 M3.

## 8. 인증

### 8.1 두 가지 모드

**시연 모드 (initial state, 비로그인)**
- 학생이 학교 코드(예: `NEXT_SCHOOL_DEMO`) 입력 → `device_id`(localStorage uuid) 기반 익명 계정 자동 생성.
- 이메일 없음. 그 디바이스에서만 자료 접근 가능.
- 시연 임팩트 최대화. 학생이 가입 절차 없이 바로 자료 등록 가능.

**정식 모드 (이메일 매직 링크)**
- "자료를 다른 기기에서도 보고 싶나요?" 안내 → 이메일 입력 → 매직 링크 발송.
- 클릭 시 device 익명 계정이 이메일 계정으로 승격. 기존 자료 모두 보존.
- 발송: **Resend**(Vercel 통합 좋음) 또는 SES.

### 8.2 세션

JWT 쿠키. 만료 30일. CSRF 보호는 SameSite=Lax + 별도 토큰.

## 9. 비용 / 사용 한도

### 9.1 시연 베타 (M2 시점)

- 학생당 무제한.
- 예상 시연 비용: 평가위원 시연 자리 + NEXT SCHOOL 학생 10~20명 × 자료 5개 = ~$75~150.
- 한 번의 시연·발표 비용으로 감내 가능.

### 9.2 정식 출시 후 (M3+)

- 무료 한도: 학생당 월 10자료.
- 초과 시 프리미엄 잠금 (기존 PremiumBanner 활용) 또는 추가 결제.
- 학교 단위 계약(NEXT SCHOOL)이 더 자연스러울 수 있으나 M3에서 결정.

## 10. 에러 / 안전 처리

### 10.1 단계별 실패

- 각 단계 실패 시 `sources.status='failed'` + `status_message` 기록.
- 사용자에게 카드에 빨간 배지 + "재시도" 버튼 노출.
- 재시도는 **실패한 단계부터**(전체 재실행 아님).

### 10.2 도메인 부적합 자료

- 1.5 단계에서 자료가 해당 자격증과 무관하면(`domain_score < 0.4`) 사용자에게 경고:
  *"이 자료는 [자격증]과 관련성이 낮아 보입니다. 그래도 처리하시겠어요?"*
- 사용자가 "그래도" 선택 시 처리 진행. "다시 등록" 선택 시 자료 삭제.

### 10.3 PDF 파싱 실패

- 스캔 이미지 PDF, 암호화 PDF 등 텍스트 추출 불가 → 사용자에게 명확히 안내:
  *"이 PDF는 텍스트 추출이 어려워요. 텍스트를 직접 복사해 붙여넣어 주세요."*
- 등록을 텍스트 모드로 자동 전환할 수 있는 버튼 노출.

### 10.4 AI 응답 스키마 깨짐

- JSON 파싱 실패 또는 콘텐츠 가드(keywordHints.korean 본문 등장 등) 위반 시 1회 재시도.
- 2회 모두 실패 시 `failed` 처리, 사용자에게 재시도 옵션.

### 10.5 비용 폭주 방지

- 사용자당 24시간 자료 등록 N개 한도 (시연 모드는 20개, 정식 모드는 10개).
- 자료 1개 raw_text 길이 한도 50만 자.

## 11. 테스트 전략

### 11.1 단위 테스트 (Vitest)

- DB 마이그레이션 idempotent 검증
- `sources`/`summaries`/`concepts`/`problems` CRUD
- 콘텐츠 가드: 사용자 `problems` 스키마가 기존 공식 `koreanFoodQuestions[0]` 형식과 호환되는지(같은 필드, 같은 타입)
- AI 응답 검증 헬퍼: keywordHints.korean이 본문에 등장하는지(M1.5와 동일)

### 11.2 통합 테스트

- API 엔드포인트 (Next.js test handler) 인증/CRUD/권한 (다른 사용자 자료 접근 차단)
- 파이프라인 mock AI: 단계별 status 전환이 정상인지

### 11.3 E2E (선택)

- Playwright 또는 gstack `/browse`로 자료 등록 → 처리 완료 대기 → StudyPage 학습 묶음에 새 옵션 등장 → 풀이까지

### 11.4 시연 시나리오 검증

- 베트남어 학생(시연 모드): 학교 코드 입력 → PDF 업로드 → 처리 완료 → StudyPage에서 사용자 문제 풀이 → DictionaryPage에서 사용자 개념 검색
- 중국어 학생(정식 모드): 매직 링크 가입 → 다른 기기 로그인 → 동일 자료 보임

## 12. UI 통합 (DESIGN.md V3 그대로 적용)

### 12.1 새 페이지

- `NotebookPage` (자격증 화면의 새 탭) — V3 토큰 그대로. 카드 스타일 기존 동일.
- `SourceDetailPage` — 자료 상세. 처리 진행률은 V3 `--primary` 색상. 단계별 체크리스트.

### 12.2 기존 페이지 확장

- `StudyPage` 학습 묶음 선택 화면: "공식 60문제" 카드 + "내 자료" 묶음 카드들 추가. 동일 스타일.
- `DictionaryPage`: 공식 용어 위에 "내 자료에서 추가된 개념" 섹션 (Collapsible). V3 스타일 그대로.

### 12.3 디자인 제약

- 이 기능을 위해 새로운 디자인 토큰 도입 금지. DESIGN.md V3 토큰만 사용.
- 새 화면도 모바일 first. 데스크탑은 V3 사이드바 + 메인 + 우측 패널 구조 유지.

## 13. MVP 범위

### 13.1 M2 (이번 스프린트 — 이 spec)

- ✅ Turso DB 도입 + 스키마 마이그레이션
- ✅ 인증 시스템 (시연 device 모드 + 매직 링크)
- ✅ 텍스트/PDF 자료 등록
- ✅ AI 파이프라인 5단계 (요약 + 개념 + 문제 + 5언어 번역)
- ✅ `NotebookPage`, `SourceDetailPage` 신규
- ✅ StudyPage/DictionaryPage 통합 노출
- ✅ 에러/재시도/도메인 분류
- ✅ 콘텐츠 가드 테스트 (사용자 콘텐츠도 기존 형식 호환)
- ✅ Vercel 배포 + 시연 시나리오 검증

### 13.2 M3 이후 (이 spec에는 없음)

- AI 자동 후보 제시 흐름 (Q7 C 흐름 — 키워드 → AI 검색 → 사용자 승인)
- URL / YouTube 소스 지원
- 자료 간 중복 개념 자동 병합
- 학교 단위 공유 풀
- localStorage SM-2 데이터의 Turso 마이그레이션
- Server-Sent Events 진행률 (현재 polling)
- 학교 단위 사용량 대시보드

## 14. 미해결 / 추후 결정

- **PDF 파싱 라이브러리**: `pdf-parse` vs `unpdf` vs `pdfjs-dist`. Vercel Functions 환경(Node)에서 안정 동작 확인 필요. 구현 단계에서 결정.
- **Turso 위치/요금제**: 한국 region 가능 여부 확인. 시연 베타 무료 등급으로 충분한지 확인.
- **AI 출력 캐싱**: 같은 텍스트 다시 등록 시 캐시 활용? M2에서는 캐시 X, M3 고려.

## 15. 성공 기준

이 기능이 성공했다는 신호:

1. **자격증 평가위원 시연**: 평가위원에게 "학생이 자기 PDF 던지면 5언어 학습 풀이 자동 자란다"는 시나리오를 5분 안에 보여줄 수 있다.
2. **콘텐츠 확장성**: 공식 180문제 + 학생 1명이 자료 3개 추가 → 200~250 문제 풀로 확장.
3. **품질**: 사용자 생성 문제·개념도 M1.5 공식 콘텐츠와 동일 형식(translations·keywordHints) 통과.
4. **운영 안전성**: AI 호출 실패율 < 5%, 자료당 평균 처리 시간 < 60초, 비용 자료당 평균 $2 미만.

---

## 참고

- M1.5 콘텐츠 가드(`src/data/__tests__/{korean-food,beauty-general,pastry}.test.js`)의 패턴이 사용자 콘텐츠에도 적용된다.
- M1.5 `src/lib/translations.js` 헬퍼(`getTranslatedQuestion` 등)는 사용자 문제 객체에도 그대로 작동한다(스키마 호환).
- StudyPage의 3-mode(STEP 1/2/3) 렌더 로직은 사용자 문제 객체에도 변경 없이 작동한다(`getKeywordHints` 호환).
