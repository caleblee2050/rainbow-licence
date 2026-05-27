'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api-client';

const STATUS_STEPS = [
    { key: 'extracting', label: '텍스트 분석' },
    { key: 'summarizing', label: '요약 + 개념 + 문제 생성' },
    { key: 'translating', label: '5언어 번역' },
    { key: 'done', label: '완료' },
];

function SourcePreview({ sourceId, language }) {
    const [concepts, setConcepts] = useState([]);
    const [problems, setProblems] = useState([]);

    useEffect(() => {
        let alive = true;
        api.getSource(sourceId).then(({ source }) => {
            if (!alive) return;
            api.userConcepts(source.licence_id).then(({ concepts }) => {
                if (alive) setConcepts(concepts.filter(c => c.source_id === sourceId));
            });
            api.userProblems(source.licence_id).then(({ problems }) => {
                if (alive) setProblems(problems.filter(p => p.source_id === sourceId));
            });
        });
        return () => { alive = false; };
    }, [sourceId]);

    return (
        <div>
            <h3 style={{ marginTop: 'var(--space-4)', fontWeight: 600 }}>핵심 개념 ({concepts.length})</h3>
            <ul style={{ listStyle: 'none', padding: 0 }}>
                {concepts.slice(0, 5).map(c => (
                    <li key={c.id} style={{ padding: 'var(--space-2) 0', borderBottom: '1px solid var(--border)' }}>
                        <div style={{ fontWeight: 600 }}>{c.korean}</div>
                        <div style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)' }}>{c.korean_definition}</div>
                        {language && c[language] && (
                            <div style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)', marginTop: 2 }}>
                                {c[language]}: {c[`${language}_def`]}
                            </div>
                        )}
                    </li>
                ))}
            </ul>
            <h3 style={{ marginTop: 'var(--space-4)', fontWeight: 600 }}>생성된 문제 ({problems.length})</h3>
            <ul style={{ listStyle: 'none', padding: 0 }}>
                {problems.slice(0, 3).map(p => (
                    <li key={p.id} style={{ padding: 'var(--space-2) 0', borderBottom: '1px solid var(--border)' }}>
                        <div style={{ fontWeight: 600 }}>{p.ko_question}</div>
                    </li>
                ))}
            </ul>
            <p style={{ marginTop: 'var(--space-4)', color: 'var(--text-muted)', fontSize: 'var(--font-xs)' }}>
                학습 화면의 "내 자료" 묶음에서 풀어보세요.
            </p>
        </div>
    );
}

export default function SourceDetailPage({ sourceId, language, onBack }) {
    const [source, setSource] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!sourceId) return;
        let alive = true;
        const tick = async () => {
            try {
                const { source } = await api.getSource(sourceId);
                if (!alive) return;
                setSource(source);
                if (source.status !== 'done' && source.status !== 'failed') {
                    setTimeout(tick, 3000);
                }
            } catch (e) {
                if (alive) setError(e.message);
            }
        };
        tick();
        return () => { alive = false; };
    }, [sourceId]);

    const retry = async () => {
        setError(null);
        try {
            await api.retrySource(sourceId);
            const { source } = await api.getSource(sourceId);
            setSource(source);
        } catch (e) {
            setError(e.message);
        }
    };

    const remove = async () => {
        if (!confirm('이 자료를 삭제할까요? 관련 요약·개념·문제가 모두 사라집니다.')) return;
        try {
            await api.deleteSource(sourceId);
            onBack();
        } catch (e) {
            setError(e.message);
        }
    };

    if (!source) return <div style={{ padding: 'var(--space-4)' }}>{error ?? '불러오는 중…'}</div>;

    const currentIdx = STATUS_STEPS.findIndex(s => s.key === source.status);

    return (
        <div style={{ padding: 'var(--space-4)' }}>
            <button onClick={onBack} className="btn btn--ghost" style={{ marginBottom: 'var(--space-3)' }}>← 목록</button>
            <h2 style={{ fontWeight: 700, fontSize: 'var(--font-xl)', marginBottom: 'var(--space-2)' }}>{source.title}</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-xs)', marginBottom: 'var(--space-4)' }}>
                {String(source.type).toUpperCase()} · {new Date(Number(source.created_at)).toLocaleString()}
            </p>

            {source.domain_score != null && source.domain_score < 0.4 && (
                <div style={{ background: 'var(--warning-bg)', border: '1px solid var(--warning)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-3)' }}>
                    이 자료는 선택한 자격증과 관련성이 낮아 보입니다 (점수 {Math.round(source.domain_score * 100)}/100). 그래도 자료로 활용됩니다.
                </div>
            )}

            <div style={{ marginBottom: 'var(--space-4)' }}>
                {STATUS_STEPS.map((step, i) => {
                    const isDone = source.status === 'done' || (currentIdx >= 0 && i < currentIdx);
                    const isCurrent = step.key === source.status;
                    return (
                        <div key={step.key} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-2) 0' }}>
                            <span style={{ width: 24, height: 24, borderRadius: '50%', background: isDone ? 'var(--success)' : isCurrent ? 'var(--primary)' : 'var(--gray-200)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>
                                {isDone ? '✓' : i + 1}
                            </span>
                            <span style={{ color: isDone || isCurrent ? 'var(--text-primary)' : 'var(--text-muted)' }}>{step.label}</span>
                            {isCurrent && <span className="iconify" data-icon="mdi:loading" style={{ marginLeft: 'auto', fontSize: 16, color: 'var(--primary)' }} />}
                        </div>
                    );
                })}
            </div>

            {source.status === 'failed' && (
                <div style={{ background: 'var(--error-bg)', border: '1px solid var(--error)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-3)' }}>
                    <div style={{ color: 'var(--error)', fontWeight: 600 }}>처리 실패</div>
                    <p style={{ marginTop: 4 }}>{source.status_message || '알 수 없는 오류'}</p>
                    <button onClick={retry} className="btn btn--primary" style={{ marginTop: 'var(--space-2)' }}>다시 시도</button>
                </div>
            )}

            {source.status === 'done' && (
                <SourcePreview sourceId={sourceId} language={language} />
            )}

            <div style={{ marginTop: 'var(--space-6)', borderTop: '1px solid var(--border)', paddingTop: 'var(--space-3)' }}>
                <button onClick={remove} className="btn btn--ghost" style={{ color: 'var(--error)' }}>자료 삭제</button>
            </div>
        </div>
    );
}
