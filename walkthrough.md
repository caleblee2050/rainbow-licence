# Rainbow Licence — 세션 핸드오프 (2026-05-28, M2 배포 완료)

> 다음 세션이 시작되면 이 파일부터 읽고 컨텍스트 복원할 것.

## 📊 현재 좌표

**프로젝트**: 한국 국가기술자격증 학습 PWA (다문화 학교 NEXT SCHOOL용 + 공공평가위원 시연).
**프로덕션 URL**: https://rainbow-licence.vercel.app — **M2 배포 완료 (2026-05-28)**
**저장소**: https://github.com/caleblee2050/rainbow-licence
**브랜치**: `main`

## ✅ M2 다국어 학습 자료 노트 — 배포 완료

### T1~T19 구현 (이전 세션)
NotebookLM-스타일 기능. 학생이 PDF/텍스트 자료 등록 → AI가 요약·핵심개념·객관식 문제 자동 생성 → 5언어 번역 → 기존 StudyPage/DictionaryPage에 자격증 단위로 통합 노출.
19 commits, 76 tests passing, 빌드 성공. 상세는 git log 및 이전 walkthrough 히스토리 참조.

### T20 배포 (이번 세션)

**LLM 게이트웨이를 kie.ai로 전환** + **production 인프라 구축** + **라이브 동작 검증** 완료.

#### kie.ai 마이그레이션
- **전역룰 박음**: `~/.claude/CLAUDE.md` 새 섹션 "## 6. LLM API 게이트웨이 (kie.ai 우선 — 전역 기본값)". 이후 모든 신규 프로젝트에서 LLM 호출은 kie.ai 기본.
- **kie.ai의 Anthropic Claude**: `POST https://api.kie.ai/claude/v1/messages` (Anthropic-native 형식 그대로). 인증은 `Authorization: Bearer ${KIE_API_KEY}`. 모델 ID는 Anthropic 공식과 동일 (`claude-sonnet-4-6` 등).
- **코드 변경**: `src/lib/ai/client.js`만 수정 — `new Anthropic({ baseURL: 'https://api.kie.ai/claude', authToken: process.env.KIE_API_KEY })`. SDK의 `authToken` 옵션이 Bearer 헤더 자동 생성.
- **환경변수 전환**: `ANTHROPIC_API_KEY/MODEL` → `KIE_API_KEY/LLM_MODEL`. 테스트 3종(`ai-client`, `ai-prompts`, `pipeline`)도 환경변수 이름 일괄 변경.
- **회귀 없음**: 76 tests passing, next build 성공.

#### Production 인프라
| 단계 | 결과 |
|------|------|
| Turso prod DB 생성 | `rainbow-licence-prod` @ aws-us-west-2 (`libsql://rainbow-licence-prod-caleblee2050.aws-us-west-2.turso.io`) |
| Turso DB 토큰 발급 | 전용 토큰 발급 후 Vercel env 등록 |
| JWT_SECRET 발급 | 32바이트 hex 새로 발급 |
| Vercel env 9개 등록 (production) | TURSO_DATABASE_URL, TURSO_AUTH_TOKEN, JWT_SECRET, KIE_API_KEY, LLM_MODEL, NEXT_PUBLIC_BASE_URL, NEXT_PUBLIC_DEMO_SCHOOL_CODE + 기존 2개(NEXT_PUBLIC_DEMO_MODE, NEXT_PUBLIC_SCHOOL_NAME) |
| Production DB 마이그레이션 | 3개 적용 — `0001_users`, `0003_magic_link_tokens`, `0004_sources` |
| `vercel --prod --yes` | Build 18s + Deploy 35s + Alias 41s. Production URL alias 완료 |

#### `migrate.js` 버그 수정
- Node 24 ESM이 디렉토리 import를 못 함 → `import { getDb } from '../db'` → `'../db.js'`로 변경.
- Next.js webpack/turbopack은 디렉토리 import 자동 해결하지만, raw Node 스크립트는 안 됨. **migration 스크립트나 다른 별도 노드 실행 파일에서는 항상 `.js` 확장자 명시 필수**.

#### 라이브 헬스체크 (smoke test)
- `GET https://rainbow-licence.vercel.app/` → 200, ~880ms first hit
- `GET /api/me` (no auth) → 200 + `{user:null}` ✓
- `POST /api/auth/device-anon` (smoke-test-001, NEXT_SCHOOL) → 200 + 신규 user 생성 ✓
- `GET /api/me` (after auth cookie) → 200 + user 객체 ✓

