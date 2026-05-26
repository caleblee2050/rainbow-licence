# Rainbow Licence M1.5 — Multilingual Restoration Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use `- [ ]` checkbox syntax.

**Goal:** 다문화 학교 학생이 진짜 모국어로 학습할 수 있도록 한다. 180문제 × 5언어 × (질문+옵션+해설+핵심단어 힌트) 다국어 데이터 추가 + StudyPage 3-모드 재설계 + 진단 결과 실효화.

**Why:** 시연 베타 검토 중 발견 — 현재는 "한국어 시험을 한국어로 풀어쓰기" 수준이고 진짜 모국어 학습 도구가 아니라는 비판. 5개 언어 헤더 디테일만 있고 실질 콘텐츠는 한국어 only. 다문화 학습 도구의 본질 회복.

**Architecture:**
- 데이터: 각 문제에 `translations.{vi,zh,th,tl,my}` + `keywordHints.{vi,zh,th,tl,my}` 필드 추가.
- StudyPage: STEP 1 한+모국 병행 표시, STEP 2 한국어 + 키워드 점선 밑줄 → 모국어 popover, STEP 3 한국어 + 우하단 ❓ 토글.
- 진단 점수 → 초기 STEP 자동 매핑 (0-1=STEP1, 2=STEP2, 3=STEP3).
- DictionaryPage 5언어 모두 노출, vi/zh ✓ 검수마크, th/tl/my "AI 번역" 표시.

**Tech Stack:** Next.js 16, React 19, JS, Vitest. AI 번역은 서브에이전트(Claude) 자체로 생성 — 자격증별 병렬 작업.

---

## File Structure

### Modify
```
src/data/questions/korean-food.js       # 60 questions: + translations + keywordHints
src/data/questions/beauty-general.js    # 60 questions: + translations + keywordHints
src/data/questions/pastry.js            # 60 questions: + translations + keywordHints
src/components/pages/StudyPage.js       # 3-mode redesign
src/components/pages/OnboardingPage.js  # diagnostic → initial mode mapping
src/components/pages/DictionaryPage.js  # remove "준비중", show 5 langs always with verify badges
src/lib/demoMode.js                     # add isLanguageVerified semantics: still vi/zh ✓ but th/tl/my show "AI 번역" not "preview"
src/data/__tests__/{korean-food,beauty-general,pastry}.test.js  # new translation field checks
```

### Create (per-task new file)
```
src/lib/translations.js                 # helper: getTranslation(question, lang, field)
```

---

## Task M1.5-1: 데이터 스키마 준비 + 헬퍼 + 테스트

**Files:**
- Create: `src/lib/translations.js`
- Modify: `src/lib/demoMode.js`
- Modify: existing test files for new schema

번역 데이터 들어가기 전에 스키마와 접근 헬퍼를 먼저 잡는다. 이후 작업들이 이 헬퍼를 사용.

- [ ] **Step 1: 새 스키마 정의 — 문제 객체 shape**

각 문제는 기존 9필드 + 다음 2필드 추가:
```js
{
    // ... 기존 9필드 ...
    translations: {
        vi: { question: '...', options: ['...', '...', '...', '...'], explanation: '...' },
        zh: { question: '...', options: [...], explanation: '...' },
        th: { question: '...', options: [...], explanation: '...' },
        tl: { question: '...', options: [...], explanation: '...' },
        my: { question: '...', options: [...], explanation: '...' },
    },
    keywordHints: {
        vi: [{ korean: '표시', native: 'biểu thị/ghi nhãn' }, { korean: '광고', native: 'quảng cáo' }, ...],
        zh: [{ korean: '표시', native: '标示' }, ...],
        th: [...], tl: [...], my: [...],
    },
}
```

각 언어별로 5-8개 keyword. korean은 문제 텍스트에 실제 등장하는 단어여야 함 (StudyPage가 그 위치를 찾아 점선 밑줄).

- [ ] **Step 2: `src/lib/translations.js` 작성**

```js
// 번역 접근 헬퍼

const LANG_CODES = ['vi', 'zh', 'th', 'tl', 'my'];
const VERIFIED_LANGS = ['vi', 'zh'];

export function getTranslatedQuestion(question, lang) {
    return question?.translations?.[lang]?.question || null;
}

export function getTranslatedOptions(question, lang) {
    return question?.translations?.[lang]?.options || null;
}

export function getTranslatedExplanation(question, lang) {
    return question?.translations?.[lang]?.explanation || null;
}

export function getKeywordHints(question, lang) {
    return question?.keywordHints?.[lang] || [];
}

export function isLangVerified(lang) {
    return VERIFIED_LANGS.includes(lang);
}

export function getLangBadge(lang) {
    return isLangVerified(lang) ? '✓ 검수 완료' : 'AI 번역';
}

export { LANG_CODES, VERIFIED_LANGS };
```

