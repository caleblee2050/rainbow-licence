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

describe('한식조리 다국어 필드 (M1.5)', () => {
    it('모든 문제에 5언어 translations 채워짐', () => {
        const langs = ['vi', 'zh', 'th', 'tl', 'my'];
        for (const q of koreanFoodQuestions) {
            for (const lang of langs) {
                expect(q.translations?.[lang]?.question, `${q.id} ${lang}.question 누락`).toBeTruthy();
                expect(q.translations?.[lang]?.options, `${q.id} ${lang}.options 누락`).toHaveLength(4);
                expect(q.translations?.[lang]?.explanation, `${q.id} ${lang}.explanation 누락`).toBeTruthy();
            }
        }
    });
    it('keywordHints는 각 언어에 4개 이상', () => {
        const langs = ['vi', 'zh', 'th', 'tl', 'my'];
        for (const q of koreanFoodQuestions) {
            for (const lang of langs) {
                const hints = q.keywordHints?.[lang] || [];
                expect(hints.length, `${q.id} ${lang} 키워드 ${hints.length}개 (4 이상 필요)`).toBeGreaterThanOrEqual(4);
                for (const h of hints) {
                    expect(h.korean, `${q.id} ${lang} 키워드 korean 누락`).toBeTruthy();
                    expect(h.native, `${q.id} ${lang} 키워드 native 누락`).toBeTruthy();
                }
            }
        }
    });
    it('keywordHints의 korean은 문제 본문에 등장', () => {
        for (const q of koreanFoodQuestions) {
            const text = q.question + ' ' + q.options.join(' ');
            for (const lang of ['vi', 'zh', 'th', 'tl', 'my']) {
                for (const h of (q.keywordHints?.[lang] || [])) {
                    expect(text.includes(h.korean), `${q.id} ${lang} 키워드 '${h.korean}' 본문에 없음`).toBe(true);
                }
            }
        }
    });
});