DB write, JWT 쿠키, school code 인식 모두 정상.

## 🚧 시연 시나리오 — 수동 검증 필요 (다음 단계)

`docs/superpowers/plans/2026-05-28-m2-demo-scenarios.md` 체크리스트. 자동 smoke test는 끝났으나 **AI 파이프라인 e2e**(시나리오 A·C·D)는 브라우저로 수동 검증:

- **A**: vi 시연 모드 — 학교 코드 입력 → 텍스트 자료 등록 → 5단계 파이프라인 → 학습 묶음 진입
- **B**: 이메일 매직 링크 — **이번 배포에서 Resend skip**. 시연 시 디바이스 익명 모드만 활성. 매직 링크 검증은 추후 Resend 도메인 verify 후.
- **C**: PDF 업로드 + 도메인 분류
- **D**: 무관 자료 도메인 분류 (조선왕조 PDF → "무관" 분류 + 학습 자료 미생성)

## 🛠 이번 세션 수정 파일

```
src/lib/ai/client.js                     # Anthropic SDK baseURL+authToken → kie.ai 게이트웨이
src/lib/db/migrate.js                    # ESM 디렉토리 import 수정 (.js 확장자)
src/lib/__tests__/ai-client.test.js      # process.env.KIE_API_KEY로 변경
src/lib/__tests__/ai-prompts.test.js     # 동일
src/lib/__tests__/pipeline.test.js       # 동일
.env.example                             # ANTHROPIC_* → KIE_API_KEY/LLM_MODEL
CLAUDE.md                                # M2 섹션 추가
walkthrough.md                           # (이 파일) 배포 완료 기록
~/.claude/CLAUDE.md                      # 글로벌 — kie.ai 전역룰 박음 (## 6. LLM API 게이트웨이)
```

## 💡 학습/주의사항 (이번 세션에서 강화)

- **kie.ai = Anthropic-native /v1/messages 지원**: baseURL 한 줄 + `authToken` 옵션만 바꾸면 SDK 코드 그대로. `apiKey` 대신 `authToken`을 써야 Bearer 헤더가 생성됨. `x-api-key`는 kie.ai에서 거부.
- **Vercel auto classifier가 production deploy 차단**: `vercel --prod --yes`는 명시적 사용자 승인 필요. env 등록·DB 마이그레이션은 통과.
- **migrate.js ESM**: Node 24에서 디렉토리 import 미지원. `.js` 확장자 필수.
- **Turso settings.json 토큰 만료**: 사용자가 "로그인 됐다"고 해도 CLI에서 별도 검증 필요. 토큰 만료되면 `turso auth login` 재실행 필요.
- **kie.ai 5언어 번역 비용**: smoke test 한 번에 `credits_consumed: 0.1`. 실 시연 5건 × 5언어 × 5스텝 = 약 125회 호출 → 비용 모니터링 필요.

## 🎯 다음 세션 진입 시 즉시 할 일

1. 이 walkthrough.md 읽기
2. `git log --oneline -5` 확인 (배포 commit 위치)
3. **시연 e2e 검증** (수동) — production에서 시나리오 A → C → D 순서로 브라우저 테스트
   - 시나리오 A: 학교 코드 NEXT_SCHOOL → 텍스트 자료 등록 → 5단계 진행 확인 → 학습 풀에 노출 확인
   - 시나리오 C: PDF 업로드 → pdf-parse 정상 동작 → 파이프라인 완료 확인
   - 시나리오 D: 자격증과 무관한 자료(예: 조선왕조 PDF) → classify 단계에서 "무관" 분류 → 사용자에게 안내
4. (선택) Resend 도메인 verify 후 매직 링크 활성화 + 시나리오 B 검증
5. M3 후보 작업 검토:
   - AI 자동 후보 제시 흐름 (Q7 C 흐름)
   - URL / YouTube 소스 지원
   - 자료 간 중복 개념 자동 병합
   - 학교 단위 공유 풀
   - localStorage SM-2 마이그레이션
   - SSE 진행률 (현재 polling)
   - 학교 단위 사용량 대시보드

## M3 후보 (M2 spec 13.2에 정리됨)

- AI 자동 후보 제시 흐름 (Q7 C 흐름)
- URL / YouTube 소스 지원
- 자료 간 중복 개념 자동 병합
- 학교 단위 공유 풀
- localStorage SM-2 마이그레이션
- SSE 진행률 (현재 polling)
- 학교 단위 사용량 대시보드
