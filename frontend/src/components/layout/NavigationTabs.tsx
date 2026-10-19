import React from 'react';
import { BarChart3, TrendingUp, UploadCloud } from 'lucide-react';

export type ActiveTabId = 'overview' | 'trends' | 'ingest';

export interface NavigationTabsProps {
  activeTab: ActiveTabId;
  onTabChange: (tab: ActiveTabId) => void;
}

export const NavigationTabs: React.FC<NavigationTabsProps> = ({
  activeTab,
  onTabChange,
}) => {
  const tabs = [
    {
      id: 'overview' as const,
      label: '(1) QA/QC Comparative Overview',
      icon: BarChart3,
      hash: '#view-overview',
    },
    {
      id: 'trends' as const,
      label: '(2) Trend Analytics',
      icon: TrendingUp,
      hash: '#view-trends',
    },
    {
      id: 'ingest' as const,
      label: '(3) CSV Ingestion',
      icon: UploadCloud,
      hash: '#view-ingest',
    },
  ];

  return (
    <div className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex space-x-2 sm:space-x-8 -mb-px" aria-label="Dashboard Views">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-2 py-3.5 px-3 border-b-2 text-sm font-semibold transition-all ${
                  isActive
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
                data-testid={`tab-${tab.id}`}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

