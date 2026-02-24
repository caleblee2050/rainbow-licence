'use client';

import { useState, useCallback, useEffect } from 'react';
import BottomNav from '@/components/layout/BottomNav';
import TopNav from '@/components/layout/TopNav';
import HomePage from '@/components/pages/HomePage';
import LicencePage from '@/components/pages/LicencePage';
import StudyPage from '@/components/pages/StudyPage';
import DictionaryPage from '@/components/pages/DictionaryPage';
import CommunityPage from '@/components/pages/CommunityPage';
import OnboardingPage from '@/components/pages/OnboardingPage';
import { isOnboardingComplete, getUserProfile, isPremium as checkPremium, activatePremium } from '@/lib/studyEngine';

export default function Home() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [selectedLanguage, setSelectedLanguage] = useState('vi');
  const [selectedLicence, setSelectedLicence] = useState(null);
  const [studyMode, setStudyMode] = useState('step1');
  const [premium, setPremium] = useState(false);
  const [mounted, setMounted] = useState(false);

  // 초기화: 온보딩 상태, 사용자 프로필 로드
  useEffect(() => {
    setMounted(true);
    if (!isOnboardingComplete()) {
      setShowOnboarding(true);
    } else {
      const profile = getUserProfile();
      setSelectedLanguage(profile.language || 'vi');
      setSelectedLicence(profile.selectedLicence || null);
      setStudyMode(profile.studyMode || 'step1');
    }
    setPremium(checkPremium());
  }, []);

  const handleOnboardingComplete = useCallback((profile) => {
    setShowOnboarding(false);
    setSelectedLanguage(profile.language);
    setSelectedLicence(profile.selectedLicence);
    setStudyMode(profile.studyMode);
  }, []);

  const navigateToStudy = useCallback((licenceId) => {
    setSelectedLicence(licenceId);
    setActiveTab('study');
  }, []);

  const handleUpgrade = useCallback(() => {
    // 데모: 7일 무료 체험 활성화
    activatePremium('trial', 7);
    setPremium(true);
  }, []);

  // SSR 하이드레이션 방어
  if (!mounted) {
    return (
      <div className="app-shell" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 'var(--space-4)' }}>🌈</div>
          <div className="skeleton" style={{ width: 120, height: 20, margin: '0 auto' }} />
        </div>
      </div>
    );
  }

  // 온보딩
  if (showOnboarding) {
    return (
      <div className="app-shell">
        <OnboardingPage onComplete={handleOnboardingComplete} />
      </div>
    );
  }

  const renderPage = () => {
    switch (activeTab) {
      case 'home':
        return (
          <HomePage
            language={selectedLanguage}
            licenceId={selectedLicence}
            onSelectLicence={navigateToStudy}
            isPremium={premium}
            onUpgrade={handleUpgrade}
          />
        );
      case 'licence':
        return (
          <LicencePage
            language={selectedLanguage}
            onSelectLicence={navigateToStudy}
          />
        );
      case 'study':
        return (
          <StudyPage
            language={selectedLanguage}
            licenceId={selectedLicence}
            studyMode={studyMode}
            onStudyModeChange={setStudyMode}
            onSelectLicence={setSelectedLicence}
            isPremium={premium}
          />
        );
      case 'dictionary':
        return (
          <DictionaryPage
            language={selectedLanguage}
            licenceId={selectedLicence}
          />
        );
      case 'community':
        return <CommunityPage language={selectedLanguage} />;
      default:
        return null;
    }
  };

  return (
    <div className="app-shell">
      <TopNav
        selectedLanguage={selectedLanguage}
        onLanguageChange={setSelectedLanguage}
      />
      <main className="main-content">
        {renderPage()}
      </main>
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
