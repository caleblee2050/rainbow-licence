import { describe, it, expect } from 'vitest';
import { pastryQuestions } from '../../data/questions/pastry';
import { pastryTerms } from '../../data/terms/pastry';

describe('제과기능사 콘텐츠', () => {
    it('문제 60개', () => {
        expect(pastryQuestions).toHaveLength(60);
    });
    it('단원 3개 × 20문제', () => {
        const bySubject = pastryQuestions.reduce((acc, q) => {
            acc[q.subject] = (acc[q.subject] || 0) + 1;
            return acc;
        }, {});
        ['pastry-theory', 'pastry-process', 'pastry-hygiene'].forEach(s => {
            expect(bySubject[s]).toBe(20);
        });
    });
    it('필수 필드 검증', () => {
        for (const q of pastryQuestions) {
            expect(q.id).toMatch(/^ps-\d{2}$/);
            expect(q.licenceId).toBe('pastry');
            expect(q.options).toHaveLength(4);
            expect(q.simpleQuestion).toBeTruthy();
            expect(q.simpleExplanation).toBeTruthy();
        }
    });
    it('용어 40개', () => {
        expect(pastryTerms).toHaveLength(40);
    });
});
