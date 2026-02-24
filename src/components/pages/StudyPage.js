'use client';

import { useState, useMemo } from 'react';
import { licences } from '@/data/licences';
import { getQuestionsByLicence } from '@/data/questions';
import { recordAnswer, getAccuracyRate, getLicenceStats } from '@/lib/studyEngine';
import { PremiumLock } from '@/components/ui/PremiumBanner';

export default function StudyPage({ language, licenceId, studyMode, onStudyModeChange, onSelectLicence, isPremium }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [showResult, setShowResult] = useState(false);
    const [score, setScore] = useState({ correct: 0, total: 0 });
    const [showConfetti, setShowConfetti] = useState(false);

    const licence = licences.find(l => l.id === licenceId);
    const licenceQuestions = useMemo(() => getQuestionsByLicence(licenceId || 'korean-food'), [licenceId]);

    // Licence selector
    if (!licenceId) {
        return (
            <div className="animate-fadeIn">
                <div style={{ marginBottom: 'var(--space-5)' }}>
                    <h2 style={{ fontSize: 'var(--font-2xl)', fontWeight: 800, marginBottom: 'var(--space-2)' }}>📝 학습하기</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-sm)' }}>자격증을 선택해서 시작하세요</p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                    {licences.map(l => {
                        const count = getQuestionsByLicence(l.id).length;
                        const rate = getAccuracyRate(l.id);
                        const stats = getLicenceStats(l.id);
                        return (
                            <button
                                key={l.id}
                                className="card card--interactive"
                                onClick={() => count > 0 && onSelectLicence(l.id)}
                                style={{
                                    padding: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
                                    textAlign: 'left', border: 'none', width: '100%', fontFamily: 'inherit', cursor: count > 0 ? 'pointer' : 'default',
                                    background: 'var(--bg-card)', opacity: count > 0 ? 1 : 0.5,
                                }}
                            >
                                <span style={{ fontSize: 28 }}>{l.icon}</span>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 600 }}>{l.name}</div>
                                    <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)' }}>
                                        {count > 0 ? `${count}문제` : '준비 중...'}
                                        {stats.answered > 0 && ` · 정답률 ${rate}%`}
                                    </div>
                                </div>
                                {stats.answered > 0 && (
                                    <div style={{ width: 36, height: 36, position: 'relative' }}>
                                        <svg viewBox="0 0 36 36" style={{ width: 36, height: 36, transform: 'rotate(-90deg)' }}>
                                            <circle cx="18" cy="18" r="15" fill="none" stroke="var(--gray-200)" strokeWidth="3" />
                                            <circle cx="18" cy="18" r="15" fill="none" stroke={rate >= 60 ? 'var(--success)' : 'var(--warning)'} strokeWidth="3"
                                                strokeDasharray={`${rate * 0.942} 100`} strokeLinecap="round" />
                                        </svg>
                                        <span style={{
                                            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: 9, fontWeight: 700, color: rate >= 60 ? 'var(--success)' : 'var(--warning)',
                                        }}>
                                            {rate}%
                                        </span>
                                    </div>
                                )}
                                {count > 0 && stats.answered === 0 && (
                                    <span className="iconify" data-icon="mdi:chevron-right" style={{ fontSize: 20, color: 'var(--text-muted)' }}></span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
        );
    }

    if (licenceQuestions.length === 0) {
        return (
            <div className="empty-state">
                <div className="empty-state__icon">🚧</div>
                <p className="empty-state__text">이 지격증의 문제를 준비 중이에요!</p>
                <button className="btn btn--primary" onClick={() => onSelectLicence(null)}>다른 자격증 선택</button>
            </div>
        );
    }

    const currentQ = licenceQuestions[currentIndex];
    const totalQ = licenceQuestions.length;
    const progressPct = ((currentIndex + 1) / totalQ) * 100;

    const handleAnswer = (idx) => { if (!showResult) setSelectedAnswer(idx); };

    const handleSubmit = () => {
        if (selectedAnswer === null) return;
        const isCorrect = selectedAnswer === currentQ.correctAnswer;
        setShowResult(true);
        if (isCorrect) {
            setScore(prev => ({ ...prev, correct: prev.correct + 1 }));
            setShowConfetti(true);
            setTimeout(() => setShowConfetti(false), 1500);
        }
        setScore(prev => ({ ...prev, total: prev.total + 1 }));
        // SM-2 기록
        recordAnswer(currentQ.id, currentQ.licenceId, currentQ.subject, isCorrect);
    };

    const handleNext = () => {
        if (currentIndex < totalQ - 1) {
            setCurrentIndex(currentIndex + 1);
            setSelectedAnswer(null);
            setShowResult(false);
        }
    };

    const handleRestart = () => {
        setCurrentIndex(0);
        setSelectedAnswer(null);
        setShowResult(false);
        setScore({ correct: 0, total: 0 });
    };

    const modeLabels = {
        step1: { label: 'STEP 1', color: 'var(--step1-color)', bg: 'var(--step1-bg)' },
        step2: { label: 'STEP 2', color: 'var(--step2-color)', bg: 'var(--step2-bg)' },
        step3: { label: 'STEP 3', color: 'var(--step3-color)', bg: 'var(--step3-bg)' },
    };
    const currentMode = modeLabels[studyMode];

    // 무료 사용자 문제 제한 (과목당 5문제)
    const freeLimit = 5;
    const isLocked = !isPremium && currentIndex >= freeLimit;

    return (
        <div className="animate-fadeIn">
            {/* Confetti effect */}
            {showConfetti && (
                <div style={{
                    position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 999,
                    display: 'flex', justifyContent: 'center',
                }}>
                    <div style={{ fontSize: 48, animation: 'slideDown 1.5s var(--ease-out) forwards' }}>🎉</div>
                </div>
            )}

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
                <button className="btn btn--ghost btn--sm" onClick={() => onSelectLicence(null)} style={{ gap: 'var(--space-1)' }}>
                    <span className="iconify" data-icon="mdi:arrow-left" style={{ fontSize: 18 }}></span> 목록
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <span style={{ fontSize: 18 }}>{licence?.icon}</span>
                    <span style={{ fontWeight: 600, fontSize: 'var(--font-sm)' }}>{licence?.name}</span>
                </div>
            </div>

            {/* Progress */}
            <div style={{ marginBottom: 'var(--space-2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-1)', fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
                    <span>{currentIndex + 1} / {totalQ}</span>
                    <span>정답률 {score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0}%</span>
                </div>
                <div className="progress progress--sm">
                    <div className="progress__fill" style={{ width: `${progressPct}%` }} />
                </div>
            </div>

            {/* Mode Toggle */}
            <div style={{
                display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-4)',
                background: 'var(--gray-100)', borderRadius: 'var(--radius-md)', padding: 3,
            }}>
                {Object.entries(modeLabels).map(([key, mode]) => (
                    <button key={key} onClick={() => onStudyModeChange(key)} style={{
                        flex: 1, padding: 'var(--space-2)', border: 'none', borderRadius: 'var(--radius-sm)',
                        background: studyMode === key ? 'var(--bg-card)' : 'transparent',
                        boxShadow: studyMode === key ? 'var(--shadow-sm)' : 'none',
                        color: studyMode === key ? mode.color : 'var(--text-muted)',
                        fontWeight: studyMode === key ? 600 : 400, fontSize: 11,
                        cursor: 'pointer', fontFamily: 'inherit', transition: 'all var(--transition-fast)',
                    }}>
                        {key === 'step1' ? '🌱 번역' : key === 'step2' ? '🌿 힌트' : '🌳 실전'}
                    </button>
                ))}
            </div>

            {/* Question Card */}
            {isLocked ? (
                <PremiumLock isPremium={false} feature="프리미엄으로 모든 문제를 풀수 있어요">
                    <div className="card" style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
                        <p>프리미엄 잠금 콘텐츠</p>
                    </div>
                </PremiumLock>
            ) : (
                <>
                    <div className="card" style={{ marginBottom: 'var(--space-4)' }}>
                        <div style={{ padding: 'var(--space-4)', borderBottom: '1px solid var(--gray-100)' }}>
                            <span className="badge" style={{ background: currentMode.bg, color: currentMode.color, marginBottom: 'var(--space-2)' }}>
                                {currentMode.label}
                            </span>
                            <h3 style={{ fontSize: 'var(--font-base)', fontWeight: 600, lineHeight: 1.6, marginBottom: 'var(--space-2)' }}>
                                Q{currentIndex + 1}. {currentQ.question}
                            </h3>
                            {studyMode !== 'step3' && (
                                <p style={{
                                    fontSize: 'var(--font-sm)', color: 'var(--primary)',
                                    background: 'var(--primary-50)', padding: 'var(--space-2) var(--space-3)',
                                    borderRadius: 'var(--radius-sm)', lineHeight: 1.5,
                                }}>
                                    💡 {currentQ.simpleQuestion}
                                </p>
                            )}
                        </div>

                        <div style={{ padding: 'var(--space-4)' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                                {currentQ.options.map((option, idx) => {
                                    const isSelected = selectedAnswer === idx;
                                    const isCorrect = idx === currentQ.correctAnswer;
                                    let borderColor = 'var(--gray-200)', bgColor = 'transparent';
                                    if (showResult && isCorrect) { borderColor = 'var(--success)'; bgColor = 'var(--success-bg)'; }
                                    else if (showResult && isSelected && !isCorrect) { borderColor = 'var(--error)'; bgColor = 'var(--error-bg)'; }
                                    else if (isSelected) { borderColor = 'var(--primary)'; bgColor = 'var(--primary-50)'; }
                                    return (
                                        <button key={idx} onClick={() => handleAnswer(idx)} style={{
                                            display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
                                            padding: 'var(--space-3) var(--space-4)', borderRadius: 'var(--radius-md)',
                                            border: `2px solid ${borderColor}`, background: bgColor,
                                            cursor: showResult ? 'default' : 'pointer', fontFamily: 'inherit',
                                            fontSize: 'var(--font-sm)', textAlign: 'left', width: '100%',
                                            color: 'var(--text-primary)', transition: 'all var(--transition-fast)',
                                        }}>
                                            <span style={{
                                                width: 28, height: 28, borderRadius: '50%',
                                                background: isSelected ? borderColor : 'var(--gray-100)',
                                                color: isSelected ? 'white' : 'var(--text-secondary)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: 'var(--font-xs)', fontWeight: 600, flexShrink: 0,
                                            }}>
                                                {showResult && isCorrect ? '✓' : (idx + 1)}
                                            </span>
                                            <span style={{ flex: 1 }}>{option}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {showResult && (
                            <div style={{
                                padding: 'var(--space-4)', borderTop: '1px solid var(--gray-100)',
                                animation: 'slideUp 300ms var(--ease-out)',
                            }}>
                                <div style={{
                                    background: selectedAnswer === currentQ.correctAnswer ? 'var(--success-bg)' : 'var(--error-bg)',
                                    borderRadius: 'var(--radius-md)', padding: 'var(--space-4)',
                                }}>
                                    <div style={{
                                        fontWeight: 700, marginBottom: 'var(--space-2)',
                                        color: selectedAnswer === currentQ.correctAnswer ? 'var(--success)' : 'var(--error)',
                                    }}>
                                        {selectedAnswer === currentQ.correctAnswer ? '🎉 정답이에요!' : '😢 틀렸어요'}
                                    </div>
                                    <p style={{ fontSize: 'var(--font-sm)', lineHeight: 1.6, color: 'var(--text-primary)' }}>
                                        {studyMode === 'step1' ? currentQ.simpleExplanation : currentQ.explanation}
                                    </p>
                                    {currentQ.keywords && (
                                        <div style={{ display: 'flex', gap: 'var(--space-1)', marginTop: 'var(--space-3)', flexWrap: 'wrap' }}>
                                            {currentQ.keywords.map(kw => (
                                                <span key={kw} className="badge badge--primary" style={{ fontSize: 11 }}>#{kw}</span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                        {!showResult ? (
                            <button className="btn btn--primary btn--full btn--lg" onClick={handleSubmit} disabled={selectedAnswer === null}>
                                정답 확인 ✓
                            </button>
                        ) : currentIndex < totalQ - 1 ? (
                            <button className="btn btn--primary btn--full btn--lg" onClick={handleNext}>다음 문제 →</button>
                        ) : (
                            <div style={{ width: '100%' }}>
                                <div className="card" style={{
                                    padding: 'var(--space-6)', textAlign: 'center', marginBottom: 'var(--space-3)',
                                    background: 'linear-gradient(135deg, #F0F2FF 0%, #FFF0F6 100%)',
                                }}>
                                    <div style={{ fontSize: 48, marginBottom: 'var(--space-3)' }}>
                                        {score.correct / score.total >= 0.6 ? '🎉' : '💪'}
                                    </div>
                                    <h3 style={{ fontSize: 'var(--font-2xl)', fontWeight: 800, marginBottom: 'var(--space-2)' }}>
                                        {Math.round((score.correct / score.total) * 100)}점
                                    </h3>
                                    <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-2)', fontSize: 'var(--font-sm)' }}>
                                        {totalQ}문제 중 {score.correct}문제 정답
                                    </p>
                                    <p style={{ fontWeight: 600, color: score.correct / score.total >= 0.6 ? 'var(--success)' : 'var(--warning)' }}>
                                        {score.correct / score.total >= 0.6 ? '합격 기준 통과! 🏆' : '조금 더 노력해봐요!'}
                                    </p>
                                </div>
                                <button className="btn btn--primary btn--full btn--lg" onClick={handleRestart}>
                                    <span className="iconify" data-icon="mdi:refresh" style={{ fontSize: 18 }}></span> 다시 풀기
                                </button>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
