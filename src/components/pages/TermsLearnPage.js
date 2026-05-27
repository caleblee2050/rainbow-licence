'use client';

import { useState, useMemo, useCallback, useRef } from 'react';
import { getTermsByLicence } from '@/data/terms';
import { licences } from '@/data/licences';
import { recordAnswer } from '@/lib/studyEngine';
import { isLanguageVerified } from '@/lib/demoMode';

const LANG_NAMES = {
    vi: 'Tiếng Việt', zh: '中文', th: 'ไทย', tl: 'Filipino', my: 'မြန်မာ',
};

function shuffle(arr) {
    const out = [...arr];
    for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
}

export default function TermsLearnPage({ language, licenceId, onExit }) {
    const allTerms = useMemo(() => shuffle(getTermsByLicence(licenceId)), [licenceId]);
    const licence = licences.find(l => l.id === licenceId);
    const [index, setIndex] = useState(0);
    const [flipped, setFlipped] = useState(false);
    const [stats, setStats] = useState({ known: 0, unknown: 0, unknownTerms: [] });
    const touchStartX = useRef(null);

    const total = allTerms.length;
    const current = allTerms[index];
    const finished = index >= total;
    const progress = total > 0 ? ((index + (flipped ? 0.5 : 0)) / total) * 100 : 0;

    const goNext = useCallback((known) => {
        if (current && known !== null) {
            recordAnswer(`term-${licenceId}-${current.korean}`, licenceId, '용어', known);
            setStats(s => ({
                known: s.known + (known ? 1 : 0),
                unknown: s.unknown + (known ? 0 : 1),
                unknownTerms: known ? s.unknownTerms : [...s.unknownTerms, current],
            }));
        }
        setFlipped(false);
        setIndex(i => i + 1);
    }, [current, licenceId]);

    const goPrev = useCallback(() => {
        setFlipped(false);
        setIndex(i => Math.max(0, i - 1));
    }, []);

    const onTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
    const onTouchEnd = (e) => {
        if (touchStartX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchStartX.current;
        touchStartX.current = null;
        if (Math.abs(dx) < 50) return;
        if (dx < 0 && !finished) goNext(null);
        if (dx > 0) goPrev();
    };

    const restart = () => {
        setIndex(0);
        setFlipped(false);
        setStats({ known: 0, unknown: 0, unknownTerms: [] });
    };

    if (total === 0) {
        return (
            <div className="empty-state">
                <div className="empty-state__icon">📚</div>
                <p className="empty-state__text">이 자격증의 용어를 준비 중입니다.</p>
                <button className="btn btn--primary" onClick={onExit}>돌아가기</button>
            </div>
        );
    }

    if (finished) {
        const total2 = stats.known + stats.unknown;
        const rate = total2 > 0 ? Math.round((stats.known / total2) * 100) : 0;
        return (
            <div className="animate-fadeIn">
                <div className="card" style={{
                    padding: 'var(--space-6)', textAlign: 'center', marginBottom: 'var(--space-4)',
                    background: 'var(--primary-soft)', border: '1px solid var(--border)',
                }}>
                    <div style={{ fontSize: 48, marginBottom: 'var(--space-3)' }}>{rate >= 70 ? '🎉' : '💪'}</div>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--font-2xl)', fontWeight: 700, marginBottom: 'var(--space-2)' }}>
                        용어 학습 완료
                    </h3>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-2)' }}>
                        총 {total}개 중 <strong style={{ color: 'var(--success)' }}>{stats.known}개</strong> 알고 있어요
                    </p>
                    <p style={{ fontWeight: 600, color: rate >= 70 ? 'var(--success)' : 'var(--warning)' }}>
                        이해도 {rate}%
                    </p>
                </div>

                {stats.unknownTerms.length > 0 && (
                    <div className="card" style={{ padding: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
                        <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', marginBottom: 'var(--space-2)' }}>
                            다시 보면 좋을 단어 ({stats.unknownTerms.length}개):
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-1)' }}>
                            {stats.unknownTerms.slice(0, 20).map(t => (
                                <span key={t.korean} style={{
                                    padding: '4px 10px', borderRadius: 'var(--radius-full)',
                                    background: 'var(--warning-bg)', color: 'var(--warning)',
                                    fontSize: 12, fontWeight: 500,
                                }}>{t.korean}</span>
                            ))}
                            {stats.unknownTerms.length > 20 && (
                                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>+{stats.unknownTerms.length - 20}</span>
                            )}
                        </div>
                    </div>
                )}

                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                    <button onClick={restart} style={{
                        flex: 1, padding: '14px 20px', borderRadius: 'var(--radius-md)',
                        border: 'none', background: 'var(--primary)', color: '#fff',
                        fontWeight: 600, fontSize: 'var(--font-base)', cursor: 'pointer', fontFamily: 'inherit',
                    }}>🔄 다시 풀기</button>
                    <button onClick={onExit} style={{
                        flex: 1, padding: '14px 20px', borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--primary)', background: 'transparent', color: 'var(--primary)',
                        fontWeight: 600, fontSize: 'var(--font-base)', cursor: 'pointer', fontFamily: 'inherit',
                    }}>← 사전으로</button>
                </div>
            </div>
        );
    }

    const nativeText = current[language] || current.vi;

    return (
        <div className="animate-fadeIn">
            {/* 상단 바 */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
                <button onClick={onExit} style={{
                    background: 'transparent', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                    padding: 'var(--space-2) var(--space-3)', color: 'var(--text-secondary)',
                    cursor: 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 'var(--space-1)',
                    fontSize: 'var(--font-xs)', fontWeight: 500,
                }}>
                    <span className="iconify" data-icon="mdi:arrow-left" style={{ fontSize: 16 }}></span>
                    사전
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <span style={{ fontSize: 16 }}>{licence?.icon}</span>
                    <span style={{ fontWeight: 600, fontSize: 'var(--font-sm)' }}>{licence?.name} · 용어</span>
                </div>
            </div>

            {/* 진행 */}
            <div style={{ marginBottom: 'var(--space-4)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-1)', fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
                    <span>{index + 1} / {total}</span>
                    <span>✓ {stats.known} · ❌ {stats.unknown}</span>
                </div>
                <div style={{ width: '100%', height: 4, background: 'var(--gray-200)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                    <div style={{
                        height: '100%', width: `${progress}%`,
                        background: 'linear-gradient(90deg, var(--primary), var(--accent))',
                        borderRadius: 'var(--radius-full)',
                        transition: 'width var(--transition-slow)',
                    }} />
                </div>
            </div>

            {/* 플래시카드 */}
            <div
                onClick={() => setFlipped(f => !f)}
                onTouchStart={onTouchStart}
                onTouchEnd={onTouchEnd}
                style={{ cursor: 'pointer', userSelect: 'none', marginBottom: 'var(--space-4)' }}
            >
                <div className="card" style={{
                    padding: 'var(--space-8) var(--space-5)', minHeight: 280,
                    display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
                    textAlign: 'center', border: '1px solid var(--border)', background: 'var(--bg-card)',
                    transition: 'background var(--transition-slow)',
                    background: flipped ? 'var(--primary-soft)' : 'var(--bg-card)',
                }}>
                    {!flipped ? (
                        <>
                            <span style={{
                                marginBottom: 'var(--space-3)', fontSize: 11, padding: '3px 10px',
                                background: 'var(--primary-soft)', color: 'var(--primary)',
                                borderRadius: 'var(--radius-full)', fontWeight: 600,
                            }}>{current.category}</span>
                            <h3 style={{
                                fontFamily: 'var(--font-display)', fontSize: 'clamp(28px, 6vw, 40px)',
                                fontWeight: 700, color: 'var(--text-primary)', marginBottom: 'var(--space-2)',
                            }}>{current.korean}</h3>
                            <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                [{current.pronunciation}]
                            </p>
                            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 'var(--space-5)' }}>
                                탭해서 번역 보기 →
                            </p>
                        </>
                    ) : (
                        <>
                            <span style={{
                                marginBottom: 'var(--space-3)', fontSize: 11, padding: '3px 10px',
                                background: 'rgba(255,255,255,0.6)', color: 'var(--primary)',
                                borderRadius: 'var(--radius-full)', fontWeight: 600,
                            }}>{LANG_NAMES[language] || language}</span>
                            <h3 style={{
                                fontFamily: 'var(--font-display)', fontSize: 'clamp(20px, 5vw, 32px)',
                                fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.4,
                                marginBottom: 'var(--space-3)',
                            }}>{nativeText}</h3>
                            <p style={{ fontSize: 'var(--font-base)', color: 'var(--text-secondary)' }}>
                                {current.korean} <span style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>[{current.pronunciation}]</span>
                            </p>
                            {!isLanguageVerified(language) && (
                                <p style={{ marginTop: 'var(--space-3)', fontSize: 11, color: 'var(--warning)' }}>
                                    * AI 번역 (검수 진행 중)
                                </p>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* 액션 */}
            {flipped ? (
                <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                    <button onClick={() => goNext(false)} style={{
                        flex: 1, padding: '14px 20px', borderRadius: 'var(--radius-md)',
                        border: '2px solid var(--error)', background: 'var(--error-bg)', color: 'var(--error)',
                        fontWeight: 600, fontSize: 'var(--font-base)', cursor: 'pointer', fontFamily: 'inherit',
                    }}>❌ 모른다</button>
                    <button onClick={() => goNext(true)} style={{
                        flex: 1, padding: '14px 20px', borderRadius: 'var(--radius-md)',
                        border: 'none', background: 'var(--success)', color: '#fff',
                        fontWeight: 600, fontSize: 'var(--font-base)', cursor: 'pointer', fontFamily: 'inherit',
                    }}>✓ 안다</button>
                </div>
            ) : (
                <button onClick={() => setFlipped(true)} style={{
                    width: '100%', padding: '14px 20px', borderRadius: 'var(--radius-md)',
                    border: 'none', background: 'var(--primary)', color: '#fff',
                    fontWeight: 600, fontSize: 'var(--font-base)', cursor: 'pointer', fontFamily: 'inherit',
                }}>번역 보기 →</button>
            )}

            <p style={{ textAlign: 'center', marginTop: 'var(--space-3)', fontSize: 11, color: 'var(--text-muted)' }}>
                ← 좌우 스와이프로 카드 이동 →
            </p>
        </div>
    );
}
