'use client';

import { licences } from '@/data/licences';
import { questions } from '@/data/questions';

export default function LicencePage({ language, onSelectLicence }) {
    return (
        <div className="animate-fadeIn">
            <div style={{ marginBottom: 'var(--space-6)' }}>
                <h2 style={{ fontSize: 'var(--font-2xl)', fontWeight: 800, marginBottom: 'var(--space-2)' }}>
                    📋 자격증 가이드
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-sm)' }}>
                    나에게 맞는 자격증을 찾아보세요
                </p>
            </div>

            {/* Filter Chips */}
            <div style={{
                display: 'flex',
                gap: 'var(--space-2)',
                marginBottom: 'var(--space-5)',
                overflowX: 'auto',
                paddingBottom: 'var(--space-1)',
            }}>
                {['전체', '조리', '미용'].map((cat, i) => (
                    <button key={cat} className={`chip ${i === 0 ? 'active' : ''}`}>{cat}</button>
                ))}
            </div>

            {/* Licence Cards */}
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-4)',
            }}>
                {licences.map((licence, index) => {
                    const qCount = questions.filter(q => q.licenceId === licence.id).length;

                    return (
                        <div
                            key={licence.id}
                            className="card card--interactive animate-slideUp"
                            onClick={() => onSelectLicence(licence.id)}
                            style={{
                                padding: 0,
                                animationDelay: `${index * 60}ms`,
                                animationFillMode: 'both',
                                background: 'var(--bg-card)',
                                overflow: 'hidden',
                            }}
                        >
                            {/* Card Header — white bg + left accent bar */}
                            <div style={{
                                background: 'var(--bg-card)',
                                borderBottom: '1px solid var(--border)',
                                padding: 'var(--space-4) var(--space-5)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                borderLeft: '4px solid var(--accent)',
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                                    <span style={{ fontSize: 32 }}>{licence.icon}</span>
                                    <div>
                                        <h3 style={{
                                            color: 'var(--text-primary)',
                                            fontWeight: 700,
                                            fontSize: 'var(--font-base)',
                                        }}>
                                            {licence.name}
                                        </h3>
                                        <span style={{
                                            color: 'var(--text-muted)',
                                            fontSize: 'var(--font-xs)',
                                        }}>
                                            {licence.category}
                                        </span>
                                    </div>
                                </div>
                                {licence.multiLangExam && (
                                    <span style={{
                                        background: 'var(--accent)',
                                        color: 'white',
                                        padding: '3px 10px',
                                        borderRadius: 'var(--radius-full)',
                                        fontSize: 11,
                                        fontWeight: 600,
                                        flexShrink: 0,
                                    }}>
                                        🌐 다국어 시험 가능
                                    </span>
                                )}
                            </div>

                            {/* Card Body */}
                            <div style={{ padding: 'var(--space-4) var(--space-5)' }}>
                                <p style={{
                                    fontSize: 'var(--font-sm)',
                                    color: 'var(--text-secondary)',
                                    marginBottom: 'var(--space-3)',
                                    lineHeight: 1.5,
                                }}>
                                    {licence.description}
                                </p>

                                {/* Info Tags */}
                                <div style={{
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    gap: 'var(--space-2)',
                                    marginBottom: 'var(--space-3)',
                                }}>
                                    <span className="badge badge--info">
                                        <span className="iconify" data-icon="mdi:file-document-outline" style={{ fontSize: 12 }}></span>
                                        {licence.examInfo.writtenFormat}
                                    </span>
                                    <span className="badge badge--primary">
                                        <span className="iconify" data-icon="mdi:check-circle-outline" style={{ fontSize: 12 }}></span>
                                        {licence.examInfo.passingScore}점 합격
                                    </span>
                                    {qCount > 0 && (
                                        <span className="badge badge--success">
                                            <span className="iconify" data-icon="mdi:school-outline" style={{ fontSize: 12 }}></span>
                                            {qCount}문제 준비됨
                                        </span>
                                    )}
                                </div>

                                {/* Multi-lang Detail */}
                                {licence.multiLangExam && (
                                    <div style={{
                                        background: 'var(--success-bg)',
                                        borderRadius: 'var(--radius-sm)',
                                        padding: 'var(--space-2) var(--space-3)',
                                        fontSize: 'var(--font-xs)',
                                        color: 'var(--success)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 'var(--space-2)',
                                    }}>
                                        <span className="iconify" data-icon="mdi:translate" style={{ fontSize: 14 }}></span>
                                        {licence.multiLangSupport?.includes('zh') ? '🇨🇳 중국어' : ''}{' '}
                                        {licence.multiLangSupport?.includes('vi') ? '🇻🇳 베트남어' : ''} 시험 지원
                                    </div>
                                )}

                                {!licence.multiLangExam && (
                                    <div style={{
                                        background: 'var(--warning-bg)',
                                        borderRadius: 'var(--radius-sm)',
                                        padding: 'var(--space-2) var(--space-3)',
                                        fontSize: 'var(--font-xs)',
                                        color: '#B45309',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 'var(--space-2)',
                                    }}>
                                        <span className="iconify" data-icon="mdi:alert-circle-outline" style={{ fontSize: 14 }}></span>
                                        한국어 시험만 가능 — 이 앱이 도와드릴게요!
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
