import React, { useState } from 'react';
import { FileText, AlertTriangle, Clock, Layers, ChevronDown } from 'lucide-react';
import { GlobalSummaryData, ProjectMatrixRow } from '../../api/types';
import { CardSkeleton } from '../../components/ui/Skeletons';
import { ErrorAlert } from '../../components/ui/ErrorAlert';
import { CategoryDetailGrid } from './CategoryDetailGrid';

export interface TopbarKpiCardsProps {
  summary?: GlobalSummaryData;
  projects?: ProjectMatrixRow[];
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
}

export const TopbarKpiCards: React.FC<TopbarKpiCardsProps> = ({
  summary,
  projects = [],
  isLoading = false,
  isError = false,
  onRetry,
}) => {
  const [activeCategory, setActiveCategory] = useState<{
    key: 'baseline' | 'control' | 'corrective' | 'change' | 'complete';
    name: string;
    color: string;
  } | null>(null);

  if (isLoading) {
    return <CardSkeleton count={4} />;
  }

  if (isError) {
    return <ErrorAlert title="Failed to load portfolio totals" onRetry={onRetry} className="mb-6" />;
  }

  const categoryPillars = [
    {
      key: 'baseline' as const,
      name: 'Baseline Drawings',
      color: '#2f6fce',
      count: summary?.categories?.baseline.total,
    },
    {
      key: 'control' as const,
      name: 'Control (ITP/RFI)',
      color: '#12a4a0',
      count: summary?.categories?.control.open,
    },
    {
      key: 'corrective' as const,
      name: 'Corrective (NCR/CAR)',
      color: '#ee8a1f',
      count: summary?.categories?.corrective.open,
    },
    {
      key: 'change' as const,
      name: 'Change (PCR/DCR)',
      color: '#26a65b',
      count: summary?.categories?.change.open,
    },
    {
      key: 'complete' as const,
      name: 'Complete (Punchlist)',
      color: '#8b5cf6',
      count: summary?.categories?.complete.preCommissioning,
    },
  ];

  const toggleCategory = (cat: typeof categoryPillars[number]) => {
    if (activeCategory?.key === cat.key) {
      setActiveCategory(null);
    } else {
      setActiveCategory({ key: cat.key, name: cat.name, color: cat.color });
    }
  };

  return (
    <div className="mb-6" data-testid="topbar-kpi-cards">
      {/* 4 Macro Overview Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {/* Total Documents */}
        <div className="bg-white dark:bg-[#252526] border border-slate-200 dark:border-[#3c3c3c] rounded-xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Portfolio Docs
            </p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-50 tabular-nums">
              {summary ? summary.totalDocuments.toLocaleString() : '—'}
            </h3>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
              Across {summary?.totalProjects ?? 0} active projects
            </p>
          </div>
        </div>

        {/* Overall Backlog */}
        <div className="bg-white dark:bg-[#252526] border border-slate-200 dark:border-[#3c3c3c] rounded-xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Backlog / In-Review
            </p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-50 tabular-nums">
              {summary ? summary.overallBacklog.toLocaleString() : '—'}
            </h3>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
              Awaiting review or sign-off
            </p>
          </div>
        </div>

        {/* Overdue Volume & Rate */}
        <div className="bg-white dark:bg-[#252526] border border-slate-200 dark:border-[#3c3c3c] rounded-xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Overdue Documents
            </p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-50 tabular-nums">
                {summary ? summary.totalOverdue.toLocaleString() : '—'}
              </h3>
              <span className="text-xs font-bold text-red-600 dark:text-red-400 tabular-nums">
                ({summary ? summary.overdueRatePercent.toFixed(1) : 0}%)
              </span>
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
              Target SLA threshold &lt; 5.0%
            </p>
          </div>
        </div>

        {/* Active Pillars Overview */}
        <div className="bg-white dark:bg-[#252526] border border-slate-200 dark:border-[#3c3c3c] rounded-xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              5 QA/QC Pillars
            </p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-50 tabular-nums">
              5 / 5 Active
            </h3>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
              Click pillars below for detail
            </p>
          </div>
        </div>
      </div>

      {/* 5 QA/QC Lifecycle Pillar Pills with .kpi-detail toggles */}
      <div className="bg-white dark:bg-[#252526] border border-slate-200 dark:border-[#3c3c3c] rounded-xl p-4 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
            Lifecycle Pillars:
          </span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:inline">
            Click any pillar to toggle project contribution drawer
          </span>
        </div>

        <div className="flex flex-wrap gap-2.5">
          {categoryPillars.map((cat) => {
            const isActive = activeCategory?.key === cat.key;

            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => toggleCategory(cat)}
                style={{
                  borderColor: isActive ? cat.color : undefined,
                  backgroundColor: isActive ? `${cat.color}25` : undefined,
                }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs transition-all ${
                  isActive
                    ? 'font-bold shadow-xs text-slate-900 dark:text-white border-2'
                    : 'border-slate-200 dark:border-[#3c3c3c] bg-slate-50 dark:bg-[#1e1e1e] text-slate-700 dark:text-slate-200 hover:border-slate-400 dark:hover:border-slate-500 hover:bg-slate-100 dark:hover:bg-[#2a2d2e]'
                }`}
                data-testid={`pillar-pill-${cat.key}`}
              >
                <span className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs" style={{ backgroundColor: cat.color }} />
                <span className="font-semibold">{cat.name}</span>
                <span
                  className={`text-[11px] font-bold tabular-nums ${
                    isActive ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-300'
                  }`}
                >
                  ({cat.count !== undefined ? cat.count : '—'})
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    isActive ? 'rotate-180' : 'text-slate-400 dark:text-slate-400'
                  }`}
                  style={{ color: isActive ? cat.color : undefined }}
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* Expandable Project Breakdown Drawer */}
      <CategoryDetailGrid
        categoryKey={activeCategory?.key ?? null}
        categoryName={activeCategory?.name ?? ''}
        categoryColor={activeCategory?.color ?? '#2f6fce'}
        projects={projects}
        onClose={() => setActiveCategory(null)}
      />
    </div>
  );
};

