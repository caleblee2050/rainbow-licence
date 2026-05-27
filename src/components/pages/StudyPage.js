'use client';

import { useState, useMemo, useEffect } from 'react';
import { api } from '@/lib/api-client';
import { licences } from '@/data/licences';
import { getQuestionsByLicence } from '@/data/questions';
import { recordAnswer, getAccuracyRate, getLicenceStats } from '@/lib/studyEngine';
import { isPremiumGateUnlocked } from '@/lib/demoMode';
import { PremiumLock } from '@/components/ui/PremiumBanner';
import {
    getTranslatedQuestion,
    getTranslatedOptions,
    getTranslatedExplanation,
    getKeywordHints,
    getLangBadge,
} from '@/lib/translations';

function KeywordHint({ korean, native }) {
    const [open, setOpen] = useState(false);
    return (
        <span style={{ position: 'relative', display: 'inline-block' }}>
            <span
                onClick={() => setOpen(o => !o)}
                style={{
                    borderBottom: '2px dotted var(--accent)',
                    color: 'var(--primary)',
                    cursor: 'pointer',
                    fontWeight: 500,
                }}
            >
                {korean}
            </span>
            {open && (
                <span style={{
                    position: 'absolute',
                    top: '100%', left: 0, marginTop: 4,
                    background: 'var(--text-primary)', color: 'white',
                    padding: '6px 10px', borderRadius: 'var(--radius-sm)',
                    fontSize: 13, whiteSpace: 'nowrap', zIndex: 10,
                    boxShadow: 'var(--shadow-md)',
                }}>
                    {native}
                </span>
            )}
        </span>
    );
}

function renderWithHints(text, hints) {
    if (!hints || hints.length === 0) return text;
    const sortedHints = [...hints].sort((a, b) => b.korean.length - a.korean.length);
    const tokens = [{ text, isHint: false }];
    for (const h of sortedHints) {
        for (let i = tokens.length - 1; i >= 0; i--) {
            if (!tokens[i].isHint && tokens[i].text.includes(h.korean)) {
                const parts = tokens[i].text.split(h.korean);
                const newTokens = [];
                for (let j = 0; j < parts.length; j++) {
                    if (parts[j]) newTokens.push({ text: parts[j], isHint: false });
                    if (j < parts.length - 1) newTokens.push({ text: h.korean, native: h.native, isHint: true });
                }
                tokens.splice(i, 1, ...newTokens);
            }
        }
    }
    return tokens.map((t, i) =>
        t.isHint ? <KeywordHint key={i} korean={t.text} native={t.native} /> : <span key={i}>{t.text}</span>
    );
}

