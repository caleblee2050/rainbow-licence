'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api-client';

const inputStyle = {
    width: '100%',
    padding: 'var(--space-3) var(--space-4)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    fontSize: 'var(--font-sm)',
    fontFamily: 'inherit',
    outline: 'none',
    background: 'var(--bg-card)',
    color: 'var(--text-primary)',
};

function StatusBadge({ status }) {
    const map = {
        pending: { label: '대기', color: 'var(--text-muted)' },
        extracting: { label: '분석 중', color: 'var(--primary)' },
        summarizing: { label: '요약 중', color: 'var(--primary)' },
        translating: { label: '번역 중', color: 'var(--primary)' },
        done: { label: '완료', color: 'var(--success)' },
        failed: { label: '실패', color: 'var(--error)' },
    };
    const m = map[status] ?? { label: status, color: 'var(--text-muted)' };
    return <span style={{ fontSize: 'var(--font-xs)', color: m.color, fontWeight: 600 }}>{m.label}</span>;
}

export default function NotebookPage({ licenceId, onOpenSource }) {
    const [sources, setSources] = useState([]);
    const [loading, setLoading] = useState(true);
    const [adding, setAdding] = useState(null);  // null | 'text' | 'pdf'
    const [title, setTitle] = useState('');
    const [text, setText] = useState('');
    const [file, setFile] = useState(null);
    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const reload = async () => {
        setLoading(true);
        try {
            const { sources } = await api.listSources(licenceId);
            setSources(sources);
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { reload(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [licenceId]);

    const submit = async () => {
        setSubmitting(true); setError(null);
        try {
            let created;
            if (adding === 'text') {
                if (!title.trim() || !text.trim()) throw new Error('제목과 내용을 모두 입력하세요.');
                created = await api.createSourceText({ licenceId, title: title.trim(), text });
            } else if (adding === 'pdf') {
                if (!file) throw new Error('PDF 파일을 선택하세요.');
                if (file.size > 10 * 1024 * 1024) throw new Error('PDF는 10MB 이하만 가능합니다.');
                created = await api.createSourcePdf({ licenceId, title: title.trim() || file.name, file });
            }
            if (created?.source?.id) {
                await api.processSource(created.source.id);
            }
            setAdding(null); setTitle(''); setText(''); setFile(null);
            await reload();
        } catch (e) {
            setError(e.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div style={{ padding: 'var(--space-4)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--font-2xl)' }}>📚 내 자료</h2>
                <button onClick={() => setAdding('text')} className="btn btn--primary">+ 자료 추가</button>
            </div>

            {adding && (
                <div className="card" style={{ padding: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
                    <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
                        <button onClick={() => setAdding('text')} className={`chip ${adding === 'text' ? 'active' : ''}`}>텍스트</button>
                        <button onClick={() => setAdding('pdf')} className={`chip ${adding === 'pdf' ? 'active' : ''}`}>PDF</button>
                    </div>
                    <input type="text" placeholder="자료 제목" value={title} onChange={e => setTitle(e.target.value)} style={inputStyle} />
                    {adding === 'text' && (
                        <textarea value={text} onChange={e => setText(e.target.value)} placeholder="여기에 학습 자료 본문을 붙여넣어 주세요…" rows={10} style={{ ...inputStyle, marginTop: 'var(--space-2)', fontFamily: 'var(--font-mono)', resize: 'vertical' }} />
                    )}
                    {adding === 'pdf' && (
                        <input type="file" accept="application/pdf" onChange={e => setFile(e.target.files?.[0] ?? null)} style={{ ...inputStyle, marginTop: 'var(--space-2)' }} />
                    )}
                    <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-3)' }}>
                        <button onClick={submit} disabled={submitting} className="btn btn--primary">{submitting ? '등록 중…' : '등록'}</button>
                        <button onClick={() => setAdding(null)} className="btn btn--ghost">취소</button>
                    </div>
                    {error && <p style={{ color: 'var(--error)', marginTop: 'var(--space-2)' }}>{error}</p>}
                </div>
            )}

            {loading ? <p>불러오는 중…</p> : (
                sources.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state__icon">📝</div>
                        <p className="empty-state__text">아직 자료가 없어요. PDF·텍스트를 추가하면 자동으로 학습 패키지가 만들어집니다.</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                        {sources.map(s => (
                            <button key={s.id} onClick={() => onOpenSource(s.id)} className="card card--interactive" style={{ padding: 'var(--space-4)', textAlign: 'left', border: 'none', background: 'var(--bg-card)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <div style={{ fontWeight: 600 }}>{s.title}</div>
                                        <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', marginTop: 4 }}>{String(s.type).toUpperCase()} · {new Date(Number(s.created_at)).toLocaleDateString()}</div>
                                    </div>
                                    <StatusBadge status={s.status} />
                                </div>
                            </button>
                        ))}
                    </div>
                )
            )}
        </div>
    );
}
