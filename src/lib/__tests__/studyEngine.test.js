import { describe, it, expect, beforeEach } from 'vitest';
import { calculateNextReview } from '../studyEngine';

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