export default function StudyPage({ language, licenceId, studyMode, onStudyModeChange, onSelectLicence, isPremium, activeView, onChangeView, onStartMockExam }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [showResult, setShowResult] = useState(false);
    const [score, setScore] = useState({ correct: 0, total: 0 });
    const [showConfetti, setShowConfetti] = useState(false);
    const [translationOpen, setTranslationOpen] = useState(false);

    const [problemSet, setProblemSet] = useState('official');
    const [userProblemBundles, setUserProblemBundles] = useState([]);

    useEffect(() => {
        if (!licenceId) return;
        api.userProblems(licenceId).then(({ problems }) => {
            const bySource = new Map();
            for (const p of problems) {
                if (!bySource.has(p.source_id)) bySource.set(p.source_id, []);
                bySource.get(p.source_id).push(p);
            }
            setUserProblemBundles(Array.from(bySource.entries()).map(([sid, list]) => ({ sourceId: sid, count: list.length, problems: list })));
        }).catch(e => { console.warn('[StudyPage] 사용자 문제 로드 실패:', e.message); });
    }, [licenceId]);

    const licence = licences.find(l => l.id === licenceId);
    const licenceQuestions = useMemo(() => {
        if (problemSet === 'official') return getQuestionsByLicence(licenceId || 'korean-food');
        const bundle = userProblemBundles.find(b => b.sourceId === problemSet);
        if (!bundle) return [];
        return bundle.problems.map(p => ({
            id: p.id,
            licenceId,
            subject: 'user',
            question: p.ko_question,
            simpleQuestion: p.ko_simple_explanation ?? p.ko_question,
            options: p.ko_options,
            correctAnswer: p.correct_answer,
            explanation: p.ko_explanation,
            simpleExplanation: p.ko_simple_explanation ?? p.ko_explanation,
            keywords: [],
            translations: p.translations ?? {},
            keywordHints: p.keyword_hints ?? {},
        }));
    }, [licenceId, problemSet, userProblemBundles]);

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

    // 무료 사용자 문제 제한 (과목당 5문제). DEMO 모드는 해제.
    const freeLimit = 5;
    const isLocked = !isPremium && !isPremiumGateUnlocked() && currentIndex >= freeLimit;

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
                <button
                    onClick={() => onSelectLicence(null)}
                    style={{
                        display: 'inline-flex', alignItems: 'center', gap: 'var(--space-1)',
                        padding: 'var(--space-2) var(--space-3)',
                        background: 'transparent', border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)',
                        fontSize: 'var(--font-xs)', fontWeight: 500,
                        cursor: 'pointer', fontFamily: 'inherit',
                        transition: 'background var(--transition-fast), border-color var(--transition-fast)',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--gray-100)'; e.currentTarget.style.borderColor = 'var(--border-strong)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'var(--border)'; }}
                >
                    <span className="iconify" data-icon="mdi:arrow-left" style={{ fontSize: 16 }}></span>
                    📚 목록
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <span style={{ fontSize: 18 }}>{licence?.icon}</span>
                    <span style={{ fontWeight: 600, fontSize: 'var(--font-sm)' }}>{licence?.name}</span>
                </div>
            </div>

            {/* 탭 chip: 학습 / 내 자료 / 모의고사 */}
            {onChangeView && (
                <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-3)', overflowX: 'auto' }}>
                    <button className={`chip ${activeView === 'study' ? 'active' : ''}`} onClick={() => onChangeView('study')}>학습</button>
                    <button className={`chip ${activeView === 'notebook' ? 'active' : ''}`} onClick={() => onChangeView('notebook')}>내 자료</button>
                    {onStartMockExam && (
                        <button
                            className="chip"
                            onClick={onStartMockExam}
                            style={{ background: 'var(--accent)', color: '#fff', borderColor: 'var(--accent)' }}
                        >🎯 모의고사</button>
                    )}
                </div>
            )}

            {/* 학습 묶음 chips */}
            {userProblemBundles.length > 0 && (
                <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-3)', overflowX: 'auto' }}>
                    <button className={`chip ${problemSet === 'official' ? 'active' : ''}`} onClick={() => { setProblemSet('official'); setCurrentIndex(0); setSelectedAnswer(null); setShowResult(false); }}>
                        공식 {getQuestionsByLicence(licenceId).length}문제
                    </button>
                    {userProblemBundles.map((b, i) => (
                        <button key={b.sourceId} className={`chip ${problemSet === b.sourceId ? 'active' : ''}`} onClick={() => { setProblemSet(b.sourceId); setCurrentIndex(0); setSelectedAnswer(null); setShowResult(false); }}>
                            내 자료 {i + 1} ({b.count}문제)
                        </button>
                    ))}
                </div>
            )}

            {/* Progress — Step 1: fill with primary or gradient */}
            <div style={{ marginBottom: 'var(--space-2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-1)', fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
                    <span>{currentIndex + 1} / {totalQ}</span>
                    <span>정답률 {score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0}%</span>
                </div>
                <div style={{
                    width: '100%', height: 4,
                    background: 'var(--gray-200)',
                    borderRadius: 'var(--radius-full)',
                    overflow: 'hidden',
                }}>
                    <div style={{
                        height: '100%',
                        width: `${progressPct}%`,
                        background: 'linear-gradient(90deg, var(--primary), var(--accent))',
                        borderRadius: 'var(--radius-full)',
                        transition: 'width var(--transition-slow)',
                    }} />
                </div>
            </div>

            {/* Mode Toggle — Step 2: V3 tab style */}
            <div style={{
                display: 'flex', gap: 4, marginBottom: 'var(--space-4)',
                background: 'var(--gray-100)', borderRadius: 'var(--radius-md)', padding: 3,
            }}>
                {Object.entries(modeLabels).map(([key]) => {
                    const isActive = studyMode === key;
                    return (
                        <button key={key} onClick={() => onStudyModeChange(key)} style={{
                            flex: 1, padding: 'var(--space-2)', border: 'none',
                            borderBottom: isActive ? '2px solid var(--primary)' : '2px solid transparent',
                            borderRadius: 'var(--radius-sm)',
                            background: isActive ? 'var(--primary-soft)' : 'transparent',
                            color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                            fontWeight: isActive ? 600 : 400, fontSize: 11,
                            cursor: 'pointer', fontFamily: 'inherit',
                            transition: 'all var(--transition-fast)',
                        }}>
                            {key === 'step1' ? '🌱 번역' : key === 'step2' ? '🌿 힌트' : '🌳 실전'}
                        </button>
                    );
                })}
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
                        {/* Step 3: question heading with Fraunces */}
                        <div style={{ padding: 'var(--space-4)', borderBottom: '1px solid var(--gray-100)' }}>
                            <span style={{
                                display: 'inline-block',
                                background: 'var(--primary-soft)',
                                color: 'var(--primary)',
                                borderRadius: 'var(--radius-full)',
                                padding: '3px 10px',
                                fontSize: 11,
                                fontWeight: 600,
                                marginBottom: 'var(--space-2)',
                                letterSpacing: '0.3px',
                            }}>
                                {currentMode.label}
                            </span>
                            <h3 style={{
                                fontFamily: 'var(--font-display)',
                                fontSize: 'clamp(20px, 4vw, 26px)',
                                fontWeight: 600,
                                lineHeight: 1.4,
                                color: 'var(--text-primary)',
                                marginBottom: 'var(--space-2)',
                            }}>
                                Q{currentIndex + 1}. {studyMode === 'step2'
                                    ? renderWithHints(currentQ.question, getKeywordHints(currentQ, language))
                                    : currentQ.question}
                            </h3>
                            {studyMode === 'step1' && getTranslatedQuestion(currentQ, language) && (
                                <p style={{
                                    fontSize: 'var(--font-sm)', color: 'var(--text-secondary)',
                                    background: 'var(--primary-soft)', borderLeft: '3px solid var(--primary)',
                                    padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-sm)',
                                    lineHeight: 1.6, marginBottom: 'var(--space-2)',
                                }}>
                                    <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4, display: 'block' }}>
                                        {getLangBadge(language)}
                                    </span>
                                    {getTranslatedQuestion(currentQ, language)}
                                </p>
                            )}
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

                        {/* Step 4: Option cards — 4 states */}
                        <div style={{ padding: 'var(--space-4)' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                                {currentQ.options.map((option, idx) => {
                                    const isSelected = selectedAnswer === idx;
                                    const isCorrect = idx === currentQ.correctAnswer;

                                    let borderStyle = '1px solid var(--border)';
                                    let bgColor = 'var(--bg-card)';
                                    let numberBg = 'var(--primary-soft)';
                                    let numberColor = 'var(--primary)';
                                    let numberContent = String(idx + 1);

                                    if (showResult && isCorrect) {
                                        borderStyle = '2px solid var(--success)';
                                        bgColor = 'var(--success-bg)';
                                        numberBg = 'var(--success)';
                                        numberColor = '#fff';
                                        numberContent = '✓';
                                    } else if (showResult && isSelected && !isCorrect) {
                                        borderStyle = '2px solid var(--error)';
                                        bgColor = 'var(--error-bg)';
                                        numberBg = 'var(--error)';
                                        numberColor = '#fff';
                                    } else if (isSelected) {
                                        borderStyle = '2px solid var(--primary)';
                                        bgColor = 'var(--primary-soft)';
                                        numberBg = 'var(--primary)';
                                        numberColor = '#fff';
                                    }

                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => handleAnswer(idx)}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
                                                padding: '16px 20px',
                                                borderRadius: 'var(--radius-md)',
                                                border: borderStyle,
                                                background: bgColor,
                                                cursor: showResult ? 'default' : 'pointer',
                                                fontFamily: 'inherit',
                                                fontSize: 'var(--font-sm)', textAlign: 'left', width: '100%',
                                                color: 'var(--text-primary)',
                                                transition: 'all var(--transition-fast)',
                                            }}
                                            onMouseEnter={e => {
                                                if (!showResult) {
                                                    e.currentTarget.style.borderColor = 'var(--primary-light)';
                                                    e.currentTarget.style.transform = 'translateY(-1px)';
                                                    e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                                                }
                                            }}
                                            onMouseLeave={e => {
                                                if (!showResult) {
                                                    e.currentTarget.style.borderColor = isSelected ? 'var(--primary)' : 'var(--border)';
                                                    e.currentTarget.style.transform = 'none';
                                                    e.currentTarget.style.boxShadow = 'none';
                                                }
                                            }}
                                        >
                                            <span style={{
                                                width: 28, height: 28, borderRadius: '50%',
                                                background: numberBg,
                                                color: numberColor,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: 'var(--font-xs)', fontWeight: 600, flexShrink: 0,
                                            }}>
                                                {numberContent}
                                            </span>
                                            <span style={{ flex: 1 }}>
                                                {studyMode === 'step2'
                                                    ? renderWithHints(option, getKeywordHints(currentQ, language))
                                                    : option}
                                                {studyMode === 'step1' && getTranslatedOptions(currentQ, language)?.[idx] && (
                                                    <span style={{ display: 'block', fontSize: 'var(--font-xs)', color: 'var(--text-muted)', marginTop: 2 }}>
                                                        {getTranslatedOptions(currentQ, language)[idx]}
                                                    </span>
                                                )}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Step 6: Answer explanation box */}
                        {showResult && (
                            <div style={{
                                padding: 'var(--space-4)', borderTop: '1px solid var(--gray-100)',
                                animation: 'slideUp 300ms var(--ease-out)',
                            }}>
                                <div style={{
                                    background: selectedAnswer === currentQ.correctAnswer ? 'var(--success-bg)' : 'var(--error-bg)',
                                    border: `1px solid ${selectedAnswer === currentQ.correctAnswer ? 'var(--success)' : 'var(--error)'}`,
                                    borderRadius: 'var(--radius-md)',
                                    padding: 'var(--space-md)',
                                }}>
                                    <h3 style={{
                                        margin: 0, fontSize: 14,
                                        fontWeight: 700,
                                        color: selectedAnswer === currentQ.correctAnswer ? 'var(--success)' : 'var(--error)',
                                        marginBottom: 'var(--space-2)',
                                    }}>
                                        {selectedAnswer === currentQ.correctAnswer ? '🎉 정답이에요!' : '😢 틀렸어요'}
                                    </h3>
                                    <p style={{ margin: '8px 0 0', fontSize: 14, lineHeight: 1.6, color: 'var(--text-primary)' }}>
                                        {studyMode === 'step1' ? currentQ.simpleExplanation : currentQ.explanation}
                                    </p>
                                    {studyMode === 'step1' && getTranslatedExplanation(currentQ, language) && (
                                        <p style={{
                                            margin: '8px 0 0', fontSize: 13, lineHeight: 1.6, color: 'var(--text-secondary)',
                                            padding: 'var(--space-2) var(--space-3)', background: 'var(--primary-soft)',
                                            borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--primary)',
                                        }}>
                                            <span style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4, display: 'block' }}>
                                                {getLangBadge(language)}
                                            </span>
                                            {getTranslatedExplanation(currentQ, language)}
                                        </p>
                                    )}
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

                    {/* Action Buttons — Steps 5 & 7 */}
                    <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'center' }}>
                        {!showResult ? (
                            <button
                                onClick={handleSubmit}
                                disabled={selectedAnswer === null}
                                style={{
                                    background: 'var(--primary)',
                                    color: '#fff',
                                    padding: '14px 24px',
                                    border: 'none',
                                    borderRadius: 'var(--radius-md)',
                                    fontFamily: 'var(--font-body)',
                                    fontSize: 16,
                                    fontWeight: 600,
                                    width: '100%',
                                    maxWidth: 320,
                                    cursor: selectedAnswer === null ? 'not-allowed' : 'pointer',
                                    opacity: selectedAnswer === null ? 0.5 : 1,
                                    transition: 'transform var(--dur-micro) var(--easing-move), background var(--dur-micro) var(--easing-move)',
                                }}
                                onMouseEnter={e => { if (selectedAnswer !== null) e.currentTarget.style.background = 'var(--primary-light)'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'var(--primary)'; }}
                                onMouseDown={e => { if (selectedAnswer !== null) e.currentTarget.style.transform = 'translateY(1px)'; }}
                                onMouseUp={e => { e.currentTarget.style.transform = 'none'; }}
                            >
                                정답 확인 →
                            </button>
                        ) : currentIndex < totalQ - 1 ? (
                            <button
                                onClick={handleNext}
                                style={{
                                    background: 'transparent',
                                    color: 'var(--primary)',
                                    padding: '14px 24px',
                                    border: '2px solid var(--primary)',
                                    borderRadius: 'var(--radius-md)',
                                    fontFamily: 'var(--font-body)',
                                    fontSize: 16,
                                    fontWeight: 600,
                                    width: '100%',
                                    maxWidth: 320,
                                    cursor: 'pointer',
                                    transition: 'transform var(--dur-micro) var(--easing-move), background var(--dur-micro) var(--easing-move)',
                                }}
                                onMouseEnter={e => { e.currentTarget.style.background = 'var(--primary-soft)'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                                onMouseDown={e => { e.currentTarget.style.transform = 'translateY(1px)'; }}
                                onMouseUp={e => { e.currentTarget.style.transform = 'none'; }}
                            >
                                다음 문제 →
                            </button>
                        ) : (
                            <div style={{ width: '100%' }}>
                                <div className="card" style={{
                                    padding: 'var(--space-6)', textAlign: 'center', marginBottom: 'var(--space-3)',
                                    background: 'var(--primary-soft)',
                                    border: '1px solid var(--border)',
                                }}>
                                    <div style={{ fontSize: 48, marginBottom: 'var(--space-3)' }}>
                                        {score.correct / score.total >= 0.6 ? '🎉' : '💪'}
                                    </div>
                                    <h3 style={{
                                        fontFamily: 'var(--font-display)',
                                        fontSize: 'var(--font-2xl)', fontWeight: 700,
                                        marginBottom: 'var(--space-2)',
                                        color: 'var(--text-primary)',
                                    }}>
                                        {Math.round((score.correct / score.total) * 100)}점
                                    </h3>
                                    <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-2)', fontSize: 'var(--font-sm)' }}>
                                        {totalQ}문제 중 {score.correct}문제 정답
                                    </p>
                                    <p style={{ fontWeight: 600, color: score.correct / score.total >= 0.6 ? 'var(--success)' : 'var(--warning)' }}>
                                        {score.correct / score.total >= 0.6 ? '합격 기준 통과! 🏆' : '조금 더 노력해봐요!'}
                                    </p>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'center' }}>
                                    <button
                                        onClick={handleRestart}
                                        style={{
                                            background: 'var(--primary)',
                                            color: '#fff',
                                            padding: '14px 24px',
                                            border: 'none',
                                            borderRadius: 'var(--radius-md)',
                                            fontFamily: 'var(--font-body)',
                                            fontSize: 16,
                                            fontWeight: 600,
                                            width: '100%',
                                            maxWidth: 320,
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: 'var(--space-2)',
                                            transition: 'transform var(--dur-micro) var(--easing-move), background var(--dur-micro) var(--easing-move)',
                                        }}
                                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--primary-light)'; }}
                                        onMouseLeave={e => { e.currentTarget.style.background = 'var(--primary)'; }}
                                        onMouseDown={e => { e.currentTarget.style.transform = 'translateY(1px)'; }}
                                        onMouseUp={e => { e.currentTarget.style.transform = 'none'; }}
                                    >
                                        <span className="iconify" data-icon="mdi:refresh" style={{ fontSize: 18 }}></span> 다시 풀기
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {studyMode === 'step3' && (
                        <>
                            <button
                                onClick={() => setTranslationOpen(o => !o)}
                                style={{
                                    position: 'fixed', bottom: 96, right: 16,
                                    width: 56, height: 56, borderRadius: '50%',
                                    background: 'var(--accent)', color: 'white',
                                    border: 'none', fontSize: 20,
                                    boxShadow: 'var(--shadow-md)',
                                    cursor: 'pointer', zIndex: 20,
                                }}
                                aria-label="번역 보기"
                            >
                                ❓
                            </button>
                            {translationOpen && (
                                <div style={{
                                    position: 'fixed', bottom: 0, left: 0, right: 0,
                                    background: 'var(--bg-card)', borderTop: '1px solid var(--border)',
                                    padding: 'var(--space-4)', boxShadow: '0 -4px 12px rgba(0,0,0,0.08)',
                                    zIndex: 15, maxHeight: '50vh', overflowY: 'auto',
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                                        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{getLangBadge(language)}</span>
                                        <button onClick={() => setTranslationOpen(false)} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer' }}>✕</button>
                                    </div>
                                    <p style={{ fontSize: 15, color: 'var(--text-primary)', lineHeight: 1.6, margin: '0 0 12px' }}>
                                        {getTranslatedQuestion(currentQ, language) || '번역 준비 중'}
                                    </p>
                                    {getTranslatedOptions(currentQ, language)?.map((opt, i) => (
                                        <p key={i} style={{ fontSize: 14, color: 'var(--text-secondary)', margin: '4px 0' }}>{i + 1}. {opt}</p>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </>
            )}
        </div>
    );
}
