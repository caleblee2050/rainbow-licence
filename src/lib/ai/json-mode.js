import { getAnthropic, getModel } from './client';

/**
 * Claude에 JSON 출력 요청. 응답에서 첫 ```json ... ``` 블록 또는 { ... } 자체를 파싱.
 * 실패 시 1회 재시도.
 */
export async function callJsonMode({ system, user, maxTokens = 4000, retries = 1 }) {
    const client = getAnthropic();
    const model = getModel();
    let lastError;
    for (let attempt = 0; attempt <= retries; attempt++) {
        const resp = await client.messages.create({
            model,
            max_tokens: maxTokens,
            system: system + '\n\n응답은 반드시 JSON 객체 하나만 출력하세요. 마크다운 코드 블록 없이.',
            messages: [{ role: 'user', content: user }],
        });
        const text = resp.content.map(b => b.type === 'text' ? b.text : '').join('').trim();
        try {
            // 코드블록 제거 시도
            const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '');
            return JSON.parse(cleaned);
        } catch (e) {
            lastError = e;
            // 다음 시도
        }
    }
    throw new Error(`JSON parse failed after ${retries + 1} attempts: ${lastError?.message}`);
}