- [ ] **Step 3: `src/lib/demoMode.js`의 `isLanguageVerified` 의미 보존, 새 정책으로 업데이트**

기존 `getLanguageStatus`는 'verified' vs 'preview' 반환. 새 정책에선 'preview'가 아니라 'ai-translation'으로 변경 (숨김 아님 → 표시 + 라벨).

```js
export function getLanguageStatus(langCode) {
    return VERIFIED_LANGS.includes(langCode) ? 'verified' : 'ai-translation';
}
```

`isLanguageVerified`는 그대로 (vi/zh만 true).

- [ ] **Step 4: 새 스키마 테스트 헬퍼**

`src/lib/__tests__/translations.test.js`:
```js
import { describe, it, expect } from 'vitest';
import { getTranslatedQuestion, getKeywordHints, isLangVerified, getLangBadge, LANG_CODES } from '../translations';

describe('translations helpers', () => {
    const sample = {
        translations: {
            vi: { question: 'Q vi', options: ['A','B','C','D'], explanation: 'E vi' },
            zh: { question: 'Q zh', options: ['A','B','C','D'], explanation: 'E zh' },
        },
        keywordHints: {
            vi: [{ korean: '표시', native: 'ghi nhãn' }],
        },
    };
    it('returns translation when present', () => {
        expect(getTranslatedQuestion(sample, 'vi')).toBe('Q vi');
    });
    it('returns null when missing language', () => {
        expect(getTranslatedQuestion(sample, 'th')).toBe(null);
    });
    it('returns empty array for missing keyword hints', () => {
        expect(getKeywordHints(sample, 'th')).toEqual([]);
    });
    it('verified langs are vi and zh only', () => {
        expect(isLangVerified('vi')).toBe(true);
        expect(isLangVerified('zh')).toBe(true);
        expect(isLangVerified('th')).toBe(false);
    });
    it('language badge text', () => {
        expect(getLangBadge('vi')).toBe('✓ 검수 완료');
        expect(getLangBadge('th')).toBe('AI 번역');
    });
});
```

```bash
npm run test:run
```
Expected: 23 tests passing (기존 18 + 5 새 헬퍼).

- [ ] **Step 5: 기존 콘텐츠 테스트에 옵셔널 fields 체크 추가**

각 `korean-food.test.js`, `beauty-general.test.js`, `pastry.test.js`에 새 describe 블록 추가:
```js
describe('한식조리 다국어 필드 (M1.5)', () => {
    it.skip('아직 미작성 — Task M1.5-2 이후 활성화', () => {
        // 다국어 번역 완료 후 활성화:
        // for (const q of koreanFoodQuestions) {
        //     expect(q.translations).toBeDefined();
        //     expect(q.translations.vi.question).toBeTruthy();
        //     ...
        // }
    });
});
```
(미용/제과 동일)

`it.skip`으로 일단 두고, 번역 채워진 후 Task M1.5-2/3/4에서 활성화.

- [ ] **Step 6: 커밋**

```bash
git add src/lib/translations.js src/lib/__tests__/translations.test.js src/lib/demoMode.js src/data/__tests__/
git commit -m "feat: 다국어 스키마 준비 + 번역 헬퍼

- src/lib/translations.js: getTranslatedQuestion/Options/Explanation, getKeywordHints, isLangVerified, getLangBadge
- demoMode: getLanguageStatus '준비 중' → 'AI 번역' 정책 변경
- 콘텐츠 가드 테스트에 다국어 필드 스킵 블록 (다음 태스크에서 활성화)
- 23 tests passing"
```

---

## Task M1.5-2: 한식조리 60문제 × 5언어 번역 생성

**Files:**
- Modify: `src/data/questions/korean-food.js` (60문제 각각에 translations + keywordHints 추가)
- Modify: `src/data/__tests__/korean-food.test.js` (it.skip → 활성화)

가장 콘텐츠 많은 자격증 먼저. 5언어 한 번에 작성.

- [ ] **Step 1: 번역 작업 워크플로 — 60문제 일괄 처리**

각 문제 ID `kf-01` ~ `kf-60`에 대해, 5언어 × (question + 4 options + explanation) + (keywordHints 5-8개 × 5언어) 추가.

번역 정책:
- **vi (베트남어)**: 정확한 베트남어. 식품·조리 도메인 표현 사용.
- **zh (중국어, 간체)**: 정확한 중국어. 한국 음식 관련 단어는 음역+의역 병기 가능 (例: 김치 → 韩国泡菜(Kimchi))
- **th (태국어)**: AI 번역. 정확도에 노력하되 검수 불가.
- **tl (필리핀어/타갈로그)**: AI 번역. 일상 어휘 위주.
- **my (미얀마어)**: AI 번역. 도메인 어휘는 영어 음역 가능.

