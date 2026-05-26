'use client';
import React from 'react';

export default class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }
    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }
    componentDidCatch(error, info) {
        // 개발 시 콘솔에 남김
        console.error('[ErrorBoundary]', error, info);
    }
    handleReset = () => {
        this.setState({ hasError: false, error: null });
    };
    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    padding: 'var(--space-lg, 24px)',
                    margin: 'var(--space-lg, 24px)',
                    border: '1px solid var(--border, #E5DED2)',
                    borderRadius: 'var(--radius-md, 8px)',
                    background: 'var(--surface, #FFFFFF)',
                    color: 'var(--text-primary, #1E1E1E)',
                    fontFamily: 'var(--font-body, system-ui)',
                }}>
                    <h2 style={{ marginTop: 0, fontSize: 18 }}>⚠️ 일시적인 문제가 발생했어요</h2>
                    <p style={{ fontSize: 14, color: 'var(--text-secondary, #5A5048)' }}>
                        화면을 다시 불러와 주세요. 문제가 계속되면 데모 초기화를 시도해 보세요.
                    </p>
                    <button
                        onClick={this.handleReset}
                        style={{
                            marginTop: 12,
                            padding: '8px 16px',
                            background: 'var(--primary, #0B5563)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 'var(--radius-sm, 6px)',
                            cursor: 'pointer',
                        }}
                    >
                        다시 시도
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}
