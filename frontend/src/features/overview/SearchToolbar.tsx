import React, { useState, useRef, useEffect } from 'react';
import { Search, X, ArrowUpDown, Check, RotateCcw, AlertCircle, Clock } from 'lucide-react';
import { Select } from 'antd';
import { ProjectMatrixRow, HealthStatus } from '../../api/types';

export type SortField = 'total' | 'overdue' | 'pending' | 'name' | 'health';
export type SortDirection = 'asc' | 'desc';
export type HealthFilter = 'all' | HealthStatus;

export interface SearchToolbarProps {
  projects?: ProjectMatrixRow[];
  selectedProjectIds?: string[];
  onToggleProject?: (projectId: string) => void;
  onSelectProjects?: (projectIds: string[]) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  healthFilter?: HealthFilter;
  onHealthFilterChange?: (filter: HealthFilter) => void;
  overdueOnly?: boolean;
  onToggleOverdueOnly?: () => void;
  sortField: SortField;
  onSortFieldChange: (field: SortField) => void;
  sortDir: SortDirection;
  onToggleSortDir: () => void;
  totalFilteredCount: number;
  totalProjectsCount?: number;
  onResetFilters?: () => void;
}

export const SearchToolbar: React.FC<SearchToolbarProps> = ({
  projects = [],
  selectedProjectIds = [],
  onToggleProject,
  onSelectProjects,
  searchQuery,
  onSearchChange,
  healthFilter = 'all',
  onHealthFilterChange,
  overdueOnly = false,
  onToggleOverdueOnly,
  sortField,
  onSortFieldChange,
  sortDir,
  onToggleSortDir,
  totalFilteredCount,
  totalProjectsCount,
  onResetFilters,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close autocomplete on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter projects for autocomplete dropdown
  const matchingProjects = projects.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      p.projectId.toLowerCase().includes(q) ||
      p.projectName.toLowerCase().includes(q)
    );
  });

  // Calculate macro health counts
  const criticalCount = projects.filter((p) => p.healthStatus === 'CRITICAL').length;
  const attentionCount = projects.filter((p) => p.healthStatus === 'ATTENTION').length;
  const onTrackCount = projects.filter((p) => p.healthStatus === 'ON TRACK').length;
  const overdueCount = projects.filter((p) => p.overdueCount > 0).length;

  const isAnyFilterActive =
    searchQuery.trim() !== '' ||
    selectedProjectIds.length > 0 ||
    healthFilter !== 'all' ||
    overdueOnly;

  return (
    <div
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 mb-5 shadow-2xs space-y-3.5"
      data-testid="search-toolbar"
    >
      {/* Top Row: Search Autocomplete & Sort Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Search Combobox with Autocomplete Popover */}
        <div ref={containerRef} className="relative flex-1 min-w-70 max-w-lg">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10" />
          <input
            id="searchInput"
            type="text"
            value={searchQuery}
            onFocus={() => setIsDropdownOpen(true)}
            onChange={(e) => {
              onSearchChange(e.target.value);
              setIsDropdownOpen(true);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setIsDropdownOpen(false);
              } else if (e.key === 'Enter' && isDropdownOpen && matchingProjects.length > 0) {
                const firstProj = matchingProjects[0];
                if (firstProj) {
                  e.preventDefault();
                  onToggleProject?.(firstProj.projectId);
                }
              }
            }}
            placeholder="Filter by Project ID or Name..."
            autoComplete="off"
            className="w-full pl-9 pr-9 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded z-10"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Autocomplete Dropdown */}
          {isDropdownOpen && projects.length > 0 && (
            <div
              className="absolute left-0 right-0 top-full mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden text-xs animate-in fade-in slide-in-from-top-1 duration-150"
              data-testid="search-autocomplete-dropdown"
            >
              {/* Dropdown Quick Actions Bar */}
              <div className="p-2.5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between text-[11px]">
                <span className="font-semibold text-slate-600 dark:text-slate-300">
                  Projects ({matchingProjects.length})
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onSelectProjects?.(projects.map((p) => p.projectId));
                    }}
                    className="text-blue-600 dark:text-blue-400 hover:underline font-semibold"
                  >
                    Select All
                  </button>
                  <span className="text-slate-300 dark:text-slate-600">•</span>
                  <button
                    type="button"
                    onClick={() => {
                      const criticalIds = projects
                        .filter((p) => p.healthStatus === 'CRITICAL')
                        .map((p) => p.projectId);
                      onSelectProjects?.(criticalIds);
                    }}
                    className="text-rose-600 dark:text-rose-400 hover:underline font-semibold"
                  >
                    Critical Only
                  </button>
                  <span className="text-slate-300 dark:text-slate-600">•</span>
                  <button
                    type="button"
                    onClick={() => onSelectProjects?.([])}
                    className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:underline font-semibold"
                  >
                    Clear Selection
                  </button>
                </div>
              </div>

              {/* Scrollable Project Items */}
              <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                {matchingProjects.length === 0 ? (
                  <div className="p-4 text-center text-slate-400 dark:text-slate-500 italic">
                    No matching projects found
                  </div>
                ) : (
                  matchingProjects.map((proj) => {
                    const isSelected = selectedProjectIds.includes(proj.projectId);
                    return (
                      <div
                        key={proj.projectId}
                        onClick={() => onToggleProject?.(proj.projectId)}
                        className={`flex items-center justify-between p-2.5 cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-blue-50/70 dark:bg-blue-950/40'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                        }`}
                        data-testid={`autocomplete-item-${proj.projectId}`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 pr-2">
                          <div
                            className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                              isSelected
                                ? 'bg-blue-600 border-blue-600 text-white'
                                : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3 stroke-3" />}
                          </div>

                          <div className="min-w-0">
                            <div className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                              {proj.projectName}
                            </div>
                            <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                              {proj.projectId} · {proj.totalDocuments.toLocaleString()} documents
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {proj.overdueCount > 0 && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
                              {proj.overdueCount} overdue
                            </span>
                          )}
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
                              proj.healthStatus === 'CRITICAL'
                                ? 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950 dark:text-rose-200 dark:border-rose-800'
                                : proj.healthStatus === 'ATTENTION'
                                ? 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-800'
                                : 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-800'
                            }`}
                          >
                            {proj.healthStatus === 'CRITICAL'
                              ? '🔴 CRITICAL'
                              : proj.healthStatus === 'ATTENTION'
                              ? '🟡 ATTENTION'
                              : '🟢 ON TRACK'}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Dropdown Footer */}
              <div className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 dark:text-slate-500 flex justify-between">
                <span>Click or press Enter to select/deselect projects</span>
                <span>Press Esc to close</span>
              </div>
            </div>
          )}
        </div>

        {/* Sort Controls & Count */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium hidden sm:inline">
            Showing <strong className="text-slate-800 dark:text-slate-200 tabular-nums">{totalFilteredCount}</strong>
            {totalProjectsCount ? ` of ${totalProjectsCount}` : ''} projects
          </span>

          <div className="flex items-center gap-1.5 border-l border-slate-200 dark:border-slate-800 pl-3">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Sort:</span>
            <Select
              value={sortField}
              onChange={onSortFieldChange}
              size="small"
              style={{ width: 145 }}
              options={[
                { value: 'total', label: 'Total Volume' },
                { value: 'overdue', label: 'Overdue Count' },
                { value: 'pending', label: 'Pending %' },
                { value: 'name', label: 'Project Name (A-Z)' },
                { value: 'health', label: 'Health Status' },
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

      {/* Middle Row: Quick Filter Presets (Health Status & Overdue Toggle) */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1 border-t border-slate-100 dark:border-slate-800/80">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mr-1 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            Health:
          </span>

          <button
            type="button"
            onClick={() => onHealthFilterChange?.('all')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
              healthFilter === 'all'
                ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900 shadow-2xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            All
          </button>

          <button
            type="button"
            onClick={() => onHealthFilterChange?.('CRITICAL')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors ${
              healthFilter === 'CRITICAL'
                ? 'bg-rose-600 text-white shadow-2xs'
                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 hover:bg-rose-100 dark:hover:bg-rose-950/70'
            }`}
          >
            <span>🔴 Critical</span>
            {criticalCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-white/20">
                {criticalCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => onHealthFilterChange?.('ATTENTION')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors ${
              healthFilter === 'ATTENTION'
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900 hover:bg-amber-100 dark:hover:bg-amber-950/70'
            }`}
          >
            <span>🟡 Attention</span>
            {attentionCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-white/20">
                {attentionCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => onHealthFilterChange?.('ON TRACK')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors ${
              healthFilter === 'ON TRACK'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900 hover:bg-emerald-100 dark:hover:bg-emerald-950/70'
            }`}
          >
            <span>🟢 On Track</span>
            {onTrackCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-white/20">
                {onTrackCount}
              </span>
            )}
          </button>

          <span className="text-slate-300 dark:text-slate-700 mx-1">|</span>

          {/* Overdue Only Filter */}
          <button
            type="button"
            onClick={onToggleOverdueOnly}
            className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors ${
              overdueOnly
                ? 'bg-red-600 text-white shadow-2xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Overdue Only</span>
            {overdueCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-white/20">
                {overdueCount}
              </span>
            )}
          </button>
        </div>

        {/* Reset Active Filters Button */}
        {isAnyFilterActive && (
          <button
            type="button"
            onClick={onResetFilters}
            className="text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Filters</span>
          </button>
        )}
      </div>

      {/* Selected Project Chips Row */}
      {selectedProjectIds.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100 dark:border-slate-800">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            Selected Projects ({selectedProjectIds.length}):
          </span>
          {selectedProjectIds.map((id) => {
            const p = projects.find((proj) => proj.projectId === id);
            const healthDot =
              p?.healthStatus === 'CRITICAL'
                ? '🔴'
                : p?.healthStatus === 'ATTENTION'
                ? '🟡'
                : '🟢';
            return (
              <span
                key={id}
                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-200 shadow-2xs"
              >
                <span className="text-[10px]">{healthDot}</span>
                <span className="font-semibold truncate max-w-40">
                  {p?.projectName || id}
                </span>
                <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400">
                  ({id})
                </span>
                <button
                  type="button"
                  onClick={() => onToggleProject?.(id)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 ml-0.5 p-0.5 rounded"
                  aria-label={`Remove ${id}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            );
          })}
          <button
            type="button"
            onClick={() => onSelectProjects?.([])}
            className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-medium ml-1"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
};