키워드 힌트 (`keywordHints`): 각 문제의 한국어 본문에서 5-8개의 핵심 단어 추출. 각 언어별로 그 단어의 모국어 번역. **korean 필드는 본문에 실제 등장하는 단어와 정확히 일치해야 함** (StudyPage에서 정규식으로 찾아 점선 밑줄 처리).

- [ ] **Step 2: 예시 — kf-01 완성형**

```js
{
    id: 'kf-01',
    licenceId: 'korean-food',
    subject: 'food-hygiene',
    question: '식품 등의 표시·광고에 관한 법률에 따라 표시해야 할 사항이 아닌 것은?',
    simpleQuestion: '음식 포장에 꼭 써야 하는 것이 아닌 것은?',
    options: ['제품명', '업소명 및 소재지', '제조연월일', '판매직원 이름'],
    correctAnswer: 3,
    explanation: '식품 표시사항에는 제품명, 업소명, 제조일자, 유통기한 등이 포함되지만, 판매직원 이름은 해당되지 않습니다.',
    simpleExplanation: '음식 포장에는 이름, 만든 곳, 만든 날짜를 써야 해요. 파는 사람 이름은 안 써도 돼요.',
    keywords: ['표시', '광고', '법률'],
    translations: {
        vi: {
            question: 'Theo Luật về ghi nhãn và quảng cáo thực phẩm, mục nào KHÔNG bắt buộc phải ghi?',
            options: ['Tên sản phẩm', 'Tên và địa chỉ cơ sở', 'Ngày sản xuất', 'Tên nhân viên bán hàng'],
            explanation: 'Nhãn thực phẩm phải có tên sản phẩm, tên cơ sở, ngày sản xuất, hạn sử dụng — nhưng KHÔNG bao gồm tên nhân viên bán hàng.',
        },
        zh: {
            question: '根据食品标示·广告相关法律,以下哪一项不是必须标示的事项?',
            options: ['产品名称', '营业场所名称及地址', '制造年月日', '销售员姓名'],
            explanation: '食品标示事项包括产品名、营业场所名、制造日期、保质期等,但不包含销售员姓名。',
        },
        th: {
            question: 'ตามกฎหมายว่าด้วยการแสดงฉลากและโฆษณาอาหาร ข้อใด "ไม่ใช่" รายการที่ต้องแสดง?',
            options: ['ชื่อผลิตภัณฑ์', 'ชื่อและที่ตั้งร้าน', 'วันที่ผลิต', 'ชื่อพนักงานขาย'],
            explanation: 'รายการบนฉลากอาหารต้องมีชื่อผลิตภัณฑ์ ชื่อร้าน วันที่ผลิต วันหมดอายุ ฯลฯ แต่ "ไม่รวม" ชื่อพนักงานขาย',
        },
        tl: {
            question: 'Ayon sa batas tungkol sa labeling at advertising ng pagkain, alin ang HINDI kailangang ipakita?',
            options: ['Pangalan ng produkto', 'Pangalan at address ng tindahan', 'Petsa ng paggawa', 'Pangalan ng nagbebenta'],
            explanation: 'Sa label ng pagkain ay dapat may pangalan ng produkto, tindahan, petsa ng paggawa, at expiry — pero HINDI kailangan ang pangalan ng nagbebenta.',
        },
        my: {
            question: 'အစားအစာ တံဆိပ်နှင့် ကြော်ငြာ ဥပဒေအရ ဖော်ပြရန် မလိုအပ်သည်မှာ မည်သည့်အရာနည်း?',
            options: ['ထုတ်ကုန်အမည်', 'ဆိုင်အမည်နှင့်လိပ်စာ', 'ထုတ်လုပ်သည့်ရက်စွဲ', 'ရောင်းချသူ၏ အမည်'],
            explanation: 'အစားအစာ တံဆိပ်တွင် ထုတ်ကုန်အမည်၊ ဆိုင်အမည်၊ ထုတ်လုပ်ရက်၊ သက်တမ်းကုန်ရက် ပါဝင်ပြီး ရောင်းချသူ၏ အမည် မပါဝင်ပါ။',
        },
    },
    keywordHints: {
        vi: [
            { korean: '식품', native: 'thực phẩm' },
            { korean: '표시', native: 'ghi nhãn / biểu thị' },
            { korean: '광고', native: 'quảng cáo' },
            { korean: '법률', native: 'luật pháp' },
            { korean: '제품명', native: 'tên sản phẩm' },
            { korean: '업소', native: 'cơ sở kinh doanh' },
            { korean: '제조연월일', native: 'ngày sản xuất' },
        ],
        zh: [
            { korean: '식품', native: '食品' },
            { korean: '표시', native: '标示' },
            { korean: '광고', native: '广告' },
            { korean: '법률', native: '法律' },
            { korean: '제품명', native: '产品名' },
            { korean: '업소', native: '营业场所' },
            { korean: '제조연월일', native: '制造日期' },
        ],
        th: [
            { korean: '식품', native: 'อาหาร' },
            { korean: '표시', native: 'การแสดง / ฉลาก' },
            { korean: '광고', native: 'การโฆษณา' },
            { korean: '법률', native: 'กฎหมาย' },
            { korean: '제품명', native: 'ชื่อผลิตภัณฑ์' },
        ],
        tl: [
            { korean: '식품', native: 'pagkain' },
            { korean: '표시', native: 'pagpapakita / label' },
            { korean: '광고', native: 'advertising' },
            { korean: '법률', native: 'batas' },
        ],
        my: [
            { korean: '식품', native: 'အစားအစာ' },
            { korean: '표시', native: 'တံဆိပ်' },
            { korean: '광고', native: 'ကြော်ငြာ' },
            { korean: '법률', native: 'ဥပဒေ' },
        ],
    },
},
```

