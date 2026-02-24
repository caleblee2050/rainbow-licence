// SM-2 간격반복 학습 엔진 + 학습 통계
// localStorage 기반 (Phase 2-B에서 Turso DB로 마이그레이션)

const STORAGE_KEY = 'rainbow_study';

// ===== SM-2 Spaced Repetition Algorithm =====
// quality: 0-5 (0=완전 모름, 5=완벽히 앎)
export function calculateNextReview(card, quality) {
    let { repetition, easeFactor, interval } = card;

    if (quality >= 3) {
        // 성공
        if (repetition === 0) interval = 1;
        else if (repetition === 1) interval = 3;
        else interval = Math.round(interval * easeFactor);
        repetition += 1;
    } else {
        // 실패 → 처음부터
        repetition = 0;
        interval = 1;
    }

    // Ease Factor 업데이트
    easeFactor = Math.max(1.3, easeFactor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));

    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + interval);

    return {
        repetition,
        easeFactor: Math.round(easeFactor * 100) / 100,
        interval,
        nextReviewDate: nextReviewDate.toISOString(),
        lastReviewed: new Date().toISOString(),
    };
}

// ===== 학습 데이터 관리 =====
function getStudyData() {
    if (typeof window === 'undefined') return getDefaultData();
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : getDefaultData();
    } catch {
        return getDefaultData();
    }
}

function saveStudyData(data) {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
        console.warn('LocalStorage save failed:', e);
    }
}

function getDefaultData() {
    return {
        user: {
            language: 'vi',
            koreanLevel: null, // beginner/intermediate/advanced
            selectedLicence: null,
            targetExamDate: null,
            studyMode: 'step1',
            onboardingComplete: false,
            createdAt: new Date().toISOString(),
        },
        streak: {
            current: 0,
            longest: 0,
            lastStudyDate: null,
        },
        cards: {}, // questionId → SM-2 card data
        stats: {
            totalAnswered: 0,
            totalCorrect: 0,
            byLicence: {},   // licenceId → { answered, correct }
            bySubject: {},    // subject → { answered, correct }
            dailyLog: {},     // 'YYYY-MM-DD' → { answered, correct }
        },
        premium: {
            active: false,
            plan: null,
            expiresAt: null,
        },
    };
}

// ===== Public API =====

// 사용자 설정
export function getUserProfile() {
    return getStudyData().user;
}

export function updateUserProfile(updates) {
    const data = getStudyData();
    data.user = { ...data.user, ...updates };
    saveStudyData(data);
    return data.user;
}

export function isOnboardingComplete() {
    return getStudyData().user.onboardingComplete;
}

export function completeOnboarding(profile) {
    const data = getStudyData();
    data.user = { ...data.user, ...profile, onboardingComplete: true };
    saveStudyData(data);
}

// 스트릭
export function getStreak() {
    const data = getStudyData();
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    if (data.streak.lastStudyDate === today) {
        return data.streak;
    } else if (data.streak.lastStudyDate === yesterday) {
        return data.streak; // 아직 오늘 안 했지만 유지
    } else if (data.streak.lastStudyDate) {
        // 스트릭 끊김
        data.streak.current = 0;
        saveStudyData(data);
    }
    return data.streak;
}

function updateStreak() {
    const data = getStudyData();
    const today = new Date().toISOString().split('T')[0];

    if (data.streak.lastStudyDate !== today) {
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

        if (data.streak.lastStudyDate === yesterday || !data.streak.lastStudyDate) {
            data.streak.current += 1;
        } else {
            data.streak.current = 1;
        }

        data.streak.longest = Math.max(data.streak.longest, data.streak.current);
        data.streak.lastStudyDate = today;
        saveStudyData(data);
    }
}

