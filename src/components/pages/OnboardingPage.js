'use client';

import { useState } from 'react';
import { supportedLanguages, licences } from '@/data/licences';
import { completeOnboarding } from '@/lib/studyEngine';
import { isLanguageVerified } from '@/lib/demoMode';

const STEPS = ['language', 'level', 'licence', 'goal'];

const levelQuestions = [
    { question: '다음 중 "음식"을 뜻하는 단어는?', options: ['음식', '음악', '운동', '유학'], answer: 0 },
    { question: '"식품위생법"은 무엇에 관한 법률인가?', options: ['음악', '음식 안전', '교통', '교육'], answer: 1 },
    { question: '"갈변 현상"이란?', options: ['음식이 갈색으로 변하는 것', '음식이 차가워지는 것', '음식에 소금을 넣는 것', '음식을 포장하는 것'], answer: 0 },
];

// 언어 카드 호버 효과를 위한 inline style helper
const langCardStyle = (isSelected) => ({
    padding: 'var(--space-4)',
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-4)',
    border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border)',
    borderRadius: 'var(--radius-md)',
    fontFamily: 'inherit',
    cursor: 'pointer',
    background: isSelected ? 'var(--primary-soft)' : 'var(--bg-card)',
    width: '100%',
    textAlign: 'left',
    boxShadow: 'var(--shadow-card)',
    transition: 'transform var(--dur-micro) var(--easing-move), box-shadow var(--dur-micro) var(--easing-move), border-color var(--dur-micro) var(--easing-move)',
    outline: 'none',
});

// 자격증 카드 스타일
const licenceCardStyle = (isSelected) => ({
    padding: 'var(--space-4)',
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-3)',
    border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border)',
    borderRadius: 'var(--radius-md)',
    fontFamily: 'inherit',
    cursor: 'pointer',
    background: isSelected ? 'var(--primary-soft)' : 'var(--bg-card)',
    width: '100%',
    textAlign: 'left',
    boxShadow: 'var(--shadow-card)',
    transition: 'transform var(--dur-micro) var(--easing-move), box-shadow var(--dur-micro) var(--easing-move), border-color var(--dur-micro) var(--easing-move)',
    outline: 'none',
});

