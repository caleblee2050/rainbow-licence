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
    it('모든 문제에 5언어 translations 채워짐', () => {
        const langs = ['vi', 'zh', 'th', 'tl', 'my'];
        for (const q of beautyGeneralQuestions) {
            for (const lang of langs) {
                expect(q.translations?.[lang]?.question, `${q.id} ${lang}.question 누락`).toBeTruthy();
                expect(q.translations?.[lang]?.options, `${q.id} ${lang}.options 누락`).toHaveLength(4);
                expect(q.translations?.[lang]?.explanation, `${q.id} ${lang}.explanation 누락`).toBeTruthy();
            }
        }
    });
    it('keywordHints는 각 언어에 4개 이상', () => {
        const langs = ['vi', 'zh', 'th', 'tl', 'my'];
        for (const q of beautyGeneralQuestions) {
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
        for (const q of beautyGeneralQuestions) {
            const text = q.question + ' ' + q.options.join(' ');
            for (const lang of ['vi', 'zh', 'th', 'tl', 'my']) {
                for (const h of (q.keywordHints?.[lang] || [])) {
                    expect(text.includes(h.korean), `${q.id} ${lang} 키워드 '${h.korean}' 본문에 없음`).toBe(true);
                }
            }
        }
    });
});
