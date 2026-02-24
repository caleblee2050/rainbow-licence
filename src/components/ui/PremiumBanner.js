'use client';

export default function PremiumBanner({ onUpgrade }) {
    return (
        <div style={{
            background: 'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)',
            borderRadius: 'var(--radius-xl)',
            padding: 'var(--space-5)',
            color: 'white',
            position: 'relative',
            overflow: 'hidden',
            marginBottom: 'var(--space-5)',
        }}>
            <div style={{
                position: 'absolute', right: -20, top: -20, width: 100, height: 100,
                background: 'rgba(255,255,255,0.1)', borderRadius: '50%',
            }} />
            <div style={{
                position: 'absolute', right: 30, bottom: -10, width: 50, height: 50,
                background: 'rgba(255,255,255,0.05)', borderRadius: '50%',
            }} />

            <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                    <span style={{ fontSize: 20 }}>👑</span>
                    <span style={{ fontWeight: 700, fontSize: 'var(--font-base)' }}>프리미엄</span>
                </div>
                <p style={{ fontSize: 'var(--font-sm)', opacity: 0.9, marginBottom: 'var(--space-3)', lineHeight: 1.5 }}>
                    무제한 문제 + AI 번역 + 모의고사 + 오답노트
                </p>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
                    <span style={{ fontSize: 'var(--font-2xl)', fontWeight: 800 }}>₩9,900</span>
                    <span style={{ fontSize: 'var(--font-sm)', opacity: 0.7 }}>/월</span>
                </div>
                <button
                    onClick={onUpgrade}
                    style={{
                        width: '100%',
                        padding: 'var(--space-3) var(--space-5)',
                        borderRadius: 'var(--radius-md)',
                        border: 'none',
                        background: 'rgba(255,255,255,0.2)',
                        backdropFilter: 'blur(4px)',
                        color: 'white',
                        fontWeight: 600,
                        fontSize: 'var(--font-sm)',
                        fontFamily: 'inherit',
                        cursor: 'pointer',
                        transition: 'background var(--transition-fast)',
                    }}
                    onMouseEnter={e => e.target.style.background = 'rgba(255,255,255,0.3)'}
                    onMouseLeave={e => e.target.style.background = 'rgba(255,255,255,0.2)'}
                >
                    7일 무료 체험 시작 ✨
                </button>
            </div>
        </div>
    );
}

export function PremiumLock({ children, isPremium, feature }) {
    if (isPremium) return children;

    return (
        <div style={{ position: 'relative' }}>
            <div style={{ filter: 'blur(3px)', pointerEvents: 'none', opacity: 0.5 }}>
                {children}
            </div>
            <div style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(255,255,255,0.5)',
                borderRadius: 'var(--radius-lg)',
            }}>
                <div style={{
                    background: 'var(--bg-card)',
                    borderRadius: 'var(--radius-lg)',
                    padding: 'var(--space-4) var(--space-5)',
                    textAlign: 'center',
                    boxShadow: 'var(--shadow-lg)',
                }}>
                    <span style={{ fontSize: 28, display: 'block', marginBottom: 'var(--space-2)' }}>🔒</span>
                    <p style={{ fontSize: 'var(--font-sm)', fontWeight: 600, marginBottom: 'var(--space-1)' }}>
                        프리미엄 기능
                    </p>
                    <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
                        {feature}
                    </p>
                </div>
            </div>
        </div>
    );
}
