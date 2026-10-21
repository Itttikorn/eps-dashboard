import React, { useState, useMemo } from 'react';
import { useGlobalSummary, useProjectMatrix } from '../../api/queries';
import { TopbarKpiCards } from './TopbarKpiCards';
import { SearchToolbar, SortField, SortDirection, HealthFilter } from './SearchToolbar';
import { ProjectMatrixTable } from './ProjectMatrixTable';
import { TableErrorBoundary } from '../../components/ui/ErrorBoundaries';
import { useDebouncedValue } from '../../lib/useDebouncedValue';

export const OverviewTab: React.FC = () => {
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [healthFilter, setHealthFilter] = useState<HealthFilter>('all');
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [sortField, setSortField] = useState<SortField>('total');
  const [sortDir, setSortDir] = useState<SortDirection>('desc');

  const {
    data: summary,
    isLoading: isSummaryLoading,
    isError: isSummaryError,
    refetch: refetchSummary,
  } = useGlobalSummary();

  const {
    data: projects = [],
    isLoading: isProjectsLoading,
    isError: isProjectsError,
    refetch: refetchProjects,
  } = useProjectMatrix();

  const handleToggleSortDir = () => {
    setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
  };

  const handleToggleProject = (projectId: string) => {
    setSelectedProjectIds((prev) =>
      prev.includes(projectId)
        ? prev.filter((id) => id !== projectId)
        : [...prev, projectId]
    );
  };

  const handleResetFilters = () => {
    setSelectedProjectIds([]);
    setSearchQuery('');
    setHealthFilter('all');
    setOverdueOnly(false);
  };

  const debouncedSearch = useDebouncedValue(searchQuery, 200);

  // Matrix table filtered count is determined by explicit selections, filters, and debounced search
  const filteredCount = useMemo(() => {
    let list = projects;

    if (selectedProjectIds.length > 0) {
      const idSet = new Set(selectedProjectIds);
      list = list.filter((p) => idSet.has(p.projectId));
    }

    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase().trim();
      list = list.filter(
        (p) => p.projectId.toLowerCase().includes(q) || p.projectName.toLowerCase().includes(q)
      );
    }

    if (healthFilter !== 'all') {
      list = list.filter((p) => p.healthStatus === healthFilter);
    }

    if (overdueOnly) {
      list = list.filter((p) => p.overdueCount > 0);
    }

    return list.length;
  }, [projects, selectedProjectIds, debouncedSearch, healthFilter, overdueOnly]);

  return (
    <div data-testid="overview-tab">
      {/* 1. Macro Topbar KPI Cards */}
      <TopbarKpiCards
        summary={summary}
        projects={projects}
        isLoading={isSummaryLoading}
        isError={isSummaryError}
        onRetry={() => refetchSummary()}
      />

      {/* 2. Search & Project Selector Toolbar with Autocomplete & Smart Filters */}
      <SearchToolbar
        projects={projects}
        selectedProjectIds={selectedProjectIds}
        onToggleProject={handleToggleProject}
        onSelectProjects={setSelectedProjectIds}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        healthFilter={healthFilter}
        onHealthFilterChange={setHealthFilter}
        overdueOnly={overdueOnly}
        onToggleOverdueOnly={() => setOverdueOnly((prev) => !prev)}
        sortField={sortField}
        onSortFieldChange={setSortField}
        sortDir={sortDir}
        onToggleSortDir={handleToggleSortDir}
        totalFilteredCount={filteredCount}
        totalProjectsCount={projects.length}
        onResetFilters={handleResetFilters}
      />

      {/* 3. Comparative Matrix Grid (Filtered by user selection, filters, and debounced search) */}
      <TableErrorBoundary>
        <ProjectMatrixTable
          projects={projects}
          selectedProjectIds={selectedProjectIds}
          searchQuery={debouncedSearch}
          healthFilter={healthFilter}
          overdueOnly={overdueOnly}
          sortField={sortField}
          sortDir={sortDir}
          isLoading={isProjectsLoading}
          isError={isProjectsError}
          onRetry={() => refetchProjects()}
        />
      </TableErrorBoundary>
    </div>
  );
};
