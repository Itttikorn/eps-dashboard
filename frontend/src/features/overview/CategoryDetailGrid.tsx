import React from 'react';
import { X } from 'lucide-react';
import { ProjectMatrixRow } from '../../api/types';

export interface CategoryDetailGridProps {
  categoryKey: 'baseline' | 'control' | 'corrective' | 'change' | 'complete' | null;
  categoryName: string;
  categoryColor: string;
  projects: ProjectMatrixRow[];
  onClose: () => void;
}

export const CategoryDetailGrid: React.FC<CategoryDetailGridProps> = ({
  categoryKey,
  categoryName,
  categoryColor,
  projects,
  onClose,
}) => {
  if (!categoryKey) return null;

  return (
    <div
      className="bg-white dark:bg-[#252526] border border-slate-200 dark:border-[#3c3c3c] rounded-xl p-5 mb-6 shadow-sm kpi-detail transition-all duration-300"
      data-testid="category-detail-grid"
    >
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#3c3c3c] mb-4">
        <div className="flex items-center gap-2.5">
          <span
            className="w-3.5 h-3.5 rounded-full shrink-0"
            style={{ backgroundColor: categoryColor }}
          />
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide">
            {categoryName} — Project Contribution Breakdown
          </h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#2a2d2e] transition-colors"
          aria-label="Close detail breakdown"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {projects.map((proj) => {
          const pillar = proj.pillars[categoryKey];

          return (
            <div
              key={proj.projectId}
              className="p-3.5 rounded-lg border border-slate-200/70 dark:border-[#3c3c3c] bg-slate-50/70 dark:bg-[#1e1e1e] flex flex-col justify-between"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate" title={proj.projectName}>
                    {proj.projectName}
                  </h4>
                  <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                    {proj.projectId}
                  </span>
                </div>
                {pillar.isCritical && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-700 dark:bg-red-950/80 dark:text-red-300 border border-red-300 dark:border-red-800 animate-pulse">
                    CRITICAL
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200/60 dark:border-[#3c3c3c]">
                <span className="text-slate-500 dark:text-slate-400">Total Volume:</span>
                <span className="font-bold tabular-nums text-slate-800 dark:text-slate-200">
                  {pillar.total}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs mt-1">
                <span className="text-slate-500 dark:text-slate-400">Pending %:</span>
                <span
                  className={`font-bold tabular-nums ${
                    pillar.isCritical ? 'text-red-600 dark:text-red-400' : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {pillar.pendingPercent.toFixed(1)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
