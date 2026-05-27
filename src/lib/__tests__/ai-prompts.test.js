// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { classifyDomain } from '../ai/prompts/classify';
import { summarizeInKorean } from '../ai/prompts/summarize';

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
