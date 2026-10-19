import React, { useState, useEffect } from 'react';
import { ConfigProvider } from 'antd';
import { getAntdTheme } from './theme/antdTheme';
import { DashboardShell } from './components/layout/DashboardShell';
import { ActiveTabId } from './components/layout/NavigationTabs';
import { OverviewTab } from './features/overview/OverviewTab';
import { TrendTab } from './features/trend/TrendTab';
import { CsvIngestionScreen } from './features/ingestion/CsvIngestionScreen';
import { CsvUploadModal } from './features/ingestion/CsvUploadModal';
import { ErrorBoundary } from './components/ui/ErrorBoundaries';

function getInitialTab(): ActiveTabId {
  const hash = window.location.hash.toLowerCase();
  if (hash === '#view-trends' || hash === '#trends') return 'trends';
  if (hash === '#view-ingest' || hash === '#ingest') return 'ingest';
  return 'overview';
}

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTabId>(getInitialTab);
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('eps_theme') || localStorage.getItem('eps-theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('eps_theme', 'dark');
      localStorage.setItem('eps-theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('eps_theme', 'light');
      localStorage.setItem('eps-theme', 'light');
    }
  }, [isDark]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleMediaChange = (e: MediaQueryListEvent) => {
      const saved = localStorage.getItem('eps_theme') || localStorage.getItem('eps-theme');
      if (!saved) {
        setIsDark(e.matches);
      }
    };
    mediaQuery.addEventListener('change', handleMediaChange);
    return () => mediaQuery.removeEventListener('change', handleMediaChange);
  }, []);

  useEffect(() => {
    const handleHashChange = () => {
      setActiveTab(getInitialTab());
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleTabChange = (tab: ActiveTabId) => {
    setActiveTab(tab);
    const hash = tab === 'overview' ? '#view-overview' : tab === 'trends' ? '#view-trends' : '#view-ingest';
    if (window.location.hash !== hash) {
      window.location.hash = hash;
    }
  };

  return (
    <ConfigProvider theme={getAntdTheme(isDark)}>
      <ErrorBoundary>
        <DashboardShell
          activeTab={activeTab}
          onTabChange={handleTabChange}
          onOpenUploadModal={() => setIsUploadModalOpen(true)}
          isDark={isDark}
          onThemeChange={setIsDark}
        >
          {activeTab === 'overview' && <OverviewTab />}
          {activeTab === 'trends' && <TrendTab />}
          {activeTab === 'ingest' && <CsvIngestionScreen />}
        </DashboardShell>

        <CsvUploadModal
          open={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
        />
      </ErrorBoundary>
    </ConfigProvider>
  );
};

export default App;

