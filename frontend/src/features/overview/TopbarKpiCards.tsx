import React from 'react';
import { FileText, AlertTriangle, Clock } from 'lucide-react';
import { GlobalSummaryData, ProjectMatrixRow } from '../../api/types';
import { CardSkeleton } from '../../components/ui/Skeletons';
import { ErrorAlert } from '../../components/ui/ErrorAlert';

export interface TopbarKpiCardsProps {
  summary?: GlobalSummaryData;
  projects?: ProjectMatrixRow[];
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
}

export const TopbarKpiCards: React.FC<TopbarKpiCardsProps> = ({
  summary,
  isLoading = false,
  isError = false,
  onRetry,
}) => {
  if (isLoading) {
    return <CardSkeleton count={3} />;
  }

  if (isError) {
    return <ErrorAlert title="Failed to load portfolio totals" onRetry={onRetry} className="mb-6" />;
  }

  const isOverdueActive = (summary?.overdueRatePercent ?? 0) > 0;

  return (
    <div className="mb-6" data-testid="topbar-kpi-cards">
      {/* 3 Macro Overview Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
              <span
                data-testid="overdue-percentage"
                className={`text-xs font-bold tabular-nums ${
                  isOverdueActive
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-slate-400 dark:text-slate-500'
                }`}
              >
                ({summary ? summary.overdueRatePercent.toFixed(1) : 0}%)
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
