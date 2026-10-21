import React, { useState, useEffect, useRef, useMemo, Suspense, lazy } from 'react';
import { ConfigProvider } from 'antd';
import { getAntdTheme } from './theme/antdTheme';
import { applyTheme, getInitialTheme } from './theme/themeTransition';
import { DashboardShell } from './components/layout/DashboardShell';
import { ActiveTabId } from './components/layout/NavigationTabs';
import { OverviewTab } from './features/overview/OverviewTab';
import { ChartSkeleton } from './components/ui/Skeletons';
import { ErrorBoundary } from './components/ui/ErrorBoundaries';

const TrendTab = lazy(() =>
  import('./features/trend/TrendTab').then((m) => ({ default: m.TrendTab }))
);
const CsvIngestionScreen = lazy(() =>
  import('./features/ingestion/CsvIngestionScreen').then((m) => ({ default: m.CsvIngestionScreen }))
);
const CsvUploadModal = lazy(() =>
  import('./features/ingestion/CsvUploadModal').then((m) => ({ default: m.CsvUploadModal }))
);

function getInitialTab(): ActiveTabId {
  const hash = window.location.hash.toLowerCase();
  if (hash === '#view-trends' || hash === '#trends') return 'trends';
  if (hash === '#view-ingest' || hash === '#ingest') return 'ingest';
  return 'overview';
}

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTabId>(getInitialTab);
  const [isDark, setIsDark] = useState<boolean>(getInitialTheme);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const isFirstMount = useRef(true);
  const hasUserExplicitChoice = useRef(
    Boolean(localStorage.getItem('eps_theme') || localStorage.getItem('eps-theme'))
  );

  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      applyTheme(isDark, false, hasUserExplicitChoice.current);
      return;
    }
    applyTheme(isDark, true, hasUserExplicitChoice.current);
  }, [isDark]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleMediaChange = (e: MediaQueryListEvent) => {
      if (!hasUserExplicitChoice.current) {
        setIsDark(e.matches);
      }
    };
    mediaQuery.addEventListener('change', handleMediaChange);
    return () => mediaQuery.removeEventListener('change', handleMediaChange);
  }, []);

  const handleThemeChange = (nextDark: boolean) => {
    hasUserExplicitChoice.current = true;
    setIsDark(nextDark);
  };

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

  const antdThemeConfig = useMemo(() => getAntdTheme(isDark), [isDark]);

  return (
    <ConfigProvider theme={antdThemeConfig}>
      <ErrorBoundary>
        <DashboardShell
          activeTab={activeTab}
          onTabChange={handleTabChange}
          onOpenUploadModal={() => setIsUploadModalOpen(true)}
          isDark={isDark}
          onThemeChange={handleThemeChange}
        >
          <Suspense fallback={<ChartSkeleton />}>
            {activeTab === 'overview' && <OverviewTab />}
            {activeTab === 'trends' && <TrendTab />}
            {activeTab === 'ingest' && <CsvIngestionScreen />}
          </Suspense>
        </DashboardShell>

        <Suspense fallback={null}>
          {isUploadModalOpen && (
            <CsvUploadModal
              open={isUploadModalOpen}
              onClose={() => setIsUploadModalOpen(false)}
            />
          )}
        </Suspense>
      </ErrorBoundary>
    </ConfigProvider>
  );
};

export default App;

