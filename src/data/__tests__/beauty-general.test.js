import { describe, it, expect } from 'vitest';
import { beautyGeneralQuestions } from '../../data/questions/beauty-general';
import { beautyGeneralTerms } from '../../data/terms/beauty-general';

describe('미용사(일반) 콘텐츠', () => {
    it('문제 60개', () => {
        expect(beautyGeneralQuestions).toHaveLength(60);
    });
    it('단원 4개 × 15문제', () => {
        const bySubject = beautyGeneralQuestions.reduce((acc, q) => {
            acc[q.subject] = (acc[q.subject] || 0) + 1;
            return acc;
        }, {});
        ['hair-theory', 'cosmetic', 'beauty-hygiene', 'beauty-theory'].forEach(s => {
            expect(bySubject[s]).toBe(15);
        });
    });
    it('필수 필드 검증', () => {
        for (const q of beautyGeneralQuestions) {
            expect(q.id).toMatch(/^bg-\d{2}$/);
            expect(q.licenceId).toBe('beauty-general');
            expect(q.options).toHaveLength(4);
            expect(q.simpleQuestion).toBeTruthy();
            expect(q.simpleExplanation).toBeTruthy();
        }
    });
    it('용어 40개', () => {
        expect(beautyGeneralTerms).toHaveLength(40);
    });
});

describe('미용일반 다국어 필드 (M1.5)', () => {
    it.skip('아직 미작성 — Task M1.5-3 이후 활성화', () => {
        // 다국어 번역 완료 후 활성화:
        // for (const q of beautyGeneralQuestions) {
        //     expect(q.translations).toBeDefined();
        //     expect(q.translations.vi.question).toBeTruthy();
        //     ...
        // }
    });
});
