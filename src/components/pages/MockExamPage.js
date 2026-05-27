'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { getQuestionsByLicence } from '@/data/questions';
import { licences } from '@/data/licences';
import { recordAnswer } from '@/lib/studyEngine';

const EXAM_MINUTES = 60;
const EXAM_QUESTIONS = 60;
const PASS_SCORE = 60;

function shuffle(arr) {
    const out = [...arr];
    for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
}

function formatTime(seconds) {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
}

export default function MockExamPage({ licenceId, onExit }) {
    const questions = useMemo(() => {
        const pool = getQuestionsByLicence(licenceId);
        return shuffle(pool).slice(0, Math.min(EXAM_QUESTIONS, pool.length));
    }, [licenceId]);
    const licence = licences.find(l => l.id === licenceId);
    const [answers, setAnswers] = useState({});
    const [index, setIndex] = useState(0);
    const [remaining, setRemaining] = useState(EXAM_MINUTES * 60);
    const [submitted, setSubmitted] = useState(false);
    const [showWarning, setShowWarning] = useState(false);
    const timerRef = useRef(null);

    const submit = useCallback(() => {
        setSubmitted(true);
        clearInterval(timerRef.current);
        questions.forEach((q, i) => {
            const isCorrect = answers[i] === q.correctAnswer;
            recordAnswer(q.id, q.licenceId, q.subject, isCorrect);
        });
    }, [questions, answers]);

    useEffect(() => {
        if (submitted) return;
        timerRef.current = setInterval(() => {
            setRemaining(r => {
                if (r <= 1) {
                    clearInterval(timerRef.current);
                    submit();
                    return 0;
                }
                return r - 1;
            });
        }, 1000);
        return () => clearInterval(timerRef.current);
    }, [submitted, submit]);

    if (questions.length === 0) {
        return (
            <div className="empty-state">
                <div className="empty-state__icon">📝</div>
                <p className="empty-state__text">문제를 준비 중입니다.</p>
                <button className="btn btn--primary" onClick={onExit}>돌아가기</button>
            </div>
        );
    }

    const total = questions.length;
    const current = questions[index];
    const answered = Object.keys(answers).length;
    const handleAnswer = (i) => setAnswers(prev => ({ ...prev, [index]: i }));

    const handleSubmitClick = () => {
        if (answered < total) {
            setShowWarning(true);
            return;
        }
        submit();
    };

    const handleExit = () => {
        if (confirm('모의고사를 종료할까요? 진행 상황이 사라집니다.')) onExit();
    };

    if (submitted) {
        const correct = questions.filter((q, i) => answers[i] === q.correctAnswer).length;
        const score = total > 0 ? Math.round(correct / total * 100) : 0;
        const passed = score >= PASS_SCORE;
        const wrong = questions
            .map((q, i) => ({ q, i, picked: answers[i] }))
            .filter(({ q, i }) => answers[i] !== q.correctAnswer);

        const bySubject = {};
        for (let i = 0; i < total; i++) {
            const sub = questions[i].subject || '기타';
            if (!bySubject[sub]) bySubject[sub] = { right: 0, total: 0 };
            bySubject[sub].total += 1;
            if (answers[i] === questions[i].correctAnswer) bySubject[sub].right += 1;
        }

        return (
            <div className="animate-fadeIn">
                <div className="card" style={{
                    padding: 'var(--space-6)', textAlign: 'center', marginBottom: 'var(--space-4)',
                    background: passed ? 'var(--success-bg)' : 'var(--warning-bg)',
                    border: `1px solid ${passed ? 'var(--success)' : 'var(--warning)'}`,
                }}>
                    <div style={{ fontSize: 56, marginBottom: 'var(--space-2)' }}>{passed ? '🎉' : '💪'}</div>
                    <h3 style={{
                        fontFamily: 'var(--font-display)', fontSize: 'var(--font-2xl)',
                        fontWeight: 800, marginBottom: 'var(--space-1)', color: 'var(--text-primary)',
                    }}>{score}점</h3>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-3)', fontSize: 'var(--font-sm)' }}>
                        {total}문제 중 <strong>{correct}문제</strong> 정답
                    </p>
                    <p style={{
                        fontWeight: 700, color: passed ? 'var(--success)' : 'var(--warning)',
                        fontSize: 'var(--font-base)',
                    }}>{passed ? '합격 기준 통과! 🏆' : `${PASS_SCORE}점 이상이면 합격이에요. 다시 도전!`}</p>
                </div>

                {Object.keys(bySubject).length > 0 && (
                    <div className="card" style={{ padding: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
                        <h4 style={{ fontSize: 'var(--font-sm)', fontWeight: 600, marginBottom: 'var(--space-3)' }}>📊 과목별 정답률</h4>
                        {Object.entries(bySubject).map(([sub, { right, total: t }]) => {
                            const rate = t > 0 ? Math.round(right / t * 100) : 0;
                            return (
                                <div key={sub} style={{ marginBottom: 'var(--space-2)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-xs)', marginBottom: 4 }}>
                                        <span>{sub}</span>
                                        <span style={{ color: rate >= PASS_SCORE ? 'var(--success)' : 'var(--warning)' }}>
                                            {right}/{t} ({rate}%)
                                        </span>
                                    </div>
                                    <div style={{ height: 4, background: 'var(--gray-200)', borderRadius: 'var(--radius-full)' }}>
                                        <div style={{
                                            height: '100%', width: `${rate}%`,
                                            background: rate >= PASS_SCORE ? 'var(--success)' : 'var(--warning)',
                                            borderRadius: 'var(--radius-full)',
                                        }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {wrong.length > 0 && (
                    <div className="card" style={{ padding: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
                        <h4 style={{ fontSize: 'var(--font-sm)', fontWeight: 600, marginBottom: 'var(--space-3)' }}>
                            ❌ 오답 노트 ({wrong.length}문제)
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                            {wrong.slice(0, 10).map(({ q, i }) => (
                                <div key={i} style={{ borderLeft: '3px solid var(--error)', paddingLeft: 'var(--space-3)' }}>
                                    <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', marginBottom: 2 }}>Q{i + 1}</p>
                                    <p style={{ fontSize: 'var(--font-sm)', marginBottom: 4, color: 'var(--text-primary)' }}>{q.question}</p>
                                    <p style={{ fontSize: 'var(--font-xs)', color: 'var(--success)' }}>
                                        정답: {q.options[q.correctAnswer]}
                                    </p>
                                </div>
                            ))}
                            {wrong.length > 10 && (
                                <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', textAlign: 'center' }}>
                                    ... 외 {wrong.length - 10}개
                                </p>
                            )}
                        </div>
                    </div>
                )}

                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                    <button onClick={() => {
                        setSubmitted(false);
                        setAnswers({});
                        setIndex(0);
                        setRemaining(EXAM_MINUTES * 60);
                    }} style={{
                        flex: 1, padding: '14px 20px', borderRadius: 'var(--radius-md)',
                        border: 'none', background: 'var(--primary)', color: '#fff',
                        fontWeight: 600, fontSize: 'var(--font-base)', cursor: 'pointer', fontFamily: 'inherit',
                    }}>🔄 다시 풀기</button>
                    <button onClick={onExit} style={{
                        flex: 1, padding: '14px 20px', borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--primary)', background: 'transparent', color: 'var(--primary)',
                        fontWeight: 600, fontSize: 'var(--font-base)', cursor: 'pointer', fontFamily: 'inherit',
                    }}>← 학습으로</button>
                </div>
            </div>
        );
    }

    const lowTime = remaining < 300;

    return (
        <div className="animate-fadeIn">
            {/* 상단 */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)', gap: 'var(--space-2)' }}>
                <button onClick={handleExit} style={{
                    background: 'transparent', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                    padding: 'var(--space-2) var(--space-3)', color: 'var(--text-secondary)',
                    cursor: 'pointer', fontFamily: 'inherit', fontSize: 'var(--font-xs)', fontWeight: 500,
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                }}>
                    <span className="iconify" data-icon="mdi:close" style={{ fontSize: 16 }}></span>
                    종료
                </button>
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
                    fontWeight: 600, fontSize: 'var(--font-sm)',
                }}>
                    <span style={{ fontSize: 16 }}>{licence?.icon}</span>
                    <span>모의고사</span>
                </div>
                <div style={{
                    background: lowTime ? 'var(--error)' : 'var(--primary)',
                    color: '#fff', padding: '6px 12px',
                    borderRadius: 'var(--radius-sm)', fontWeight: 700, fontSize: 'var(--font-sm)',
                    fontFamily: 'monospace', minWidth: 70, textAlign: 'center',
                    boxShadow: lowTime ? '0 0 12px rgba(239, 68, 68, 0.5)' : 'none',
                    transition: 'all var(--transition-slow)',
                }}>{formatTime(remaining)}</div>
            </div>

            {/* 진행 */}
            <div style={{ marginBottom: 'var(--space-3)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-1)', fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
                    <span>{index + 1} / {total}</span>
                    <span>답함 {answered} / {total}</span>
                </div>
                <div style={{ width: '100%', height: 4, background: 'var(--gray-200)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                    <div style={{
                        height: '100%', width: `${((index + 1) / total) * 100}%`,
                        background: 'linear-gradient(90deg, var(--primary), var(--accent))',
                        borderRadius: 'var(--radius-full)',
                    }} />
                </div>
            </div>

            {/* 문제 */}
            <div className="card" style={{ padding: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
                <h3 style={{
                    fontFamily: 'var(--font-display)', fontSize: 'clamp(18px, 4vw, 24px)',
                    fontWeight: 600, lineHeight: 1.4, marginBottom: 'var(--space-3)',
                    color: 'var(--text-primary)',
                }}>Q{index + 1}. {current.question}</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                    {current.options.map((opt, i) => {
                        const isSelected = answers[index] === i;
                        return (
                            <button key={i} onClick={() => handleAnswer(i)} style={{
                                display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
                                padding: '14px 16px', borderRadius: 'var(--radius-md)',
                                border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border)',
                                background: isSelected ? 'var(--primary-soft)' : 'var(--bg-card)',
                                cursor: 'pointer', fontFamily: 'inherit', fontSize: 'var(--font-sm)',
                                textAlign: 'left', color: 'var(--text-primary)',
                                transition: 'all var(--transition-fast)',
                            }}>
                                <span style={{
                                    width: 26, height: 26, borderRadius: '50%',
                                    background: isSelected ? 'var(--primary)' : 'var(--primary-soft)',
                                    color: isSelected ? '#fff' : 'var(--primary)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 13, fontWeight: 700, flexShrink: 0,
                                }}>{i + 1}</span>
                                <span style={{ flex: 1 }}>{opt}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* 내비 */}
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <button onClick={() => setIndex(i => Math.max(0, i - 1))} disabled={index === 0} style={{
                    flex: 1, padding: '14px 20px', background: 'transparent',
                    border: '1px solid var(--border)', color: 'var(--text-primary)',
                    borderRadius: 'var(--radius-md)', cursor: index === 0 ? 'default' : 'pointer',
                    fontWeight: 600, fontFamily: 'inherit', fontSize: 'var(--font-base)',
                    opacity: index === 0 ? 0.4 : 1,
                }}>← 이전</button>
                {index < total - 1 ? (
                    <button onClick={() => setIndex(i => i + 1)} style={{
                        flex: 1, padding: '14px 20px', background: 'var(--primary)',
                        color: '#fff', border: 'none', borderRadius: 'var(--radius-md)',
                        cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit', fontSize: 'var(--font-base)',
                    }}>다음 →</button>
                ) : (
                    <button onClick={handleSubmitClick} style={{
                        flex: 1, padding: '14px 20px', background: 'var(--success)',
                        color: '#fff', border: 'none', borderRadius: 'var(--radius-md)',
                        cursor: 'pointer', fontWeight: 700, fontFamily: 'inherit', fontSize: 'var(--font-base)',
                    }}>제출 ✓</button>
                )}
            </div>

            {/* 답안 점프 — 빠른 점프 */}
            <div style={{
                marginTop: 'var(--space-4)', padding: 'var(--space-3)',
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
            }}>
                <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', marginBottom: 'var(--space-2)' }}>
                    빠른 이동 · 답한 문제는 색깔 표시
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 4 }}>
                    {questions.map((_, i) => {
                        const isAnswered = answers[i] !== undefined;
                        const isCurrent = i === index;
                        return (
                            <button key={i} onClick={() => setIndex(i)} style={{
                                aspectRatio: '1', padding: 0, fontSize: 10,
                                border: isCurrent ? '2px solid var(--primary)' : '1px solid var(--border)',
                                background: isCurrent ? 'var(--primary)' : isAnswered ? 'var(--primary-soft)' : 'transparent',
                                color: isCurrent ? '#fff' : isAnswered ? 'var(--primary)' : 'var(--text-muted)',
                                borderRadius: 4, cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit',
                            }}>{i + 1}</button>
                        );
                    })}
                </div>
            </div>

            {showWarning && (
                <div className="overlay" onClick={() => setShowWarning(false)} style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
                }}>
                    <div onClick={e => e.stopPropagation()} style={{
                        background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)',
                        padding: 'var(--space-5)', maxWidth: 360, width: '90%',
                        boxShadow: 'var(--shadow-lg)', textAlign: 'center',
                    }}>
                        <h3 style={{ marginBottom: 'var(--space-2)', fontSize: 'var(--font-base)' }}>
                            ⚠️ {total - answered}문제 미답변
                        </h3>
                        <p style={{ marginBottom: 'var(--space-4)', color: 'var(--text-secondary)', fontSize: 'var(--font-sm)' }}>
                            그래도 제출할까요?
                        </p>
                        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                            <button onClick={() => setShowWarning(false)} style={{
                                flex: 1, padding: 'var(--space-3)', background: 'transparent',
                                border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
                                cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500,
                            }}>계속 풀기</button>
                            <button onClick={() => { setShowWarning(false); submit(); }} style={{
                                flex: 1, padding: 'var(--space-3)', background: 'var(--primary)',
                                color: '#fff', border: 'none', borderRadius: 'var(--radius-md)',
                                cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600,
                            }}>제출</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
