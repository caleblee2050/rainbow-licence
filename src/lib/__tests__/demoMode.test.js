import { describe, it, expect } from 'vitest';
import { isDemoMode, getSchoolName, shouldHidePremium, isPremiumGateUnlocked } from '../demoMode';

describe('demoMode', () => {
    it('reads env flags via the module', () => {
        // 정적 환경변수 확인 — process.env.NEXT_PUBLIC_DEMO_MODE은
        // 빌드 타임에 인라이닝되므로 vitest에선 module-level 상수 확인
        expect(typeof isDemoMode()).toBe('boolean');
        expect(typeof getSchoolName()).toBe('string');
    });
    it('shouldHidePremium and isPremiumGateUnlocked agree with isDemoMode', () => {
        expect(shouldHidePremium()).toBe(isDemoMode());
        expect(isPremiumGateUnlocked()).toBe(isDemoMode());
    });
});
