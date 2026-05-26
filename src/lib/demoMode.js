// 데모/학교 환경 감지 + 학교명 노출 헬퍼
const DEMO_FLAG = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
const SCHOOL = process.env.NEXT_PUBLIC_SCHOOL_NAME || '';

export function isDemoMode() {
    return DEMO_FLAG;
}

export function getSchoolName() {
    return SCHOOL;
}

export function shouldHidePremium() {
    return isDemoMode();
}

export function isPremiumGateUnlocked() {
    // DEMO 모드에선 모든 프리미엄 기능 잠금 해제
    return isDemoMode();
}
