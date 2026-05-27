// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { callJsonMode } from '../ai/json-mode';

const mockCreate = vi.fn();
vi.mock('@anthropic-ai/sdk', () => ({
    default: class { constructor() { this.messages = { create: mockCreate }; } },
}));

beforeEach(() => {
    process.env.KIE_API_KEY = 'test-key';
    mockCreate.mockReset();
});

describe('callJsonMode', () => {
    it('정상 JSON 응답', async () => {
        mockCreate.mockResolvedValueOnce({
            content: [{ type: 'text', text: '{"foo":"bar"}' }],
        });
        const result = await callJsonMode({ system: 's', user: 'u' });
        expect(result.foo).toBe('bar');
    });

    it('코드 블록 감싸진 JSON', async () => {
        mockCreate.mockResolvedValueOnce({
            content: [{ type: 'text', text: '```json\n{"x":1}\n```' }],
        });
        const result = await callJsonMode({ system: 's', user: 'u' });
        expect(result.x).toBe(1);
    });

    it('첫 시도 실패 후 재시도', async () => {
        mockCreate.mockResolvedValueOnce({ content: [{ type: 'text', text: 'not json' }] });
        mockCreate.mockResolvedValueOnce({ content: [{ type: 'text', text: '{"ok":true}' }] });
        const result = await callJsonMode({ system: 's', user: 'u', retries: 1 });
        expect(result.ok).toBe(true);
        expect(mockCreate).toHaveBeenCalledTimes(2);
    });

    it('두 번 다 실패하면 throw', async () => {
        mockCreate.mockResolvedValue({ content: [{ type: 'text', text: 'never json' }] });
        await expect(callJsonMode({ system: 's', user: 'u', retries: 1 })).rejects.toThrow(/JSON parse failed/);
    });
});
