import React, { ReactNode } from 'react';
import { HeaderNav } from './HeaderNav';
import { NavigationTabs, ActiveTabId } from './NavigationTabs';

export interface DashboardShellProps {
  activeTab: ActiveTabId;
  onTabChange: (tab: ActiveTabId) => void;
  onOpenUploadModal: () => void;
  isDark?: boolean;
  onThemeChange?: (isDark: boolean) => void;
  children: ReactNode;
}

export const DashboardShell: React.FC<DashboardShellProps> = ({
  activeTab,
  onTabChange,
  onOpenUploadModal,
  isDark,
  onThemeChange,
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

      {/* 3. Main Tab View Slot */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
    </div>
  );
};

