'use client';

import { useState } from 'react';
import { supportedLanguages } from '@/data/licences';

export default function TopNav({ selectedLanguage, onLanguageChange }) {
    const [showLangPicker, setShowLangPicker] = useState(false);
    const currentLang = supportedLanguages.find(l => l.code === selectedLanguage);

    return (
        <>
            <nav className="top-nav">
                <h1 className="top-nav__title">🌈 레인보우 자격증</h1>
                <button
                    className="top-nav__lang"
                    onClick={() => setShowLangPicker(true)}
                >
                    <span>{currentLang?.flag}</span>
                    <span>{currentLang?.nativeName}</span>
                    <span className="iconify" data-icon="mdi:chevron-down" style={{ fontSize: 16 }}></span>
                </button>
            </nav>

            {showLangPicker && (
                <div className="overlay" onClick={() => setShowLangPicker(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal__handle" />
                        <div className="modal__header">
                            <h3 style={{ fontSize: 'var(--font-lg)', fontWeight: 700 }}>언어 선택 / Select Language</h3>
                            <button
                                className="btn btn--ghost btn--sm"
                                onClick={() => setShowLangPicker(false)}
                            >
                                <span className="iconify" data-icon="mdi:close" style={{ fontSize: 20 }}></span>
                            </button>
                        </div>
                        <div className="modal__body" style={{ paddingBottom: 'var(--space-8)' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                                {supportedLanguages.map(lang => (
                                    <button
                                        key={lang.code}
                                        onClick={() => {
                                            onLanguageChange(lang.code);
                                            setShowLangPicker(false);
                                        }}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 'var(--space-4)',
                                            padding: 'var(--space-4)',
                                            background: selectedLanguage === lang.code ? 'var(--primary-100)' : 'transparent',
                                            border: selectedLanguage === lang.code ? '1.5px solid var(--primary-200)' : '1.5px solid transparent',
                                            borderRadius: 'var(--radius-md)',
                                            cursor: 'pointer',
                                            fontSize: 'var(--font-base)',
                                            fontFamily: 'inherit',
                                            color: 'var(--text-primary)',
                                            transition: 'all var(--transition-fast)',
                                            textAlign: 'left',
                                        }}
                                    >
                                        <span style={{ fontSize: 28 }}>{lang.flag}</span>
                                        <div>
                                            <div style={{ fontWeight: 600 }}>{lang.nativeName}</div>
                                            <div style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)' }}>
                                                {lang.name}
                                            </div>
                                        </div>
                                        {selectedLanguage === lang.code && (
                                            <span
                                                className="iconify"
                                                data-icon="mdi:check-circle"
                                                style={{ fontSize: 22, color: 'var(--primary)', marginLeft: 'auto' }}
                                            ></span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
