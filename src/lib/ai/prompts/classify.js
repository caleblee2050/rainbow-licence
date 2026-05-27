import { callJsonMode } from '../json-mode';

const LICENCE_LABELS = {
    'korean-food': '한식조리기능사 (한국 음식 조리, 식품위생, 식품학, 조리이론)',
    'beauty-general': '미용사(일반) (두피·모발, 화장품학, 공중위생, 미용이론)',
    'pastry': '제과기능사 (과자·빵 재료, 제조, 식품위생)',
};

export async function classifyDomain({ rawText, licenceId }) {
    const label = LICENCE_LABELS[licenceId] || licenceId;
    const head = rawText.slice(0, 4000);
    const result = await callJsonMode({
        system: `당신은 학습 자료의 자격증 도메인 적합도를 판단하는 분류기입니다.`,
        user: `다음 자료가 "${label}" 자격증 학습에 적합한지 평가하세요.

자료 (앞부분 발췌):
"""
${head}
"""

응답 형식:
{ "score": 0.0~1.0 사이 숫자, "reason": "한국어로 간단한 사유" }

- 명백히 관련 자료면 0.8 이상
- 부분적으로만 관련(예: 일반 식품 안전, 일반 미용 상식)이면 0.4~0.7
- 무관(예: 운전·소설·뉴스)이면 0.2 이하`,
        maxTokens: 200,
    });
    const score = Math.max(0, Math.min(1, Number(result.score)));
    return { score, reason: String(result.reason ?? '') };
}
