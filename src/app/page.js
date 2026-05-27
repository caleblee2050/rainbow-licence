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
import AuthPage from '@/components/pages/AuthPage';
import NotebookPage from '@/components/pages/NotebookPage';
import SourceDetailPage from '@/components/pages/SourceDetailPage';
import TermsLearnPage from '@/components/pages/TermsLearnPage';
import MockExamPage from '@/components/pages/MockExamPage';
import ErrorBoundary from '@/components/ErrorBoundary';
import { isOnboardingComplete, getUserProfile, isPremium as checkPremium, activatePremium } from '@/lib/studyEngine';
import { api } from '@/lib/api-client';

export default function Home() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [selectedLanguage, setSelectedLanguage] = useState('vi');
  const [selectedLicence, setSelectedLicence] = useState(null);
  const [studyMode, setStudyMode] = useState('step1');
  const [studyView, setStudyView] = useState('study');
  const [dictionaryView, setDictionaryView] = useState('browse');
  const [openSourceId, setOpenSourceId] = useState(null);
  const [premium, setPremium] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [authUser, setAuthUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  // 초기화: 인증 확인, 온보딩 상태, 사용자 프로필 로드
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

    api.me()
      .then(data => { setAuthUser(data.user); })
      .catch(e => { console.warn('[page] 인증 확인 실패:', e.message); })
      .finally(() => { setAuthChecked(true); });
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
    setStudyView('study');
  }, []);

  const goToTermsLearn = useCallback(() => {
    if (!selectedLicence) setSelectedLicence('korean-food');
    setActiveTab('dictionary');
    setDictionaryView('learn');
  }, [selectedLicence]);

  const goToMockExam = useCallback(() => {
    if (!selectedLicence) setSelectedLicence('korean-food');
    setActiveTab('study');
    setStudyView('mock-exam');
  }, [selectedLicence]);

  const handleUpgrade = useCallback(() => {
    // 데모: 7일 무료 체험 활성화
    activatePremium('trial', 7);
    setPremium(true);
  }, []);

  // SSR 하이드레이션 방어 / 인증 확인 중
  if (!mounted || !authChecked) {
    return (
      <div className="app-shell" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 'var(--space-4)' }}>🌈</div>
          <div className="skeleton" style={{ width: 120, height: 20, margin: '0 auto' }} />
        </div>
      </div>
    );
  }

  // 인증 필요
  if (!authUser) {
    return <AuthPage onAuthenticated={u => setAuthUser(u)} />;
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
            onGoToTermsLearn={goToTermsLearn}
            onGoToMockExam={goToMockExam}
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
        if (studyView === 'notebook' && selectedLicence) {
          return (
            <NotebookPage
              licenceId={selectedLicence}
              onOpenSource={(id) => { setOpenSourceId(id); setStudyView('source-detail'); }}
              activeView={studyView}
              onChangeView={setStudyView}
              onStartMockExam={() => setStudyView('mock-exam')}
            />
          );
        }
        if (studyView === 'source-detail' && openSourceId) {
          return (
            <SourceDetailPage
              sourceId={openSourceId}
              language={selectedLanguage}
              onBack={() => { setStudyView('notebook'); setOpenSourceId(null); }}
            />
          );
        }
        if (studyView === 'mock-exam' && selectedLicence) {
          return (
            <MockExamPage
              licenceId={selectedLicence}
              onExit={() => setStudyView('study')}
            />
          );
        }
        return (
          <StudyPage
            language={selectedLanguage}
            licenceId={selectedLicence}
            studyMode={studyMode}
            onStudyModeChange={setStudyMode}
            onSelectLicence={(licId) => {
              setSelectedLicence(licId);
              if (!licId) setStudyView('study');
            }}
            isPremium={premium}
            activeView={studyView}
            onChangeView={setStudyView}
            onStartMockExam={() => setStudyView('mock-exam')}
          />
        );
      case 'dictionary':
        if (dictionaryView === 'learn' && selectedLicence) {
          return (
            <TermsLearnPage
              language={selectedLanguage}
              licenceId={selectedLicence}
              onExit={() => setDictionaryView('browse')}
            />
          );
        }
        return (
          <DictionaryPage
            language={selectedLanguage}
            licenceId={selectedLicence}
            onStartLearn={() => setDictionaryView('learn')}
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
        <ErrorBoundary>
          {renderPage()}
        </ErrorBoundary>
      </main>
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