이 예시를 참고해서 나머지 59문제도 동일 패턴으로.

- [ ] **Step 3: 60문제 작성 — 단원별 진행**

식품위생 20개 → 식품학 20개 → 조리이론 20개 순서로 한 묶음씩 작성. 각 묶음에 대해 vi/zh/th/tl/my 한 번에.

품질 가이드:
- 각 언어의 도메인 어휘 정확성. 음식 관련 단어는 그 언어 사용자가 일반적으로 쓰는 표현.
- 한국 고유명사(김치·된장 등)는 음역 + 의역 병기.
- 법률·기술 용어는 정확하게.
- keywordHints는 본문에 등장하는 한국어 단어 정확히 일치 (한글자 한자도 다르면 안 됨, StudyPage가 정확 매칭으로 찾기 때문).

- [ ] **Step 4: 콘텐츠 가드 테스트 활성화**

`src/data/__tests__/korean-food.test.js`의 `it.skip` 블록 활성화:
```js
describe('한식조리 다국어 필드', () => {
    it('모든 문제에 5언어 translations 채워짐', () => {
        const langs = ['vi', 'zh', 'th', 'tl', 'my'];
        for (const q of koreanFoodQuestions) {
            for (const lang of langs) {
                expect(q.translations?.[lang]?.question, `${q.id} ${lang}.question 누락`).toBeTruthy();
                expect(q.translations?.[lang]?.options, `${q.id} ${lang}.options 누락`).toHaveLength(4);
                expect(q.translations?.[lang]?.explanation, `${q.id} ${lang}.explanation 누락`).toBeTruthy();
            }
        }
    });
    it('keywordHints는 각 언어에 4개 이상', () => {
        const langs = ['vi', 'zh', 'th', 'tl', 'my'];
        for (const q of koreanFoodQuestions) {
            for (const lang of langs) {
                const hints = q.keywordHints?.[lang] || [];
                expect(hints.length, `${q.id} ${lang} 키워드 ${hints.length}개 (4 이상 필요)`).toBeGreaterThanOrEqual(4);
                for (const h of hints) {
                    expect(h.korean, `${q.id} ${lang} 키워드 korean 누락`).toBeTruthy();
                    expect(h.native, `${q.id} ${lang} 키워드 native 누락`).toBeTruthy();
                }
            }
        }
    });
    it('keywordHints의 korean은 문제 본문에 등장', () => {
        for (const q of koreanFoodQuestions) {
            const text = q.question + ' ' + q.options.join(' ');
            for (const lang of ['vi', 'zh', 'th', 'tl', 'my']) {
                for (const h of (q.keywordHints?.[lang] || [])) {
                    expect(text.includes(h.korean), `${q.id} ${lang} 키워드 '${h.korean}' 본문에 없음`).toBe(true);
                }
            }
        }
    });
});
```

```bash
npm run test:run
```
Expected: 모든 테스트 PASS (기존 + 새 3개 = 약 26).

- [ ] **Step 5: 커밋**

```bash
git add src/data/questions/korean-food.js src/data/__tests__/korean-food.test.js
git commit -m "feat(content): 한식조리 60문제 5언어 번역 + 키워드 힌트

- translations.{vi,zh,th,tl,my} 각각 question + options[4] + explanation
- keywordHints.{vi,zh,th,tl,my} 각 4-8개 한국어 단어 + 모국어 매핑
- 콘텐츠 가드 테스트 3종 추가 (개수·필드·본문등장 검증)
- 26 tests passing
- vi/zh 검수 가능 수준, th/tl/my AI 번역 (UI에 'AI 번역' 표시 예정)"
```

