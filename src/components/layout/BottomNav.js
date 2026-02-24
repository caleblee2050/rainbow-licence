'use client';

const tabs = [
    { id: 'home', label: '홈', icon: 'mdi:home' },
    { id: 'licence', label: '자격증', icon: 'mdi:certificate' },
    { id: 'study', label: '학습', icon: 'mdi:book-open-page-variant' },
    { id: 'dictionary', label: '사전', icon: 'mdi:translate' },
    { id: 'community', label: '꿀팁', icon: 'mdi:account-group' },
];

export default function BottomNav({ activeTab, onTabChange }) {
    return (
        <nav className="bottom-nav">
            {tabs.map(tab => (
                <button
                    key={tab.id}
                    className={`bottom-nav__item ${activeTab === tab.id ? 'active' : ''}`}
                    onClick={() => onTabChange(tab.id)}
                >
                    <div className="bottom-nav__icon">
                        <span className="iconify" data-icon={tab.icon}></span>
                    </div>
                    <span>{tab.label}</span>
                </button>
            ))}
        </nav>
    );
}
