'use client';

import { useState, useMemo } from 'react';
import { getAllTerms, getTermsByLicence, getCategories, searchTerms } from '@/data/terms';
import { licences } from '@/data/licences';
import { isLanguageVerified } from '@/lib/demoMode';

const LANG_LABELS = {
    vi: '🇻🇳 베트남어',
    zh: '🇨🇳 중국어',
    th: '🇹🇭 태국어',
    tl: '🇵🇭 필리핀어',
    my: '🇲🇲 미얀마어',
};

export default function DictionaryPage({ language, licenceId }) {
    const [search, setSearch] = useState('');
    const [selectedLicence, setSelectedLicence] = useState(licenceId || null);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [focusedSearch, setFocusedSearch] = useState(false);

    const filteredTerms = useMemo(() => {
        if (search) {
            return searchTerms(search, language, selectedLicence);
        }
        const source = selectedLicence ? getTermsByLicence(selectedLicence) : getAllTerms();
        if (selectedCategory) {
            return source.filter(t => t.category === selectedCategory);
        }
        return source;
    }, [search, language, selectedLicence, selectedCategory]);

    const categories = useMemo(() => {
        if (selectedLicence) return getCategories(selectedLicence);
        return [...new Set(getAllTerms().map(t => t.category))];
    }, [selectedLicence]);

    return (
        <div className="animate-fadeIn">
            <div style={{ marginBottom: 'var(--space-4)' }}>
                <h2 style={{ fontSize: 'var(--font-2xl)', fontWeight: 800, marginBottom: 'var(--space-2)' }}>📖 용어 사전</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-sm)' }}>
                    시험에 나오는 전문 용어를 5개 언어로 확인하세요
                </p>
            </div>

            {/* Search */}
            <div style={{ position: 'relative', marginBottom: 'var(--space-4)' }}>
                <span className="iconify" data-icon="mdi:magnify" style={{
                    position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                    fontSize: 20, color: 'var(--text-muted)',
                }}></span>
                <input
                    type="text"
                    placeholder="한국어 또는 모국어로 검색..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onFocus={() => setFocusedSearch(true)}
                    onBlur={() => setFocusedSearch(false)}
                    style={{
                        width: '100%', padding: 'var(--space-3) var(--space-4)', paddingLeft: 42,
                        border: focusedSearch ? '2px solid var(--primary)' : '1px solid var(--border)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: 'var(--font-sm)', fontFamily: 'inherit', outline: 'none',
                        background: 'var(--bg-card)', color: 'var(--text-primary)',
                        boxShadow: focusedSearch ? '0 0 0 3px var(--primary-soft)' : 'none',
                        transition: 'border var(--dur-micro), box-shadow var(--dur-micro)',
                    }}
                />
            </div>

            {/* Licence Filter */}
            <div style={{
                display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-3)',
                overflowX: 'auto', paddingBottom: 'var(--space-1)',
            }}>
                <button
                    className={`chip ${!selectedLicence ? 'active' : ''}`}
                    onClick={() => { setSelectedLicence(null); setSelectedCategory(null); }}
                >
                    전체
                </button>
                {licences.filter(l => getTermsByLicence(l.id).length > 0).map(l => (
                    <button
                        key={l.id}
                        className={`chip ${selectedLicence === l.id ? 'active' : ''}`}
                        onClick={() => { setSelectedLicence(l.id); setSelectedCategory(null); }}
                    >
                        {l.icon} {l.name.slice(0, 4)}
                    </button>
                ))}
            </div>

            {/* Category Filter */}
            {categories.length > 1 && (
                <div style={{
                    display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-4)',
                    overflowX: 'auto', paddingBottom: 'var(--space-1)',
                }}>
                    <button
                        className={`chip ${!selectedCategory ? 'active' : ''}`}
                        onClick={() => setSelectedCategory(null)}
                        style={{ fontSize: 'var(--font-xs)' }}
                    >
                        전체 과목
                    </button>
                    {categories.map(cat => (
                        <button
                            key={cat}
                            className={`chip ${selectedCategory === cat ? 'active' : ''}`}
                            onClick={() => setSelectedCategory(cat)}
                            style={{ fontSize: 'var(--font-xs)' }}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            )}

            {/* Count */}
            <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', marginBottom: 'var(--space-3)' }}>
                총 {filteredTerms.length}개의 용어
            </p>

            {/* Terms */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {filteredTerms.map((term, i) => (
                    <div
                        key={`${term.korean}-${i}`}
                        style={{
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border)',
                            borderRadius: 'var(--radius-md)',
                            padding: 'var(--space-4)',
                        }}
                    >
                        {/* Korean word + pronunciation + category */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-2)' }}>
                            <div>
                                <span style={{
                                    fontFamily: 'var(--font-display)',
                                    fontWeight: 700,
                                    fontSize: 'var(--font-lg, 18px)',
                                    color: 'var(--text-primary)',
                                }}>
                                    {term.korean}
                                </span>
                                {term.pronunciation && (
                                    <span style={{
                                        fontFamily: 'var(--font-mono)',
                                        fontSize: 'var(--font-xs)',
                                        color: 'var(--text-muted)',
                                        marginLeft: 'var(--space-2)',
                                    }}>
                                        [{term.pronunciation}]
                                    </span>
                                )}
                            </div>
                            <span className="badge badge--info" style={{ fontSize: 10, flexShrink: 0 }}>{term.category}</span>
                        </div>

                        {/* 5-language translations */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                            {(['vi', 'zh', 'th', 'tl', 'my']).map(lang => (
                                <div
                                    key={lang}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'baseline',
                                        gap: 'var(--space-2)',
                                        fontSize: 'var(--font-sm)',
                                    }}
                                >
                                    <span style={{
                                        fontSize: 10,
                                        color: 'var(--text-muted)',
                                        fontWeight: 500,
                                        minWidth: 64,
                                        flexShrink: 0,
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 4,
                                    }}>
                                        {LANG_LABELS[lang]}
                                        {!isLanguageVerified(lang) && (
                                            <span style={{
                                                fontSize: 9,
                                                color: 'var(--text-muted)',
                                                fontStyle: 'italic',
                                                padding: '0 4px',
                                                border: '1px solid var(--border)',
                                                borderRadius: 'var(--radius-full)',
                                            }}>AI</span>
                                        )}
                                    </span>
                                    <span style={{
                                        color: term[lang] ? 'var(--text-primary)' : 'var(--text-muted)',
                                        fontStyle: term[lang] ? 'normal' : 'italic',
                                    }}>
                                        {term[lang] || '—'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {filteredTerms.length === 0 && (
                <div className="empty-state">
                    <div className="empty-state__icon">🔍</div>
                    <p className="empty-state__text">검색 결과가 없어요</p>
                </div>
            )}
        </div>
    );
}