---

## Task M1.5-3: 미용일반 60문제 × 5언어 번역

**Files:**
- Modify: `src/data/questions/beauty-general.js`
- Modify: `src/data/__tests__/beauty-general.test.js`

Task M1.5-2와 동일한 패턴. 미용 도메인.

- [ ] **Step 1-3: 60문제에 translations + keywordHints 추가 — 미용 도메인 어휘 정확성**

도메인 어휘 가이드:
- 두피: vi `da đầu`, zh `头皮`, th `หนังศีรษะ`, tl `anit`, my `ဦးရေပြား`
- 모발: vi `tóc`, zh `头发`, th `เส้นผม`, tl `buhok`, my `ဆံပင်`
- 화장품: vi `mỹ phẩm`, zh `化妆品`, th `เครื่องสำอาง`, tl `kosmetiko`, my `အလှကုန်`
- 미용실: vi `tiệm tóc`, zh `美容院`, th `ร้านเสริมสวย`, tl `beauty salon`, my `အလှပြင်ဆိုင်`
- 소독: vi `khử trùng`, zh `消毒`, th `การฆ่าเชื้อ`, tl `disinfection`, my `ပိုးသန့်စင်`

- [ ] **Step 4: 콘텐츠 가드 테스트 활성화 (Task M1.5-2 패턴과 동일)**

- [ ] **Step 5: 커밋**

```bash
git add src/data/questions/beauty-general.js src/data/__tests__/beauty-general.test.js
git commit -m "feat(content): 미용일반 60문제 5언어 번역 + 키워드 힌트

- 두피·모발/화장품학/공중위생/미용이론 단원별 15문제씩
- 5언어 translations + keywordHints
- 콘텐츠 가드 테스트 활성화"
```

---

## Task M1.5-4: 제과 60문제 × 5언어 번역

**Files:**
- Modify: `src/data/questions/pastry.js`
- Modify: `src/data/__tests__/pastry.test.js`

제과 도메인.

- [ ] **Step 1-3: 60문제에 translations + keywordHints 추가**

도메인 어휘 가이드:
- 밀가루: vi `bột mì`, zh `面粉`, th `แป้งสาลี`, tl `harina`, my `ဂျုံမှုန့်`
- 박력분: vi `bột mì yếu`, zh `低筋面粉`, th `แป้งสาลีอ่อน`, tl `cake flour`, my `ပါးပါးဂျုံမှုန့်`
- 강력분: vi `bột mì mạnh`, zh `高筋面粉`, th `แป้งสาลีแข็ง`, tl `bread flour`, my `မာသောဂျုံမှုန့်`
- 베이킹파우더: vi `bột nở`, zh `泡打粉`, th `ผงฟู`, tl `baking powder`, my `ဘေကင်းပေါင်ဒါ`
- 이스트: vi `men nở`, zh `酵母`, th `ยีสต์`, tl `yeast`, my `တဆေး`
- 머랭: vi `meringue (lòng trắng đánh bông)`, zh `蛋白霜`, th `เมอแรงค์`, tl `meringue`, my `ဥအဖြူပွတ်`
- 굽기: vi `nướng`, zh `烘焙`, th `อบ`, tl `pagluluto sa oven`, my `ဖုတ်ခြင်း`

- [ ] **Step 4: 콘텐츠 가드 테스트 활성화**

- [ ] **Step 5: 커밋**

```bash
git add src/data/questions/pastry.js src/data/__tests__/pastry.test.js
git commit -m "feat(content): 제과 60문제 5언어 번역 + 키워드 힌트

- 과자류 재료/제조/식품위생학 단원별 20문제씩
- 5언어 translations + keywordHints
- 콘텐츠 가드 테스트 활성화"
```

---

## Task M1.5-5: StudyPage 3-모드 재설계

**Files:**
- Modify: `src/components/pages/StudyPage.js`

3개 모드의 진짜 차이를 구현. 핵심 작업.

- [ ] **Step 1: 현재 StudyPage 구조 파악**

```bash
cat src/components/pages/StudyPage.js | head -100
```
현재 useState: 모드, 현재 문제 인덱스, 선택 답, 결과 표시 등. 보존.

- [ ] **Step 2: 번역 헬퍼 import 추가**

상단에:
```js
import { getTranslatedQuestion, getTranslatedOptions, getTranslatedExplanation, getKeywordHints, isLangVerified, getLangBadge } from '@/lib/translations';
```

- [ ] **Step 3: STEP 1 (번역) 모드 렌더링 — 한국어 + 모국어 병행**

