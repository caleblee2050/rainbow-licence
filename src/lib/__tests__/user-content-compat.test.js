// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { koreanFoodQuestions } from '@/data/questions/korean-food';

describe('사용자 문제 형식 호환', () => {
    it('공식 kf-01과 동일한 키 구조', () => {
        const official = koreanFoodQuestions[0];
        const userShape = {
            id: 'p-uuid',
            licenceId: 'korean-food',
            subject: 'user',
            question: 'Q',
            simpleQuestion: 'simple Q',
            options: ['a','b','c','d'],
            correctAnswer: 0,
            explanation: 'E',
            simpleExplanation: 'simple E',
            keywords: [],
            translations: { vi: { question: 'Qv', options: ['a','b','c','d'], explanation: 'Ev' } },
            keywordHints: { vi: [{ korean: 'a', native: 'av' }] },
        };
        for (const key of ['id','licenceId','subject','question','options','correctAnswer','explanation','translations','keywordHints']) {
            expect(userShape).toHaveProperty(key);
            expect(official).toHaveProperty(key);
        }
        expect(userShape.options).toHaveLength(4);
        expect(Object.keys(userShape.translations.vi)).toEqual(expect.arrayContaining(['question','options','explanation']));
    });
});