export default function OnboardingPage({ onComplete }) {
    const [step, setStep] = useState(0);
    const [language, setLanguage] = useState('vi');
    const [levelScore, setLevelScore] = useState(0);
    const [levelIndex, setLevelIndex] = useState(0);
    const [selectedLicence, setSelectedLicence] = useState(null);
    const [targetDate, setTargetDate] = useState('');

    const currentStep = STEPS[step];

    const determineLevel = (score) => {
        if (score >= 3) return 'advanced';
        if (score >= 2) return 'intermediate';
        return 'beginner';
    };

    const handleLevelAnswer = (idx) => {
        const correct = idx === levelQuestions[levelIndex].answer;
        const newScore = levelScore + (correct ? 1 : 0);
        setLevelScore(newScore);

        if (levelIndex < levelQuestions.length - 1) {
            setLevelIndex(levelIndex + 1);
        } else {
            // 진단 완료, 다음 단계로
            setStep(2);
        }
    };

    const handleComplete = () => {
        const level = determineLevel(levelScore);
        const profile = {
            language,
            koreanLevel: level,
            selectedLicence,
            targetExamDate: targetDate || null,
            studyMode: level === 'beginner' ? 'step1' : level === 'intermediate' ? 'step2' : 'step3',
        };
        completeOnboarding(profile);
        onComplete(profile);
    };

    return (
        <div className="onboarding-desktop" style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--bg-main)',
        }}>
            {/* Progress */}
            <div style={{
                padding: 'var(--space-5) var(--content-padding)',
                paddingTop: 'env(safe-area-inset-top, var(--space-5))',
            }}>
                <div style={{
                    display: 'flex',
                    gap: 'var(--space-2)',
                    marginBottom: 'var(--space-2)',
                }}>
                    {STEPS.map((_, i) => (
                        <div key={i} style={{
                            flex: 1,
                            height: 4,
                            borderRadius: 'var(--radius-full)',
                            background: i <= step ? 'var(--primary)' : 'var(--gray-200)',
                            transition: 'background var(--transition-normal)',
                        }} />
                    ))}
                </div>
                <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', textAlign: 'right' }}>
                    {step + 1} / {STEPS.length}
                </p>
            </div>

            {/* Content */}
            <div style={{
                flex: 1,
                padding: '0 var(--content-padding)',
                display: 'flex',
                flexDirection: 'column',
            }}>
                {/* Step 1: Language — 5개 언어 카드 동등 크기·동등 무게 */}
                {currentStep === 'language' && (
                    <div className="animate-fadeIn">
                        <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
                            <div style={{ fontSize: 56, marginBottom: 'var(--space-4)' }}>🌈</div>
                            <h1 style={{ fontSize: 'var(--font-2xl)', fontWeight: 800, marginBottom: 'var(--space-2)' }}>
                                환영합니다!
                            </h1>
                            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-sm)' }}>
                                어떤 언어를 사용하시나요?
                            </p>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                            {supportedLanguages.map((lang) => (
                                <button
                                    key={lang.code}
                                    onClick={() => setLanguage(lang.code)}
                                    style={{ ...langCardStyle(language === lang.code), position: 'relative' }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-1px)';
                                        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = 'var(--shadow-card)';
                                    }}
                                >
                                    {!isLanguageVerified(lang.code) && (
                                        <span style={{
                                            position: 'absolute', top: 8, right: 8,
                                            background: 'transparent',
                                            color: 'var(--text-muted)',
                                            fontSize: 10,
                                            padding: '2px 6px',
                                            borderRadius: 'var(--radius-full)',
                                            border: '1px solid var(--border)',
                                            pointerEvents: 'none',
                                        }}>AI</span>
                                    )}
                                    <span style={{ fontSize: 32 }}>{lang.flag}</span>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 600, fontSize: 'var(--font-base)' }}>{lang.nativeName}</div>
                                        <div style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)' }}>{lang.name}</div>
                                    </div>
                                    {language === lang.code && (
                                        <span className="iconify" data-icon="mdi:check-circle" style={{ fontSize: 22, color: 'var(--primary)' }}></span>
                                    )}
                                </button>
                            ))}
                        </div>

                        <button
                            className="btn btn--primary btn--full btn--lg"
                            onClick={() => setStep(1)}
                            style={{ marginTop: 'var(--space-8)' }}
                        >
                            다음 →
                        </button>
                    </div>
                )}

                {/* Step 2: Level Test */}
                {currentStep === 'level' && (
                    <div className="animate-fadeIn">
                        <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
                            <div style={{ fontSize: 48, marginBottom: 'var(--space-3)' }}>📝</div>
                            <h2 style={{ fontSize: 'var(--font-xl)', fontWeight: 700, marginBottom: 'var(--space-2)' }}>
                                한국어 수준 진단
                            </h2>
                            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-sm)' }}>
                                간단한 문제 {levelQuestions.length}개로 확인해요
                            </p>
                        </div>

                        <div className="card" style={{ padding: 'var(--space-5)', marginBottom: 'var(--space-4)' }}>
                            <span className="badge badge--primary" style={{ marginBottom: 'var(--space-3)', display: 'inline-flex' }}>
                                문제 {levelIndex + 1} / {levelQuestions.length}
                            </span>
                            {/* 문제 헤딩: Fraunces 디스플레이 폰트 */}
                            <h3 style={{
                                fontSize: 'var(--font-base)',
                                fontFamily: 'var(--font-display)',
                                fontWeight: 600,
                                lineHeight: 1.6,
                                marginBottom: 'var(--space-4)',
                                color: 'var(--text-primary)',
                            }}>
                                {levelQuestions[levelIndex].question}
                            </h3>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                                {levelQuestions[levelIndex].options.map((opt, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleLevelAnswer(idx)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 'var(--space-3)',
                                            padding: 'var(--space-3) var(--space-4)',
                                            background: 'var(--bg-card)',
                                            border: '1px solid var(--border)',
                                            borderRadius: 'var(--radius-md)',
                                            fontFamily: 'inherit',
                                            fontSize: 'var(--font-sm)',
                                            color: 'var(--text-primary)',
                                            textAlign: 'left',
                                            cursor: 'pointer',
                                            width: '100%',
                                            transition: 'border-color var(--dur-micro) var(--easing-move), box-shadow var(--dur-micro) var(--easing-move)',
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.borderColor = 'var(--primary-light)';
                                            e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.borderColor = 'var(--border)';
                                            e.currentTarget.style.boxShadow = 'none';
                                        }}
                                    >
                                        <span style={{
                                            width: 28, height: 28, borderRadius: '50%',
                                            background: 'var(--primary-soft)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            flexShrink: 0,
                                            fontSize: 'var(--font-xs)', fontWeight: 600, color: 'var(--primary)',
                                        }}>
                                            {idx + 1}
                                        </span>
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 3: Licence Selection */}
                {currentStep === 'licence' && (
                    <div className="animate-fadeIn">
                        <div style={{ textAlign: 'center', marginBottom: 'var(--space-4)' }}>
                            <div style={{ fontSize: 48, marginBottom: 'var(--space-3)' }}>🎯</div>
                            <h2 style={{ fontSize: 'var(--font-xl)', fontWeight: 700, marginBottom: 'var(--space-2)' }}>
                                어떤 자격증을 준비하세요?
                            </h2>
                            <div style={{
                                display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)',
                                padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-full)',
                                background: levelScore >= 2 ? 'var(--success-bg)' : 'var(--warning-bg)',
                                fontSize: 'var(--font-xs)', fontWeight: 600,
                                color: levelScore >= 2 ? 'var(--success)' : 'var(--warning)',
                            }}>
                                한국어 수준: {determineLevel(levelScore) === 'advanced' ? '고급 🌟' : determineLevel(levelScore) === 'intermediate' ? '중급 🌿' : '초급 🌱'}
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                            {licences.map((l) => (
                                <button
                                    key={l.id}
                                    onClick={() => setSelectedLicence(l.id)}
                                    style={licenceCardStyle(selectedLicence === l.id)}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-1px)';
                                        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = 'var(--shadow-card)';
                                    }}
                                >
                                    <span style={{ fontSize: 28 }}>{l.icon}</span>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 600, fontSize: 'var(--font-sm)' }}>{l.name}</div>
                                        {l.multiLangExam && (
                                            <span style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                marginTop: 4,
                                                padding: '2px 8px',
                                                background: 'var(--accent)',
                                                color: '#ffffff',
                                                borderRadius: 'var(--radius-full)',
                                                fontSize: 11,
                                                fontWeight: 600,
                                            }}>🌐 다국어 시험 가능</span>
                                        )}
                                    </div>
                                    {selectedLicence === l.id && (
                                        <span className="iconify" data-icon="mdi:check-circle" style={{ fontSize: 22, color: 'var(--primary)' }}></span>
                                    )}
                                </button>
                            ))}
                        </div>

                        <button
                            className="btn btn--primary btn--full btn--lg"
                            onClick={() => setStep(3)}
                            disabled={!selectedLicence}
                            style={{ marginTop: 'var(--space-6)' }}
                        >
                            다음 →
                        </button>
                    </div>
                )}

                {/* Step 4: Goal Setting */}
                {currentStep === 'goal' && (
                    <div className="animate-fadeIn">
                        <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
                            <div style={{ fontSize: 48, marginBottom: 'var(--space-3)' }}>📅</div>
                            <h2 style={{ fontSize: 'var(--font-xl)', fontWeight: 700, marginBottom: 'var(--space-2)' }}>
                                시험 목표일 설정
                            </h2>
                            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-sm)' }}>
                                선택사항이에요. 나중에 변경할 수 있어요.
                            </p>
                        </div>

                        <div className="card" style={{ padding: 'var(--space-5)', marginBottom: 'var(--space-6)' }}>
                            <label style={{
                                fontSize: 'var(--font-sm)', fontWeight: 600,
                                display: 'block', marginBottom: 'var(--space-2)',
                            }}>
                                시험 예정일
                            </label>
                            <input
                                type="date"
                                value={targetDate}
                                onChange={(e) => setTargetDate(e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                                style={{
                                    width: '100%',
                                    padding: 'var(--space-3) var(--space-4)',
                                    border: '1px solid var(--border)',
                                    borderRadius: 'var(--radius-md)',
                                    fontSize: 'var(--font-base)',
                                    fontFamily: 'inherit',
                                    color: 'var(--text-primary)',
                                    outline: 'none',
                                    background: 'var(--bg-card)',
                                }}
                            />
                        </div>

                        {/* Summary — var(--primary-soft) 배경 + accent 보더 */}
                        <div style={{
                            background: 'var(--primary-soft)',
                            border: '1px solid var(--accent-soft)',
                            borderRadius: 'var(--radius-md)',
                            padding: 'var(--space-5)',
                            marginBottom: 'var(--space-6)',
                        }}>
                            <h3 style={{ fontWeight: 700, marginBottom: 'var(--space-3)', color: 'var(--text-primary)' }}>🎉 학습 플랜 요약</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', fontSize: 'var(--font-sm)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>언어</span>
                                    <strong>{supportedLanguages.find(l => l.code === language)?.nativeName}</strong>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>한국어 수준</span>
                                    <strong>{determineLevel(levelScore) === 'advanced' ? '고급' : determineLevel(levelScore) === 'intermediate' ? '중급' : '초급'}</strong>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>자격증</span>
                                    <strong>{licences.find(l => l.id === selectedLicence)?.name}</strong>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>시작 모드</span>
                                    <strong style={{ color: 'var(--primary)' }}>
                                        {determineLevel(levelScore) === 'beginner' ? 'STEP 1 🌱 완전번역' :
                                            determineLevel(levelScore) === 'intermediate' ? 'STEP 2 🌿 키워드힌트' : 'STEP 3 🌳 실전'}
                                    </strong>
                                </div>
                            </div>
                        </div>

                        {/* CTA — var(--primary) 솔리드 */}
                        <button
                            className="btn btn--primary btn--full btn--lg"
                            onClick={handleComplete}
                        >
                            🚀 학습 시작하기!
                        </button>
                        <button
                            className="btn btn--ghost btn--full"
                            onClick={() => {
                                setTargetDate('');
                                handleComplete();
                            }}
                            style={{ marginTop: 'var(--space-2)' }}
                        >
                            목표일 없이 시작
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
