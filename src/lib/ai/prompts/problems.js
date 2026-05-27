import { callJsonMode } from '../json-mode';

export async function generateProblems({ rawText, concepts, licenceId }) {
    const head = rawText.slice(0, 30_000);
    const conceptList = (concepts ?? []).slice(0, 10).map(c => `- ${c.korean}: ${c.korean_definition}`).join('\n');
    const result = await callJsonMode({
        system: `당신은 한국 자격증 객관식 문제를 만드는 출제 도구입니다. 정답이 명확하고 오답이 합리적인 4지선다 문제를 생성합니다.`,
        user: `다음 자료와 핵심개념을 바탕으로 객관식 4지선다 5~10문제를 만드세요.

자료:
"""
${head}
"""

핵심개념:
${conceptList}

응답 형식:
{
  "problems": [
    {
      "ko_question": "한국어 질문 (40~120자)",
      "ko_options": ["옵션1", "옵션2", "옵션3", "옵션4"],
      "correct_answer": 0,
      "ko_explanation": "정답 해설 (60~200자)",
      "ko_simple_explanation": "쉬운 풀어쓰기 해설 (40~120자, 다문화 학생용)"
    }
  ]
}

규칙:
- 5~10문제. 자료 핵심에 집중.
- correct_answer는 0~3 인덱스.
- 모든 옵션은 비슷한 길이로 (한 옵션만 유난히 길면 단서 줘서 안 됨).
- 자료 본문 그대로 문장 복붙 금지 — 출제용으로 재구성.
- ko_simple_explanation은 초급 한국어로 풀어 설명.`,
        maxTokens: 4000,
    });
    const items = Array.isArray(result.problems) ? result.problems : [];
    return items
        .filter(p => p?.ko_question && Array.isArray(p?.ko_options) && p.ko_options.length === 4
                                 && typeof p?.correct_answer === 'number' && p.correct_answer >= 0 && p.correct_answer <= 3
                                 && p?.ko_explanation)
        .slice(0, 10)
        .map(p => ({
            ko_question: String(p.ko_question).trim(),
            ko_options: p.ko_options.map(o => String(o).trim()),
            correct_answer: p.correct_answer,
            ko_explanation: String(p.ko_explanation).trim(),
            ko_simple_explanation: p.ko_simple_explanation ? String(p.ko_simple_explanation).trim() : null,
        }));
}
