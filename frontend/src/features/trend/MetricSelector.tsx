import React from 'react';
import { TrendMetricType } from '../../api/types';

export interface MetricSelectorProps {
  selectedMetric: TrendMetricType;
  onSelectMetric: (metric: TrendMetricType) => void;
}

export const MetricSelector: React.FC<MetricSelectorProps> = ({
  selectedMetric,
  onSelectMetric,
}) => {
  const metrics: { id: TrendMetricType; label: string }[] = [
    { id: 'total_documents', label: 'Total Volume' },
    { id: 'approved_count', label: 'Approved Volume' },
    { id: 'in_review_count', label: 'In-Review Backlog' },
    { id: 'overdue_count', label: 'Overdue Volume' },
  ];

  return (
    <div className="flex items-center gap-1.5 flex-wrap" data-testid="metric-selector">
      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mr-1 hidden sm:inline">
        Metric:
      </span>
      <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
        {metrics.map((m) => {
          const isSelected = selectedMetric === m.id;

          return (
            <button
              key={m.id}
              type="button"
              onClick={() => onSelectMetric(m.id)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                isSelected
                  ? 'bg-blue-600 text-white font-semibold shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
              data-testid={`metric-radio-${m.id}`}
            >
              {m.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

