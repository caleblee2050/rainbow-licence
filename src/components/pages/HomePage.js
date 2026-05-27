'use client';

import { useEffect, useState } from 'react';
import { licences } from '@/data/licences';
import { questions } from '@/data/questions';
import { getStreak, getWeeklyStats, getDday, getAccuracyRate, getStats, getDueCards, getLicenceStats } from '@/lib/studyEngine';
import PremiumBanner from '@/components/ui/PremiumBanner';
import { isPremiumGateUnlocked } from '@/lib/demoMode';

const greetings = {
    vi: 'Xin chào! 👋', zh: '你好！👋', th: 'สวัสดี! 👋',
    tl: 'Kumusta! 👋', my: 'မင်္ဂလာပါ! 👋',
};
const subtitles = {
    vi: 'Hôm nay bạn muốn học gì?', zh: '今天想学什么？', th: 'วันนี้อยากเรียนอะไร?',
    tl: 'Ano ang gusto mong pag-aralan?', my: 'ဒီနေ့ ဘာလေ့လာချင်သလဲ?',
};

export default function HomePage({ language, licenceId, onSelectLicence, isPremium, onUpgrade, onGoToTermsLearn, onGoToMockExam }) {
    const [streak, setStreak] = useState({ current: 0, longest: 0 });
    const [weeklyData, setWeeklyData] = useState([]);
    const [dday, setDday] = useState(null);
    const [stats, setStats] = useState({ totalAnswered: 0, totalCorrect: 0 });
    const [dueCount, setDueCount] = useState(0);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        setStreak(getStreak());
        setWeeklyData(getWeeklyStats());
        setDday(getDday());
        setStats(getStats());
        setDueCount(getDueCards().length);
    }, []);

    const topLicences = licences.filter(l => l.popularity >= 4);
    const selectedLicence = licences.find(l => l.id === licenceId);
    const licenceRate = licenceId ? getAccuracyRate(licenceId) : 0;
    const licenceStats = licenceId ? getLicenceStats(licenceId) : { answered: 0, correct: 0 };

    return (
        <div className="animate-fadeIn">
            {/* Hero Section */}
            <div style={{
                background: 'var(--gradient-primary)',
                borderRadius: 'var(--radius-xl)',
                padding: 'var(--space-5)',
                marginBottom: 'var(--space-5)',
                color: 'var(--text-inverse)',
                position: 'relative',
                overflow: 'hidden',
            }}>
                <div style={{
                    position: 'absolute', top: -20, right: -20, width: 120, height: 120,
                    background: 'rgba(255,255,255,0.1)', borderRadius: '50%',
                }} />
                <div style={{
                    position: 'absolute', bottom: -10, right: 40, width: 60, height: 60,
                    background: 'rgba(255,255,255,0.08)', borderRadius: '50%',
                }} />

                <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                    }}>
                        <div>
                            <p style={{ fontSize: 'var(--font-sm)', opacity: 0.9, marginBottom: 'var(--space-1)' }}>
                                {greetings[language] || '안녕하세요! 👋'}
                            </p>
                            <h2 style={{ fontSize: 'var(--font-xl)', fontWeight: 800, lineHeight: 1.3, marginBottom: 'var(--space-1)' }}>
                                오늘도 합격에<br />한 걸음 더! 🎯
                            </h2>
                            <p style={{ fontSize: 'var(--font-xs)', opacity: 0.75 }}>
                                {subtitles[language] || '오늘 무엇을 공부할까요?'}
                            </p>
                        </div>

                        {/* Streak Badge */}
                        {mounted && streak.current > 0 && (
                            <div style={{
                                background: 'rgba(255,255,255,0.2)',
                                backdropFilter: 'blur(4px)',
                                borderRadius: 'var(--radius-lg)',
                                padding: 'var(--space-2) var(--space-3)',
                                textAlign: 'center',
                                minWidth: 64,
                            }}>
                                <div style={{ fontSize: 22 }}>🔥</div>
                                <div style={{ fontSize: 'var(--font-lg)', fontWeight: 800 }}>{streak.current}</div>
                                <div style={{ fontSize: 9, opacity: 0.8 }}>연속일</div>
                            </div>
                        )}
                    </div>

                    {/* D-day */}
                    {mounted && dday !== null && (
                        <div style={{
                            marginTop: 'var(--space-3)',
                            background: 'rgba(255,255,255,0.15)',
                            borderRadius: 'var(--radius-md)',
                            padding: 'var(--space-2) var(--space-3)',
                            fontSize: 'var(--font-sm)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--space-2)',
                        }}>
                            <span>📅</span>
                            <span>시험까지 <strong>D-{dday > 0 ? dday : 'Day!'}</strong></span>
                            {dday > 0 && dday <= 30 && <span style={{ marginLeft: 'auto', fontSize: 'var(--font-xs)', opacity: 0.8 }}>화이팅! 💪</span>}
                        </div>
                    )}
                </div>
            </div>

            {/* Quick Dashboard */}
            {mounted && (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr 1fr',
                    gap: 'var(--space-2)',
                    marginBottom: 'var(--space-5)',
                }}>
                    {[
                        { label: '풀이 수', value: stats.totalAnswered, icon: '📝' },
                        { label: '정답률', value: `${stats.totalAnswered > 0 ? Math.round((stats.totalCorrect / stats.totalAnswered) * 100) : 0}%`, icon: '✅' },
                        { label: '복습', value: dueCount, icon: '🔄' },
                        { label: '스트릭', value: streak.current, icon: '🔥' },
                    ].map((stat, i) => (
                        <div key={i} className="card" style={{ padding: 'var(--space-3)', textAlign: 'center', background: 'var(--bg-card)' }}>
                            <div style={{ fontSize: 16, marginBottom: 2, color: 'var(--accent)' }}>{stat.icon}</div>
                            <div style={{ fontSize: 'var(--font-base)', fontWeight: 700, color: 'var(--text-primary)' }}>{stat.value}</div>
                            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{stat.label}</div>
                        </div>
                    ))}
                </div>
            )}

            {/* Weekly Activity Chart */}
            {mounted && stats.totalAnswered > 0 && (
                <div className="card" style={{ padding: 'var(--space-4)', marginBottom: 'var(--space-5)' }}>
                    <h3 style={{ fontSize: 'var(--font-sm)', fontWeight: 600, marginBottom: 'var(--space-3)' }}>📊 이번 주 학습</h3>
                    <div style={{
                        display: 'flex', alignItems: 'flex-end', gap: 'var(--space-2)',
                        height: 80, justifyContent: 'space-between',
                    }}>
                        {weeklyData.map((d, i) => {
                            const maxVal = Math.max(...weeklyData.map(w => w.answered), 1);
                            const h = d.answered > 0 ? Math.max(8, (d.answered / maxVal) * 60) : 4;
                            const isToday = i === weeklyData.length - 1;
                            return (
                                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                                    <div style={{
                                        width: '100%', maxWidth: 28,
                                        height: h,
                                        borderRadius: 'var(--radius-xs)',
                                        background: d.answered > 0 ? (isToday ? 'var(--primary)' : 'var(--primary-200)') : 'var(--gray-200)',
                                        transition: 'height 0.5s var(--ease-out)',
                                    }} />
                                    <span style={{
                                        fontSize: 10,
                                        fontWeight: isToday ? 600 : 400,
                                        color: isToday ? 'var(--primary)' : 'var(--text-muted)',
                                    }}>
                                        {d.day}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Review CTA */}
            {mounted && dueCount > 0 && (
                <button
                    className="card card--interactive"
                    onClick={() => onSelectLicence(licenceId || 'korean-food')}
                    style={{
                        width: '100%',
                        padding: 'var(--space-4)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-3)',
                        marginBottom: 'var(--space-5)',
                        border: '2px solid var(--warning)',
                        background: 'var(--warning-bg)',
                        fontFamily: 'inherit',
                        cursor: 'pointer',
                        textAlign: 'left',
                    }}
                >
                    <span style={{ fontSize: 28 }}>🔄</span>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 'var(--font-sm)' }}>복습할 카드 {dueCount}장</div>
                        <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)' }}>오늘 복습하면 기억이 더 오래가요!</div>
                    </div>
                    <span className="iconify" data-icon="mdi:chevron-right" style={{ fontSize: 20, color: 'var(--warning)' }}></span>
                </button>
            )}

            {/* Premium Banner (비프리미엄만) */}
            {mounted && !isPremium && (
                <PremiumBanner onUpgrade={onUpgrade} />
            )}

            {/* Popular Licences */}
            <div className="section-header">
                <h3 className="section-title">🔥 인기 자격증</h3>
            </div>

            <div className="responsive-grid" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
                {topLicences.map((licence, index) => (
                    <div
                        key={licence.id}
                        className="card card--interactive"
                        onClick={() => onSelectLicence(licence.id)}
                        style={{
                            padding: 'var(--space-4)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--space-4)',
                            borderLeft: '4px solid var(--accent)',
                        }}
                    >
                        <div style={{
                            width: 48, height: 48, borderRadius: 'var(--radius-md)',
                            background: 'var(--primary-soft)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 24, flexShrink: 0,
                        }}>
                            {licence.icon}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 2 }}>
                                <span style={{ fontWeight: 600 }}>{licence.name}</span>
                                {licence.multiLangExam && (
                                    <span className="badge badge--success" style={{ fontSize: 10 }}>다국어</span>
                                )}
                            </div>
                            <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {licence.description}
                            </p>
                        </div>
                        <span className="iconify" data-icon="mdi:chevron-right" style={{ fontSize: 20, color: 'var(--text-muted)', flexShrink: 0 }}></span>
                    </div>
                ))}
            </div>

            {/* 3-Step Learning */}
            <div className="section-header">
                <h3 className="section-title">📖 단계별 학습법</h3>
            </div>

            <div className="responsive-grid" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {[
                    { step: '0', title: '용어 사전 학습', desc: '시험에 나오는 핵심 단어 먼저 익히기', icon: '📚', accent: true, onClick: onGoToTermsLearn },
                    { step: '1', title: '완전 번역 모드', desc: '문제를 모국어로 완전히 이해하기', icon: '🌱', accent: false, onClick: () => onSelectLicence(licenceId || 'korean-food') },
                    { step: '2', title: '키워드 힌트', desc: '핵심 키워드만 모국어로 보기', icon: '🌿', accent: false, onClick: () => onSelectLicence(licenceId || 'korean-food') },
                    { step: '3', title: '실전 한국어', desc: '실제 시험처럼 한국어로만', icon: '🌳', accent: false, onClick: () => onSelectLicence(licenceId || 'korean-food') },
                    { step: '4', title: '실전 모의고사', desc: '60문제/60분 실전 시뮬레이션', icon: '🎯', accent: true, onClick: onGoToMockExam },
                ].map((mode, i) => {
                    const locked = (mode.step === '4' || mode.step === '0') && !isPremium && !isPremiumGateUnlocked();
                    return (
                        <button
                            key={i}
                            className="card card--interactive"
                            onClick={locked ? undefined : mode.onClick}
                            disabled={locked}
                            style={{
                                padding: 'var(--space-3) var(--space-4)',
                                borderLeft: `4px solid ${mode.accent ? 'var(--accent)' : 'var(--primary)'}`,
                                display: 'flex', gap: 'var(--space-3)', alignItems: 'center',
                                background: 'var(--bg-card)',
                                border: '1px solid var(--border)',
                                borderLeftWidth: 4,
                                borderLeftColor: mode.accent ? 'var(--accent)' : 'var(--primary)',
                                fontFamily: 'inherit',
                                textAlign: 'left',
                                width: '100%',
                                cursor: locked ? 'not-allowed' : 'pointer',
                                opacity: locked ? 0.6 : 1,
                            }}
                        >
                            <span style={{ fontSize: 22 }}>{mode.icon}</span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <span style={{
                                    fontSize: 10, fontWeight: 600,
                                    color: mode.accent ? 'var(--accent)' : 'var(--primary)',
                                    display: 'block', marginBottom: 1,
                                }}>
                                    STEP {mode.step}
                                </span>
                                <h4 style={{ fontSize: 'var(--font-sm)', fontWeight: 600 }}>{mode.title}</h4>
                                <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{mode.desc}</p>
                            </div>
                            {locked ? (
                                <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>🔒</span>
                            ) : (
                                <span className="iconify" data-icon="mdi:chevron-right" style={{ fontSize: 18, color: 'var(--text-muted)' }}></span>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