// 문제 풀기 기록
export function recordAnswer(questionId, licenceId, subject, isCorrect) {
    const data = getStudyData();
    const today = new Date().toISOString().split('T')[0];

    // 스트릭 업데이트
    updateStreak();

    // SM-2 카드 업데이트
    const card = data.cards[questionId] || {
        repetition: 0,
        easeFactor: 2.5,
        interval: 1,
        nextReviewDate: null,
        lastReviewed: null,
    };
    const quality = isCorrect ? 4 : 1;
    data.cards[questionId] = calculateNextReview(card, quality);

    // 통계 업데이트
    data.stats.totalAnswered += 1;
    if (isCorrect) data.stats.totalCorrect += 1;

    // 자격증별
    if (!data.stats.byLicence[licenceId]) {
        data.stats.byLicence[licenceId] = { answered: 0, correct: 0 };
    }
    data.stats.byLicence[licenceId].answered += 1;
    if (isCorrect) data.stats.byLicence[licenceId].correct += 1;

    // 과목별
    if (!data.stats.bySubject[subject]) {
        data.stats.bySubject[subject] = { answered: 0, correct: 0 };
    }
    data.stats.bySubject[subject].answered += 1;
    if (isCorrect) data.stats.bySubject[subject].correct += 1;

    // 일별
    if (!data.stats.dailyLog[today]) {
        data.stats.dailyLog[today] = { answered: 0, correct: 0 };
    }
    data.stats.dailyLog[today].answered += 1;
    if (isCorrect) data.stats.dailyLog[today].correct += 1;

    saveStudyData(data);
}

// 복습 대기 카드 가져오기
export function getDueCards(licenceId) {
    const data = getStudyData();
    const now = new Date().toISOString();
    const dueCards = [];

    Object.entries(data.cards).forEach(([questionId, card]) => {
        if (card.nextReviewDate && card.nextReviewDate <= now) {
            // licenceId 필터는 question data에서 확인 필요
            dueCards.push({ questionId, ...card });
        }
    });

    return dueCards.sort((a, b) =>
        new Date(a.nextReviewDate) - new Date(b.nextReviewDate)
    );
}

// 오답 카드 가져오기
export function getWrongCards() {
    const data = getStudyData();
    return Object.entries(data.cards)
        .filter(([, card]) => card.repetition === 0 && card.lastReviewed)
        .map(([questionId, card]) => ({ questionId, ...card }));
}

// 통계 가져오기
export function getStats() {
    return getStudyData().stats;
}

export function getLicenceStats(licenceId) {
    const stats = getStudyData().stats;
    return stats.byLicence[licenceId] || { answered: 0, correct: 0 };
}

export function getAccuracyRate(licenceId) {
    const s = getLicenceStats(licenceId);
    return s.answered > 0 ? Math.round((s.correct / s.answered) * 100) : 0;
}

// 합격 예측
export function getPredictedScore(licenceId) {
    const rate = getAccuracyRate(licenceId);
    const stats = getLicenceStats(licenceId);
    if (stats.answered < 5) return null; // 데이터 부족
    return {
        score: rate,
        passed: rate >= 60,
        confidence: stats.answered >= 30 ? 'high' : stats.answered >= 15 ? 'medium' : 'low',
    };
}

// 주간 통계
export function getWeeklyStats() {
    const data = getStudyData();
    const result = [];

    for (let i = 6; i >= 0; i--) {
        const date = new Date(Date.now() - i * 86400000);
        const key = date.toISOString().split('T')[0];
        const dayLog = data.stats.dailyLog[key] || { answered: 0, correct: 0 };
        result.push({
            date: key,
            day: ['일', '월', '화', '수', '목', '금', '토'][date.getDay()],
            ...dayLog,
        });
    }

    return result;
}

// D-day 계산
export function getDday() {
    const data = getStudyData();
    if (!data.user.targetExamDate) return null;
    const target = new Date(data.user.targetExamDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    target.setHours(0, 0, 0, 0);
    const diff = Math.ceil((target - today) / 86400000);
    return diff;
}

// 프리미엄 상태
export function isPremium() {
    const data = getStudyData();
    if (!data.premium.active) return false;
    if (data.premium.expiresAt && new Date(data.premium.expiresAt) < new Date()) {
        data.premium.active = false;
        saveStudyData(data);
        return false;
    }
    return true;
}

export function activatePremium(plan, durationDays) {
    const data = getStudyData();
    const expires = new Date();
    expires.setDate(expires.getDate() + durationDays);
    data.premium = {
        active: true,
        plan,
        expiresAt: expires.toISOString(),
    };
    saveStudyData(data);
}

// 전체 리셋 (디버그용)
export function resetAllData() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEY);
}
