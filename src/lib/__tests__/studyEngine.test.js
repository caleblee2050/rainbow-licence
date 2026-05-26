import { describe, it, expect, beforeEach } from 'vitest';
import { calculateNextReview, isPremium, getStreak, getStats } from '../studyEngine';

describe('studyEngine smoke', () => {
    it('calculateNextReview returns card with required fields', () => {
        const card = { repetition: 0, easeFactor: 2.5, interval: 0 };
        const result = calculateNextReview(card, 5);
        expect(result).toHaveProperty('repetition');
        expect(result).toHaveProperty('easeFactor');
        expect(result).toHaveProperty('interval');
        expect(result).toHaveProperty('nextReviewDate');
        expect(result).toHaveProperty('lastReviewed');
    });
});

describe('studyEngine — legacy localStorage migration', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('isPremium() does not crash when premium key missing (legacy data)', () => {
        // 옛 버전 데이터: premium 키 없음
        const legacyData = {
            user: { language: 'vi', onboardingComplete: true },
            streak: { current: 0, longest: 0 },
            cards: {},
            stats: { totalAnswered: 0, totalCorrect: 0, byLicence: {}, bySubject: {}, dailyLog: {} },
            // premium 키 없음
        };
        localStorage.setItem('rainbow_study', JSON.stringify(legacyData));
        expect(() => isPremium()).not.toThrow();
        expect(isPremium()).toBe(false);
    });

    it('getStreak() does not crash with empty localStorage', () => {
        expect(() => getStreak()).not.toThrow();
        expect(getStreak()).toEqual(expect.objectContaining({ current: 0, longest: 0 }));
    });

    it('getStats() returns defaults when stats key missing', () => {
        localStorage.setItem('rainbow_study', JSON.stringify({ user: {} }));
        expect(() => getStats()).not.toThrow();
        expect(getStats()).toEqual(expect.objectContaining({
            totalAnswered: 0,
            totalCorrect: 0,
        }));
    });
});
