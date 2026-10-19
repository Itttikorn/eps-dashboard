import React from 'react';
import { Search, X, ArrowUpDown } from 'lucide-react';
import { Select } from 'antd';

export type SortField = 'total' | 'overdue' | 'pending';
export type SortDirection = 'asc' | 'desc';

export interface SearchToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortField: SortField;
  onSortFieldChange: (field: SortField) => void;
  sortDir: SortDirection;
  onToggleSortDir: () => void;
  totalFilteredCount: number;
}

export const SearchToolbar: React.FC<SearchToolbarProps> = ({
  searchQuery,
  onSearchChange,
  sortField,
  onSortFieldChange,
  sortDir,
  onToggleSortDir,
  totalFilteredCount,
}) => {
  return (
    <div
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 mb-5 shadow-2xs flex flex-wrap items-center justify-between gap-4 transition-colors"
      data-testid="search-toolbar"
    >
      {/* Search Input with Clear Button */}
      <div className="relative flex-1 min-w-[260px] max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input
          id="searchInput"
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Filter by Project ID, Site Code, or Name..."
          className="w-full pl-9 pr-9 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded"
            aria-label="Clear search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Result Count and Sort Controls */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium hidden sm:inline">
          Showing <strong className="text-slate-800 dark:text-slate-200 tabular-nums">{totalFilteredCount}</strong> projects
        </span>

        <div className="flex items-center gap-1.5 border-l border-slate-200 dark:border-slate-800 pl-3">
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Sort:</span>
          <Select
            value={sortField}
            onChange={onSortFieldChange}
            size="small"
            style={{ width: 140 }}
            options={[
              { value: 'total', label: 'Total Volume' },
              { value: 'overdue', label: 'Overdue Count' },
              { value: 'pending', label: 'Pending %' },
            ]}
          />
          <button
            type="button"
            onClick={onToggleSortDir}
            className="p-1.5 rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
            title={`Direction: ${sortDir.toUpperCase()}`}
            aria-label={`Toggle sort direction, currently ${sortDir}`}
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

