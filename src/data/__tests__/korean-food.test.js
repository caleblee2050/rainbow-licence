import { describe, it, expect } from 'vitest';
import { koreanFoodQuestions } from '../questions/korean-food';
import { koreanFoodTerms } from '../terms/korean-food';

describe('한식조리기능사 콘텐츠', () => {
    it('문제 60개', () => {
        expect(koreanFoodQuestions).toHaveLength(60);
    });
    it('모든 문제에 9필드 다 있음', () => {
        for (const q of koreanFoodQuestions) {
            expect(q.id).toMatch(/^kf-\d{2}$/);
            expect(q.licenceId).toBe('korean-food');
            expect(['food-hygiene', 'food-science', 'cooking-theory']).toContain(q.subject);
            expect(q.question).toBeTruthy();
            expect(q.simpleQuestion).toBeTruthy();
            expect(q.options).toHaveLength(4);
            expect([0, 1, 2, 3]).toContain(q.correctAnswer);
            expect(q.explanation).toBeTruthy();
            expect(q.simpleExplanation).toBeTruthy();
            expect(Array.isArray(q.keywords)).toBe(true);
        }
    });
    it('단원별 20문제씩', () => {
        const bySubject = koreanFoodQuestions.reduce((acc, q) => {
            acc[q.subject] = (acc[q.subject] || 0) + 1;
            return acc;
        }, {});
        expect(bySubject['food-hygiene']).toBe(20);
        expect(bySubject['food-science']).toBe(20);
        expect(bySubject['cooking-theory']).toBe(20);
    });
    it('용어 40개 + 5언어 필드 있음', () => {
        expect(koreanFoodTerms).toHaveLength(40);
        for (const t of koreanFoodTerms) {
            expect(t.korean).toBeTruthy();
            expect(t.pronunciation).toBeTruthy();
            expect(t.category).toBeTruthy();
            expect(t).toHaveProperty('vi');
            expect(t).toHaveProperty('zh');
            expect(t).toHaveProperty('th');
            expect(t).toHaveProperty('tl');
            expect(t).toHaveProperty('my');
        }
    });
});