문제 영역에서 mode === 'step1' 분기:
```jsx
{mode === 'step1' && (
    <>
        {/* 한국어 원문 */}
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(20px, 4vw, 26px)', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 12px' }}>
            {currentQuestion.question}
        </h2>
        {/* 모국어 번역 (있으면) */}
        {getTranslatedQuestion(currentQuestion, language) ? (
            <p style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 0 8px', padding: '12px 14px', background: 'var(--primary-soft)', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--primary)' }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4, display: 'block' }}>
                    {getLangBadge(language)}
                </span>
                {getTranslatedQuestion(currentQuestion, language)}
            </p>
        ) : null}
    </>
)}
```

옵션도 동일 패턴: 각 옵션 카드 안에 한국어 위 + 모국어 아래 (작은 폰트 + muted).

해설(정답 확인 후): 한국어 explanation + 그 아래 모국어 translation.explanation.

- [ ] **Step 4: STEP 2 (힌트) 모드 — 키워드 점선 밑줄 + popover**

문제 텍스트를 keywordHints 매칭해서 분할 렌더:
```jsx
function renderWithHints(text, hints) {
    if (!hints || hints.length === 0) return text;
    // 가장 긴 단어부터 매칭하면 부분 겹침 방지
    const sortedHints = [...hints].sort((a, b) => b.korean.length - a.korean.length);
    const tokens = [{ text, isHint: false }];
    for (const h of sortedHints) {
        for (let i = tokens.length - 1; i >= 0; i--) {
            if (!tokens[i].isHint && tokens[i].text.includes(h.korean)) {
                const parts = tokens[i].text.split(h.korean);
                const newTokens = [];
                for (let j = 0; j < parts.length; j++) {
                    if (parts[j]) newTokens.push({ text: parts[j], isHint: false });
                    if (j < parts.length - 1) newTokens.push({ text: h.korean, native: h.native, isHint: true });
                }
                tokens.splice(i, 1, ...newTokens);
            }
        }
    }
    return tokens.map((t, i) =>
        t.isHint ? (
            <KeywordHint key={i} korean={t.text} native={t.native} />
        ) : (
            <span key={i}>{t.text}</span>
        )
    );
}

function KeywordHint({ korean, native }) {
    const [open, setOpen] = useState(false);
    return (
        <span style={{ position: 'relative', display: 'inline-block' }}>
            <span
                onClick={() => setOpen(o => !o)}
                style={{
                    borderBottom: '2px dotted var(--accent)',
                    color: 'var(--primary)',
                    cursor: 'pointer',
                    fontWeight: 500,
                }}
            >
                {korean}
            </span>
            {open && (
                <span style={{
                    position: 'absolute',
                    top: '100%', left: 0, marginTop: 4,
                    background: 'var(--text-primary)', color: 'white',
                    padding: '6px 10px', borderRadius: 'var(--radius-sm)',
                    fontSize: 13, whiteSpace: 'nowrap', zIndex: 10,
                    boxShadow: 'var(--shadow-md)',
                }}>
                    {native}
                </span>
            )}
        </span>
    );
}
```

mode === 'step2' 분기:
```jsx
<h2 style={{...}}>
    {renderWithHints(currentQuestion.question, getKeywordHints(currentQuestion, language))}
</h2>
```
옵션도 동일하게 keyword 매칭 적용. 정답 해설은 한국어만.

- [ ] **Step 5: STEP 3 (실전) 모드 — 한국어 only + ❓ 토글**

mode === 'step3' 분기:
- 기본은 한국어만 표시 (현재처럼).
- 우하단 floating 버튼 `❓ 번역 보기` 추가. 클릭 시 모달 또는 슬라이딩 패널 열려서 모국어 번역 표시.

```jsx
const [translationOpen, setTranslationOpen] = useState(false);

// 우하단 fixed 버튼
{mode === 'step3' && (
    <button
        onClick={() => setTranslationOpen(o => !o)}
        style={{
            position: 'fixed', bottom: 96, right: 16,
            width: 56, height: 56, borderRadius: '50%',
            background: 'var(--accent)', color: 'white',
            border: 'none', fontSize: 20,
            boxShadow: 'var(--shadow-md)',
            cursor: 'pointer', zIndex: 20,
        }}
        aria-label="번역 보기"
    >
        ❓
    </button>
)}

{mode === 'step3' && translationOpen && (
    <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'var(--bg-card)', borderTop: '1px solid var(--border)',
        padding: 'var(--space-lg)', boxShadow: '0 -4px 12px rgba(0,0,0,0.08)',
        zIndex: 15, maxHeight: '50vh', overflowY: 'auto',
    }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{getLangBadge(language)}</span>
            <button onClick={() => setTranslationOpen(false)} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer' }}>✕</button>
        </div>
        <p style={{ fontSize: 15, color: 'var(--text-primary)', lineHeight: 1.6, margin: '0 0 12px' }}>
            {getTranslatedQuestion(currentQuestion, language) || '번역 준비 중'}
        </p>
        {getTranslatedOptions(currentQuestion, language)?.map((opt, i) => (
            <p key={i} style={{ fontSize: 14, color: 'var(--text-secondary)', margin: '4px 0' }}>{i + 1}. {opt}</p>
        ))}
    </div>
)}
```

