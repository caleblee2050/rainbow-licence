import { callJsonMode } from '../json-mode';

export async function extractConcepts({ rawText, licenceId }) {
    const head = rawText.slice(0, 30_000);
    const result = await callJsonMode({
        system: `당신은 한국 자격증 학습 자료에서 핵심 개념(용어)을 추출하는 도구입니다.`,
        user: `자료에서 시험에 자주 나올 핵심 개념(전문 용어·법령·과정·재료 등)을 8~15개 추출하세요.

자료:
"""
${head}
"""

응답 형식:
{
  "concepts": [
    {
      "korean": "용어 (한국어, 자료 본문에 등장하는 표기와 동일)",
      "korean_definition": "30~80자 한국어 정의",
      "pronunciation": "선택, 한글 발음 표기 (자료에 있으면)",
      "category": "선택, 단원/주제 자유 텍스트"
    }
  ]
}

규칙:
- 한 자료당 8~15개. 너무 많지도 적지도 않게.
- "korean"은 본문에 정확히 나오는 표기 그대로 (띄어쓰기 포함).
- 일반 단어("음식", "안전") 같은 비전문 어휘 제외.
- 동의어 중복 회피.`,
        maxTokens: 3000,
    });
    const items = Array.isArray(result.concepts) ? result.concepts : [];
    return items
        .filter(c => c?.korean && c?.korean_definition)
        .slice(0, 15)
        .map(c => ({
            korean: String(c.korean).trim(),
            korean_definition: String(c.korean_definition).trim(),
            pronunciation: c.pronunciation ? String(c.pronunciation).trim() : null,
            category: c.category ? String(c.category).trim() : null,
        }));
}
