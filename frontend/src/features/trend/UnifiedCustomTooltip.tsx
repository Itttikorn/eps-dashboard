import React from 'react';
import { formatDate } from '../../lib/format';

export interface UnifiedCustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
    strokeDasharray?: string;
  }>;
  label?: string;
  metricLabel?: string;
}

export const UnifiedCustomTooltip: React.FC<UnifiedCustomTooltipProps> = ({
  active,
  payload,
  label,
  metricLabel = 'Volume',
}) => {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  return (
    <div
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 shadow-lg text-xs min-w-[200px]"
      data-testid="unified-trend-tooltip"
    >
      <div className="font-bold text-slate-800 dark:text-slate-100 pb-2 mb-2 border-b border-slate-100 dark:border-slate-800">
        {formatDate(label)}
      </div>

      <div className="space-y-1.5">
        {payload.map((entry, index) => (
          <div key={`item-${index}`} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 truncate max-w-[150px]">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: entry.color }}
              />
              <span className="font-medium text-slate-700 dark:text-slate-300 truncate" title={entry.name}>
                {entry.name}
              </span>
            </div>
            <span className="font-bold tabular-nums text-slate-900 dark:text-slate-100">
              {entry.value !== undefined ? entry.value.toLocaleString() : '—'}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[10px] text-slate-400">
        Metric: {metricLabel}
      </div>
    </div>
  );
};

