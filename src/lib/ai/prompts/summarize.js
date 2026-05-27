import { callJsonMode } from '../json-mode';

export async function summarizeInKorean({ rawText, licenceId }) {
    const head = rawText.slice(0, 30_000);
    const result = await callJsonMode({
        system: `당신은 한국 자격증 학습 자료를 요약하는 도구입니다. 정확하고 군더더기 없이 핵심만 담은 한국어 요약을 만듭니다.`,
        user: `다음 자료를 학생이 시험 준비에 활용할 수 있도록 한국어 요약하세요.

자료:
"""
${head}
"""

응답 형식:
{ "summary": "약 400~600자 분량의 한국어 요약. 줄바꿈 OK. 학습 핵심·시험 출제 가능 포인트 위주." }

피해야 할 것: 인사말, "이 자료에서는", "본문에 의하면" 같은 메타 코멘트.`,
        maxTokens: 1500,
    });
    return { ko: String(result.summary ?? '').trim() };
}
