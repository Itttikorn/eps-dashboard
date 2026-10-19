import React from 'react';

export const CardSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" data-testid="card-skeleton">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white dark:bg-slate-800/80 rounded-lg p-5 border border-slate-200 dark:border-slate-700/60 shadow-sm animate-pulse"
          style={{ minHeight: '120px' }}
        >
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mb-3"></div>
          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-slate-100 dark:bg-slate-700/50 rounded w-2/3"></div>
        </div>
      ))}
    </div>
  );
};

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  return (
    <div
      className="bg-white dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700/60 p-4 shadow-sm animate-pulse"
      data-testid="table-skeleton"
    >
      <div className="h-10 bg-slate-100 dark:bg-slate-700/60 rounded mb-4"></div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 py-3 border-b border-slate-100 dark:border-slate-750">
          <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-1/4"></div>
          <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-1/4"></div>
          <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-1/4"></div>
          <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-1/4"></div>
        </div>
      ))}
    </div>
  );
};

export const ChartSkeleton: React.FC = () => {
  return (
    <div
      className="bg-white dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700/60 p-6 shadow-sm animate-pulse"
      style={{ minHeight: '400px' }}
      data-testid="chart-skeleton"
    >
      <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mb-6"></div>
      <div className="h-64 bg-slate-100 dark:bg-slate-700/40 rounded flex items-end p-4 gap-3">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="bg-slate-200 dark:bg-slate-700 rounded-t flex-1"
            style={{ height: `${20 + (i * 7) % 70}%` }}
          ></div>
        ))}
      </div>
    </div>
  );
};

