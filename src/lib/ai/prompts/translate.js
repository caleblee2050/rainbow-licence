import { callJsonMode } from '../json-mode';

const LANGS = ['vi', 'zh', 'th', 'tl', 'my'];

export async function translateSummary({ koText }) {
    const result = await callJsonMode({
        system: '한국어 학습 요약을 5개 언어로 정확히 번역하는 도구입니다.',
        user: `한국어 요약:
"""
${koText}
"""

응답 형식:
{
  "vi": "베트남어 번역",
  "zh": "중국어 간체 번역",
  "th": "태국어 번역",
  "tl": "필리핀어(타갈로그) 번역",
  "my": "미얀마어 번역"
}

규칙: 자연스러운 번역. 한국 고유명사(예: 김치)는 음역+의역 병기 가능.`,
        maxTokens: 4000,
    });
    return Object.fromEntries(LANGS.map(l => [l, String(result?.[l] ?? '').trim() || null]));
}

export async function translateConcepts({ concepts }) {
    // 한 번에 모든 개념 번역 (배치)
    const listForPrompt = concepts.map((c, i) => `${i + 1}. ${c.korean} — ${c.korean_definition}`).join('\n');
    const result = await callJsonMode({
        system: '한국 자격증 용어와 정의를 5개 언어로 번역하는 도구입니다.',
        user: `다음 한국어 용어 목록을 5언어로 번역하세요.

목록:
${listForPrompt}

응답 형식:
{
  "items": [
    {
      "vi": "용어(베트남어)", "zh": "...", "th": "...", "tl": "...", "my": "...",
      "vi_def": "정의(베트남어)", "zh_def": "...", "th_def": "...", "tl_def": "...", "my_def": "..."
    }
  ]
}

규칙: 입력 순서 그대로. items 길이는 입력과 동일.`,
        maxTokens: 6000,
    });
    const items = Array.isArray(result.items) ? result.items : [];
    return concepts.map((c, i) => ({
        ...c,
        vi: items[i]?.vi ?? null, zh: items[i]?.zh ?? null, th: items[i]?.th ?? null, tl: items[i]?.tl ?? null, my: items[i]?.my ?? null,
        vi_def: items[i]?.vi_def ?? null, zh_def: items[i]?.zh_def ?? null,
        th_def: items[i]?.th_def ?? null, tl_def: items[i]?.tl_def ?? null, my_def: items[i]?.my_def ?? null,
    }));
}

// 문제 번역 + keywordHints 생성 (1 문제씩) + 본문 매칭 가드
export async function translateProblem({ problem }) {
    const result = await callJsonMode({
        system: '한국어 객관식 문제를 5개 언어로 번역하고 핵심 단어의 모국어 힌트를 만드는 도구입니다.',
        user: `한국어 문제:
질문: ${problem.ko_question}
옵션:
1. ${problem.ko_options[0]}
2. ${problem.ko_options[1]}
3. ${problem.ko_options[2]}
4. ${problem.ko_options[3]}
정답: ${problem.correct_answer + 1}번
해설: ${problem.ko_explanation}

응답 형식:
{
  "translations": {
    "vi": { "question": "...", "options": ["...","...","...","..."], "explanation": "..." },
    "zh": { ... }, "th": { ... }, "tl": { ... }, "my": { ... }
  },
  "keyword_hints": {
    "vi": [{ "korean": "...", "native": "..." }, ...],
    "zh": [...], "th": [...], "tl": [...], "my": [...]
  }
}

규칙:
- options는 정확히 4개씩.
- keyword_hints의 "korean"은 반드시 question 또는 options 본문에 정확히 등장하는 한국어 단어(띄어쓰기 포함). 본문에 없는 단어 금지.
- 각 언어 keyword_hints: vi/zh는 5~8개, th/tl/my는 4~6개.`,
        maxTokens: 4000,
    });

    // 본문 매칭 가드 — M1.5와 동일 패턴
    const body = problem.ko_question + ' ' + problem.ko_options.join(' ');
    const cleanedHints = {};
    for (const lang of LANGS) {
        const arr = Array.isArray(result?.keyword_hints?.[lang]) ? result.keyword_hints[lang] : [];
        cleanedHints[lang] = arr
            .filter(h => h?.korean && h?.native && body.includes(h.korean))
            .slice(0, 8);
    }
    return {
        translations: result?.translations ?? {},
        keyword_hints: cleanedHints,
    };
}