- [ ] **Step 6: 빌드 + 시각 검증**

```bash
npm run build
```

브라우저에서 http://localhost:3001 접속, 학습 모드 진입.
1. STEP 1: 한국어+모국어 병행 보임
2. STEP 2: 한국어에 키워드 점선 밑줄 + 클릭하면 popover
3. STEP 3: 한국어만, ❓ 버튼 클릭 시 슬라이딩 패널

- [ ] **Step 7: 커밋**

```bash
git add src/components/pages/StudyPage.js
git commit -m "feat(study): 3-mode 학습 재설계 — 실효 다국어 학습

- STEP 1 (번역): 한국어 원문 + 그 아래 모국어 번역 패널 (배지 포함)
- STEP 2 (힌트): 핵심 단어에 점선 밑줄, 클릭 시 모국어 popover
- STEP 3 (실전): 한국어만 표시, 우하단 ❓ 버튼 토글로 슬라이딩 번역 패널
- 옵션·해설도 동일 패턴 적용
- 다문화 학생이 자기 한국어 수준에 맞춰 진짜 다국어로 학습 가능"
```

---

## Task M1.5-6: 진단 → 초기 모드 매핑 + 5언어 정책 업데이트

**Files:**
- Modify: `src/components/pages/OnboardingPage.js`
- Modify: `src/lib/studyEngine.js` (필요시)

진단 점수가 실제로 무엇을 바꾸는지 명확히. 5언어 정책도 새 정의로.

- [ ] **Step 1: OnboardingPage 진단 결과 후 자동 모드 매핑**

진단 점수 (0-3) 저장 시 추천 모드도 함께 저장:
```js
// 진단 완료 시
const score = correctCount;  // 0~3
const initialMode = score <= 1 ? 'step1' : score === 2 ? 'step2' : 'step3';
const level = score <= 1 ? 'beginner' : score === 2 ? 'intermediate' : 'advanced';

updateUserProfile({
    koreanLevel: level,
    studyMode: initialMode,  // StudyPage가 이걸 초기 mode로 사용
});
```

진단 결과 화면에 표시: "추천 학습 모드: STEP 1 (번역 모드) — 한국어와 모국어를 함께 보여드려요" (또는 STEP 2/3).

- [ ] **Step 2: 5개 언어 카드의 "Coming soon" 배지 제거**

OnboardingPage step 1에서 th/tl/my 카드의 "Coming soon" 배지 제거. 대신 작은 "AI 번역" 표기:
```jsx
{!isLanguageVerified(lang.code) && (
    <span style={{
        position: 'absolute', top: 8, right: 8,
        background: 'transparent',
        color: 'var(--text-muted)',
        fontSize: 10,
        padding: '2px 6px',
        borderRadius: 'var(--radius-full)',
        border: '1px solid var(--border)',
    }}>AI</span>
)}
```

- [ ] **Step 3: StudyPage 초기 모드를 userProfile.studyMode로 설정**

StudyPage의 `useState`에서 모드 초기값을 `getUserProfile().studyMode || 'step1'`로.

- [ ] **Step 4: 브라우저 검증 — 시나리오 3개**

localStorage 비우고 진단 1/3 (초급) → STEP 1 자동 진입.  
2/3 (중급) → STEP 2.  
3/3 (고급) → STEP 3.

- [ ] **Step 5: 커밋**

```bash
git add src/components/pages/OnboardingPage.js src/lib/studyEngine.js
git commit -m "feat(onboarding): 진단 결과 → 자동 모드 매핑 + 5언어 배지 변경

- 진단 0-1정답 → STEP1, 2정답 → STEP2, 3정답 → STEP3 자동
- 진단 완료 화면에 추천 모드 표시
- StudyPage 초기 모드는 userProfile.studyMode 사용
- 언어 카드 'Coming soon' → 'AI' 작은 표기 (숨김 정책 폐기)"
```

---

## Task M1.5-7: DictionaryPage 5언어 모두 노출

**Files:**
- Modify: `src/components/pages/DictionaryPage.js`

기존 데이터(terms.js)에 이미 5언어 다 채워져 있음. "준비 중" 정책만 풀면 노출.

