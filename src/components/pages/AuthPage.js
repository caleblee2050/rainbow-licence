'use client';

import { useState } from 'react';
import { api } from '@/lib/api-client';
import { getOrCreateDeviceId } from '@/lib/deviceId';

const inputStyle = {
    padding: 'var(--space-3) var(--space-4)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    fontSize: 'var(--font-base)',
    fontFamily: 'inherit',
    background: 'var(--bg-card)',
    color: 'var(--text-primary)',
    outline: 'none',
};

export default function AuthPage({ onAuthenticated }) {
    const [mode, setMode] = useState('demo');
    const [schoolCode, setSchoolCode] = useState(process.env.NEXT_PUBLIC_DEMO_SCHOOL_CODE || 'NEXT_SCHOOL');
    const [email, setEmail] = useState('');
    const [language, setLanguage] = useState('vi');
    const [loading, setLoading] = useState(false);
    const [info, setInfo] = useState(null);
    const [error, setError] = useState(null);

    const handleDemo = async () => {
        setLoading(true); setError(null);
        try {
            const deviceId = getOrCreateDeviceId();
            const { user } = await api.deviceAnon({ deviceId, schoolCode, language });
            onAuthenticated(user);
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleEmail = async () => {
        setLoading(true); setError(null); setInfo(null);
        try {
            await api.sendMagicLink(email);
            setInfo('이메일 받은 편지함을 확인하세요. 링크는 15분 동안 유효합니다.');
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="app-shell" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-6)', background: 'var(--bg-main)' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 700, color: 'var(--primary)', marginBottom: 'var(--space-2)' }}>Rainbow Licence</div>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-6)', fontSize: 'var(--font-sm)' }}>로그인하면 자료가 다른 기기에서도 보입니다.</p>

            <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
                <button onClick={() => setMode('demo')} className={`chip ${mode === 'demo' ? 'active' : ''}`}>학교 코드</button>
                <button onClick={() => setMode('email')} className={`chip ${mode === 'email' ? 'active' : ''}`}>이메일 로그인</button>
            </div>

            {mode === 'demo' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', width: '100%', maxWidth: 400 }}>
                    <input type="text" placeholder="학교 코드" value={schoolCode} onChange={e => setSchoolCode(e.target.value)} style={inputStyle} />
                    <select value={language} onChange={e => setLanguage(e.target.value)} style={inputStyle}>
                        <option value="vi">Tiếng Việt</option>
                        <option value="zh">中文</option>
                        <option value="th">ไทย</option>
                        <option value="tl">Tagalog</option>
                        <option value="my">မြန်မာ</option>
                    </select>
                    <button onClick={handleDemo} disabled={loading} className="btn btn--primary btn--full btn--lg">{loading ? '잠시만요…' : '시작'}</button>
                </div>
            )}

            {mode === 'email' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', width: '100%', maxWidth: 400 }}>
                    <input type="email" placeholder="이메일" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} />
                    <button onClick={handleEmail} disabled={loading || !email} className="btn btn--primary btn--full btn--lg">{loading ? '발송 중…' : '로그인 링크 받기'}</button>
                </div>
            )}

            {info && <p style={{ color: 'var(--success)', marginTop: 'var(--space-3)' }}>{info}</p>}
            {error && <p style={{ color: 'var(--error)', marginTop: 'var(--space-3)' }}>{error}</p>}
        </div>
    );
}
