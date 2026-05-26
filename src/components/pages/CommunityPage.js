'use client';

const successStories = [
    {
        id: 1,
        name: 'Nguyễn Thị Mai',
        flag: '🇻🇳',
        country: '베트남',
        licence: '한식조리기능사',
        icon: '🍚',
        year: 2024,
        message: '한국어가 어려웠지만, 쉬운 한국어로 먼저 이해하고 조금씩 원래 문제에 도전했어요. 3개월 걸렸지만 합격했어요!',
        tips: [
            '매일 20문제씩 풀었어요',
            '모르는 단어는 바로 사전에서 찾았어요',
            '실기는 유튜브로 많이 봤어요',
        ],
        studyMonths: 3,
    },
    {
        id: 2,
        name: '王小明',
        flag: '🇨🇳',
        country: '중국',
        licence: '제과기능사',
        icon: '🍰',
        year: 2024,
        message: '중국어로 시험을 볼 수 있어서 좋았어요! 하지만 실기 용어는 한국어로 알아야 해서 앱으로 공부했어요.',
        tips: [
            '중국어 시험이 가능한지 먼저 확인하세요',
            '실기 용어는 한국어로 외워야 해요',
            '배합표를 완벽히 암기했어요',
        ],
        studyMonths: 2,
    },
    {
        id: 3,
        name: 'ส้มจุก',
        flag: '🇹🇭',
        country: '태국',
        licence: '미용사(일반)',
        icon: '💇',
        year: 2023,
        message: '태국어 시험은 없어서 어려웠지만, STEP 1부터 차근차근 했어요. 포기하지 마세요!',
        tips: [
            'STEP 1 → 2 → 3 순서대로 공부하세요',
            '공중위생 파트가 가장 외울 게 많아요',
            '같은 문제를 3번 이상 반복하세요',
        ],
        studyMonths: 5,
    },
];

const studyTips = [
    {
        icon: '⏰',
        title: '매일 30분씩',
        desc: '짧은 시간이라도 매일 공부하는 게 효과적이에요',
    },
    {
        icon: '📱',
        title: '출퇴근 시간 활용',
        desc: '버스나 지하철에서 문제 5개만 풀어보세요',
    },
    {
        icon: '🔄',
        title: '틀린 문제 반복',
        desc: '틀린 문제를 3번 이상 다시 풀어보세요',
    },
    {
        icon: '📺',
        title: '유튜브 실기 영상',
        desc: '실기는 영상으로 보면서 따라하면 좋아요',
    },
    {
        icon: '👥',
        title: '스터디 그룹',
        desc: '같은 자격증 준비하는 친구와 함께 공부하세요',
    },
    {
        icon: '📝',
        title: '오답노트 만들기',
        desc: '틀린 문제와 이유를 적어두세요',
    },
];

