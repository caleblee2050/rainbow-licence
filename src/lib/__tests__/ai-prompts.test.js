// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { classifyDomain } from '../ai/prompts/classify';
import { summarizeInKorean } from '../ai/prompts/summarize';
import { extractConcepts } from '../ai/prompts/concepts';
import { generateProblems } from '../ai/prompts/problems';

const mockCreate = vi.fn();
vi.mock('@anthropic-ai/sdk', () => ({
    default: class { constructor() { this.messages = { create: mockCreate }; } },
}));

beforeEach(() => {
    process.env.ANTHROPIC_API_KEY = 'test-key';
    mockCreate.mockReset();
});

describe('classifyDomain', () => {
    it('score 0~1 clamp + reason', async () => {
        mockCreate.mockResolvedValueOnce({
            content: [{ type: 'text', text: '{"score": 0.92, "reason": "한식조리 식품위생 관련"}' }],
        });
        const r = await classifyDomain({ rawText: '식품위생 HACCP 설명...', licenceId: 'korean-food' });
        expect(r.score).toBe(0.92);
        expect(r.reason).toContain('식품위생');
    });
    it('out-of-range score clamp', async () => {
        mockCreate.mockResolvedValueOnce({
            content: [{ type: 'text', text: '{"score": 1.5, "reason": "x"}' }],
        });
        const r = await classifyDomain({ rawText: 'x', licenceId: 'korean-food' });
        expect(r.score).toBe(1);
    });
});

describe('summarizeInKorean', () => {
    it('summary 트림 후 반환', async () => {
        mockCreate.mockResolvedValueOnce({
            content: [{ type: 'text', text: '{"summary": "  한식조리 식품위생 핵심 요약  "}' }],
        });
        const r = await summarizeInKorean({ rawText: 'x', licenceId: 'korean-food' });
        expect(r.ko).toBe('한식조리 식품위생 핵심 요약');
    });
});

describe('extractConcepts', () => {
    it('정상 응답 정규화', async () => {
        mockCreate.mockResolvedValueOnce({
            content: [{ type: 'text', text: JSON.stringify({
                concepts: [
                    { korean: '식품위생', korean_definition: '식품의 안전을 지키는 행위', pronunciation: '식품위생', category: '식품위생' },
                    { korean: 'HACCP', korean_definition: '위해요소중점관리기준', category: '식품위생' },
                ],
            }) }],
        });
        const r = await extractConcepts({ rawText: 'x', licenceId: 'korean-food' });
        expect(r).toHaveLength(2);
        expect(r[0].korean).toBe('식품위생');
    });
    it('15개 초과 자르고 누락 필드 제외', async () => {
        mockCreate.mockResolvedValueOnce({
            content: [{ type: 'text', text: JSON.stringify({
                concepts: Array.from({ length: 20 }, (_, i) => ({ korean: `c${i}`, korean_definition: 'd' }))
                    .concat([{ korean: 'no-def' }]),
            }) }],
        });
        const r = await extractConcepts({ rawText: 'x', licenceId: 'korean-food' });
        expect(r).toHaveLength(15);
    });
});

describe('generateProblems', () => {
    it('스키마 어긋난 항목 제외', async () => {
        mockCreate.mockResolvedValueOnce({
            content: [{ type: 'text', text: JSON.stringify({
                problems: [
                    { ko_question: 'Q1?', ko_options: ['a','b','c','d'], correct_answer: 1, ko_explanation: 'E1' },
                    { ko_question: 'no options' },
                    { ko_question: 'Q3?', ko_options: ['a','b'], correct_answer: 0, ko_explanation: 'E3' }, // 옵션 2개
                    { ko_question: 'Q4?', ko_options: ['a','b','c','d'], correct_answer: 5, ko_explanation: 'E4' }, // 인덱스 범위 외
                ],
            }) }],
        });
        const r = await generateProblems({ rawText: 'x', concepts: [], licenceId: 'korean-food' });
        expect(r).toHaveLength(1);
        expect(r[0].ko_question).toBe('Q1?');
        expect(r[0].correct_answer).toBe(1);
    });
});
