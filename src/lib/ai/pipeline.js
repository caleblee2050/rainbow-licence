import {
    getSourceById, updateSourceStatus, setSourceDomainScore,
    upsertSummary, insertConcepts, insertProblems,
} from '@/lib/db/sources';
import { classifyDomain } from './prompts/classify';
import { summarizeInKorean } from './prompts/summarize';
import { extractConcepts } from './prompts/concepts';
import { generateProblems } from './prompts/problems';
import { translateSummary, translateConcepts, translateProblem } from './prompts/translate';

const STATUS = {
    CLASSIFYING: 'extracting',
    SUMMARIZING: 'summarizing',
    TRANSLATING: 'translating',
    DONE: 'done',
    FAILED: 'failed',
};

export async function runPipeline(sourceId) {
    const source = await getSourceById(sourceId);
    if (!source) throw new Error(`source not found: ${sourceId}`);
    if (!source.raw_text) throw new Error('source has no raw_text');

    try {
        // 1.5 도메인 분류
        await updateSourceStatus(sourceId, STATUS.CLASSIFYING);
        const cls = await classifyDomain({ rawText: source.raw_text, licenceId: source.licence_id });
        await setSourceDomainScore(sourceId, cls.score);

        // 2. 요약
        await updateSourceStatus(sourceId, STATUS.SUMMARIZING);
        const sum = await summarizeInKorean({ rawText: source.raw_text, licenceId: source.licence_id });

        // 3. 개념 추출
        const concepts = await extractConcepts({ rawText: source.raw_text, licenceId: source.licence_id });

        // 4. 문제 생성
        const problems = await generateProblems({ rawText: source.raw_text, concepts, licenceId: source.licence_id });

        // 5. 번역
        await updateSourceStatus(sourceId, STATUS.TRANSLATING);
        const summaryAll = { ko: sum.ko, ...(await translateSummary({ koText: sum.ko })) };
        const conceptsAll = await translateConcepts({ concepts });
        const problemsAll = [];
        for (const p of problems) {
            const t = await translateProblem({ problem: p });
            problemsAll.push({ ...p, translations: t.translations, keyword_hints: t.keyword_hints });
        }

        // DB 저장
        await upsertSummary(sourceId, summaryAll);
        await insertConcepts(sourceId, conceptsAll);
        await insertProblems(sourceId, problemsAll);

        await updateSourceStatus(sourceId, STATUS.DONE);
        return { ok: true };
    } catch (e) {
        const msg = e?.message ?? String(e);
        console.error(`pipeline failed for ${sourceId}:`, msg);
        await updateSourceStatus(sourceId, STATUS.FAILED, msg);
        return { ok: false, error: msg };
    }
}