- [ ] **Step 1: "🚧 준비 중" 분기 제거**

현재 `isLanguageVerified(code) ? show : '준비 중'` 분기를 제거. 항상 번역 표시. 다만 미검수 언어는 작은 라벨로:
```jsx
{LANG_CODES.map(code => (
    <div key={code} className="term-translation">
        <span className="lang-label">
            {LANG_LABELS[code]}
            {!isLanguageVerified(code) && (
                <span style={{ marginLeft: 4, fontSize: 10, color: 'var(--text-muted)', fontStyle: 'italic' }}>AI</span>
            )}
        </span>
        <span>{term[code] || '—'}</span>
    </div>
))}
```

- [ ] **Step 2: 검색 기능에서도 5언어 모두 검색되도록**

DictionaryPage의 `searchTerms` 함수가 모든 언어 필드를 검색하는지 확인. 안 되면 수정.

- [ ] **Step 3: 빌드 + 시각 검증**

```bash
npm run build
```

사전 탭에서 한식조리 → 용어 카드에 5언어 모두 노출되는지 확인. AI 표기 작게 보이는지.

- [ ] **Step 4: 커밋**

```bash
git add src/components/pages/DictionaryPage.js
git commit -m "feat(dict): 5개 언어 모두 노출, vi/zh ✓ 표시, th/tl/my 'AI' 표기

- '준비 중' 정책 폐기 (데이터는 이미 채워져 있음)
- 미검수 언어는 작은 AI 라벨로 정직하게 표시
- 검색 5언어 전체 대상 확인"
```

---

## Task M1.5-8: 배포 + 시연 검증

**Files:**
- N/A (deploy + verification only)

마지막 단계. Vercel production 갱신.

- [ ] **Step 1: 전체 테스트 + 빌드**

```bash
npm run test:run
npm run build
```
Expected: 모든 테스트 PASS, 빌드 성공.

- [ ] **Step 2: Vercel 프로덕션 배포**

```bash
vercel --prod --yes
```
새 production URL 동일 (https://rainbow-licence.vercel.app).

- [ ] **Step 3: 프로덕션 QA 체크리스트**

브라우저로 https://rainbow-licence.vercel.app 열어 다음 시나리오 확인:

**시나리오 1 — 베트남어 학생 (초급, vi)**:
- 온보딩 1단계 vi 선택 → 2단계 진단 3문제 중 1개 맞춤 → 3단계 한식조리 선택 → 학습 시작
- STEP 1 자동 진입 확인
- 문제 화면에 한국어 + 베트남어 둘 다 보임
- 옵션·해설도 베트남어 같이 보임

**시나리오 2 — 태국어 학생 (중급, th)**:
- 온보딩 th 선택 (Coming soon 아니라 AI 표기) → 진단 2개 맞춤 → 미용 자격증
- STEP 2 자동 진입 확인
- 문제의 핵심 단어에 점선 밑줄 + 탭하면 태국어 popover
- 미검수 언어라도 노출됨, "AI" 표기

**시나리오 3 — 중국어 학생 (고급, zh)**:
- 진단 3/3 → STEP 3 자동
- 한국어만 보이지만 ❓ 버튼 → 슬라이딩 패널에 중국어 번역
- 사전에서도 중국어 정상 노출 (검수 ✓ 표기)

**시나리오 4 — DictionaryPage**:
- 한식조리 용어 → 5언어 모두 노출
- vi/zh는 ✓, th/tl/my는 AI 라벨

- [ ] **Step 4: 커밋 (empty)**

```bash
git commit --allow-empty -m "docs: M1.5 다국어 본질 복원 배포 완료

배포 URL: https://rainbow-licence.vercel.app
변경 핵심:
- 180문제 × 5언어 번역 + 키워드 힌트 데이터
- StudyPage 3-mode 진짜 차별화 (한+모국 / 힌트 popover / ❓ 토글)
- 진단 결과 → 자동 모드 매핑
- 사전 5언어 전체 노출

이제 진짜 다문화 학습 도구. 교장선생님 시연 가능 수준."
```

---

## 완료 정의 (DoD)

- ✅ 180문제 모두 `translations.{vi,zh,th,tl,my}` 완성
- ✅ 180문제 모두 `keywordHints.{vi,zh,th,tl,my}` 4-8개 채움
- ✅ StudyPage 3-mode 실효 구현
- ✅ 진단 결과 → 자동 모드 매핑
- ✅ DictionaryPage 5언어 모두 노출 + AI 라벨
- ✅ 모든 콘텐츠 가드 테스트 통과 (개수·필드·본문 등장 매칭)
- ✅ Vercel production 갱신
- ✅ 베트남어·태국어·중국어 시나리오로 프로덕션 검증