export default function CommunityPage({ language }) {
    return (
        <div className="animate-fadeIn">
            <div style={{ marginBottom: 'var(--space-6)' }}>
                <h2 style={{ fontSize: 'var(--font-2xl)', fontWeight: 800, marginBottom: 'var(--space-2)' }}>
                    💬 합격 꿀팁
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-sm)' }}>
                    합격한 선배들의 이야기와 공부 팁
                </p>
            </div>

            {/* Success Stories */}
            <div className="section-header">
                <h3 className="section-title">🏆 합격 수기</h3>
            </div>

            <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-4)',
                marginBottom: 'var(--space-8)',
            }}>
                {successStories.map((story, index) => (
                    <div
                        key={story.id}
                        className="animate-slideUp"
                        style={{
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border)',
                            borderRadius: 'var(--radius-md)',
                            padding: 'var(--space-5)',
                            animationDelay: `${index * 80}ms`,
                            animationFillMode: 'both',
                        }}
                    >
                        {/* Author Info */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--space-3)',
                            marginBottom: 'var(--space-3)',
                        }}>
                            <div style={{
                                width: 44,
                                height: 44,
                                borderRadius: 'var(--radius-full)',
                                background: 'var(--gray-100)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 22,
                            }}>
                                {story.flag}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 600, fontSize: 'var(--font-sm)' }}>{story.name}</div>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 'var(--space-2)',
                                    fontSize: 'var(--font-xs)',
                                    color: 'var(--text-secondary)',
                                }}>
                                    <span>{story.icon} {story.licence}</span>
                                    <span>·</span>
                                    <span>{story.year}년 합격</span>
                                </div>
                            </div>
                            <span className="badge badge--success">
                                {story.studyMonths}개월 준비
                            </span>
                        </div>

                        {/* Quote with left accent bar */}
                        <p style={{
                            fontSize: 'var(--font-sm)',
                            lineHeight: 1.7,
                            color: 'var(--text-primary)',
                            marginBottom: 'var(--space-3)',
                            background: 'var(--gray-50)',
                            padding: 'var(--space-3)',
                            borderRadius: 'var(--radius-sm)',
                            borderLeft: '3px solid var(--accent)',
                        }}>
                            "{story.message}"
                        </p>

                        {/* Tips */}
                        <div style={{ marginTop: 'var(--space-2)' }}>
                            <div style={{
                                fontSize: 'var(--font-xs)',
                                fontWeight: 600,
                                color: 'var(--text-secondary)',
                                marginBottom: 'var(--space-2)',
                            }}>
                                💡 이 분의 팁:
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                                {story.tips.map((tip, i) => (
                                    <div key={i} style={{
                                        fontSize: 'var(--font-xs)',
                                        color: 'var(--text-secondary)',
                                        display: 'flex',
                                        gap: 'var(--space-2)',
                                        alignItems: 'flex-start',
                                    }}>
                                        <span style={{ color: 'var(--primary)', fontWeight: 600 }}>•</span>
                                        <span>{tip}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Study Tips */}
            <div className="section-header">
                <h3 className="section-title">📚 공부 꿀팁</h3>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 'var(--space-3)',
            }}>
                {studyTips.map((tip, i) => (
                    <div
                        key={i}
                        style={{
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border)',
                            borderRadius: 'var(--radius-md)',
                            padding: 'var(--space-4)',
                            textAlign: 'center',
                        }}
                    >
                        <div style={{ fontSize: 28, marginBottom: 'var(--space-2)' }}>{tip.icon}</div>
                        <h4 style={{
                            fontSize: 'var(--font-sm)',
                            fontWeight: 600,
                            marginBottom: 'var(--space-1)',
                            color: 'var(--text-primary)',
                        }}>
                            {tip.title}
                        </h4>
                        <p style={{
                            fontSize: 'var(--font-xs)',
                            color: 'var(--text-secondary)',
                            lineHeight: 1.4,
                        }}>
                            {tip.desc}
                        </p>
                    </div>
                ))}
            </div>

            {/* Useful Links */}
            <div style={{ marginTop: 'var(--space-8)' }}>
                <div className="section-header">
                    <h3 className="section-title">🔗 유용한 링크</h3>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                    {[
                        { name: 'Q-net (시험접수)', url: 'https://www.q-net.or.kr', icon: 'mdi:web' },
                        { name: '다누리 (다문화가족 지원)', url: 'https://www.liveinkorea.kr', icon: 'mdi:heart' },
                        { name: '폴리텍대학 (기술교육)', url: 'https://www.kopo.ac.kr', icon: 'mdi:school' },
                    ].map((link, i) => (
                        <a
                            key={i}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                background: 'var(--bg-card)',
                                border: '1px solid var(--border)',
                                borderRadius: 'var(--radius-md)',
                                padding: 'var(--space-3) var(--space-4)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 'var(--space-3)',
                                textDecoration: 'none',
                                color: 'inherit',
                                transition: 'box-shadow var(--dur-micro)',
                            }}
                            onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--shadow-sm)'}
                            onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
                        >
                            <span className="iconify" data-icon={link.icon} style={{ fontSize: 20, color: 'var(--primary)' }}></span>
                            <span style={{ flex: 1, fontSize: 'var(--font-sm)', fontWeight: 500 }}>{link.name}</span>
                            <span style={{
                                fontSize: 11,
                                color: 'var(--text-muted)',
                                background: 'var(--gray-100)',
                                padding: '2px 8px',
                                borderRadius: 'var(--radius-full)',
                                fontWeight: 500,
                            }}>
                                외부 링크
                            </span>
                            <span className="iconify" data-icon="mdi:open-in-new" style={{ fontSize: 16, color: 'var(--text-muted)' }}></span>
                        </a>
                    ))}
                </div>
            </div>
        </div>
    );
}
