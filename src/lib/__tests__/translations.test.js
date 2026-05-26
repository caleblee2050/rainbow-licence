import { describe, it, expect } from 'vitest';
import { getTranslatedQuestion, getKeywordHints, isLangVerified, getLangBadge, LANG_CODES } from '../translations';

describe('translations helpers', () => {
    const sample = {
        translations: {
            vi: { question: 'Q vi', options: ['A','B','C','D'], explanation: 'E vi' },
            zh: { question: 'Q zh', options: ['A','B','C','D'], explanation: 'E zh' },
        },
        keywordHints: {
            vi: [{ korean: '표시', native: 'ghi nhãn' }],
        },
    };
    it('returns translation when present', () => {
        expect(getTranslatedQuestion(sample, 'vi')).toBe('Q vi');
    });
    it('returns null when missing language', () => {
        expect(getTranslatedQuestion(sample, 'th')).toBe(null);
    });
    it('returns empty array for missing keyword hints', () => {
        expect(getKeywordHints(sample, 'th')).toEqual([]);
    });
    it('verified langs are vi and zh only', () => {
        expect(isLangVerified('vi')).toBe(true);
        expect(isLangVerified('zh')).toBe(true);
        expect(isLangVerified('th')).toBe(false);
    });
    it('language badge text', () => {
        expect(getLangBadge('vi')).toBe('✓ 검수 완료');
        expect(getLangBadge('th')).toBe('AI 번역');
    });
});
