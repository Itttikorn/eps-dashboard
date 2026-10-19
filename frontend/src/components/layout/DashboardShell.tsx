import React, { ReactNode } from 'react';
import { HeaderNav } from './HeaderNav';
import { NavigationTabs, ActiveTabId } from './NavigationTabs';
import { GlobalFilterBar } from './GlobalFilterBar';

export interface DashboardShellProps {
  activeTab: ActiveTabId;
  onTabChange: (tab: ActiveTabId) => void;
  onOpenUploadModal: () => void;
  isDark?: boolean;
  onThemeChange?: (isDark: boolean) => void;
  allProjects?: { id: string; name: string }[];
  selectedProjectIds?: string[];
  onSelectProjectIds?: (ids: string[]) => void;
  snapshotDate?: string;
  onSnapshotDateChange?: (date: string) => void;
  children: ReactNode;
}

export const DashboardShell: React.FC<DashboardShellProps> = ({
  activeTab,
  onTabChange,
  onOpenUploadModal,
  isDark,
  onThemeChange,
  allProjects = [],
  selectedProjectIds = [],
  onSelectProjectIds = () => {},
  snapshotDate = '2026-03-31',
  onSnapshotDateChange = () => {},
  children,
}) => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* 1. Corporate Dark-Navy Header */}
      <HeaderNav
        onOpenUploadModal={onOpenUploadModal}
        isDark={isDark}
        onThemeChange={onThemeChange}
      />

      {/* 2. Global Navigation Tabs */}
      <NavigationTabs activeTab={activeTab} onTabChange={onTabChange} />

      {/* 3. Global Filter Bar (shown on Overview and Trends tabs) */}
      {activeTab !== 'ingest' && (
        <GlobalFilterBar
          allProjects={allProjects}
          selectedProjectIds={selectedProjectIds}
          onSelectProjectIds={onSelectProjectIds}
          snapshotDate={snapshotDate}
          onSnapshotDateChange={onSnapshotDateChange}
        />
      )}

      {/* 4. Main Tab View Slot */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
    </div>
  );
};

