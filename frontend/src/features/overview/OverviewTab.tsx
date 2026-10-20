import React, { useState, useMemo } from 'react';
import { useGlobalSummary, useProjectMatrix } from '../../api/queries';
import { TopbarKpiCards } from './TopbarKpiCards';
import { SearchToolbar, SortField, SortDirection, HealthFilter } from './SearchToolbar';
import { ProjectMatrixTable } from './ProjectMatrixTable';
import { TableErrorBoundary } from '../../components/ui/ErrorBoundaries';

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

  // Matrix table filtered count is determined strictly by explicit selections and filters
  const filteredCount = useMemo(() => {
    let list = projects;

    if (selectedProjectIds.length > 0) {
      const idSet = new Set(selectedProjectIds);
      list = list.filter((p) => idSet.has(p.projectId));
    }

    if (healthFilter !== 'all') {
      list = list.filter((p) => p.healthStatus === healthFilter);
    }

    if (overdueOnly) {
      list = list.filter((p) => p.overdueCount > 0);
    }

    return list.length;
  }, [projects, selectedProjectIds, healthFilter, overdueOnly]);

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

      {/* 3. Comparative Matrix Grid (Filtered only by user selection / filters, not raw search typing) */}
      <TableErrorBoundary>
        <ProjectMatrixTable
          projects={projects}
          selectedProjectIds={selectedProjectIds}
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
