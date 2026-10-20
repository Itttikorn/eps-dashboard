import React, { useState } from 'react';
import { useGlobalSummary, useProjectMatrix } from '../../api/queries';
import { TopbarKpiCards } from './TopbarKpiCards';
import { SearchToolbar, SortField, SortDirection } from './SearchToolbar';
import { ProjectMatrixTable } from './ProjectMatrixTable';
import { TableErrorBoundary } from '../../components/ui/ErrorBoundaries';

export const OverviewTab: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('total');
  const [sortDir, setSortDir] = useState<SortDirection>('desc');

  const {
    data: summary,
    isLoading: isSummaryLoading,
    isError: isSummaryError,
    refetch: refetchSummary,
  } = useGlobalSummary();

  const {
    data: projects,
    isLoading: isProjectsLoading,
    isError: isProjectsError,
    refetch: refetchProjects,
  } = useProjectMatrix();

  const handleToggleSortDir = () => {
    setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
  };

  const filteredCount = (projects || []).filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      p.projectId.toLowerCase().includes(q) ||
      p.projectName.toLowerCase().includes(q)
    );
  }).length;

  return (
    <div data-testid="overview-tab">
      {/* 1. Macro Topbar KPI Cards */}
      <TopbarKpiCards
        summary={summary}
        projects={projects || []}
        isLoading={isSummaryLoading}
        isError={isSummaryError}
        onRetry={() => refetchSummary()}
      />

      {/* 2. Search & Sort Toolbar */}
      <SearchToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        sortField={sortField}
        onSortFieldChange={setSortField}
        sortDir={sortDir}
        onToggleSortDir={handleToggleSortDir}
        totalFilteredCount={filteredCount}
      />

      {/* 3. Comparative Matrix Grid with isolated error boundary */}
      <TableErrorBoundary>
        <ProjectMatrixTable
          projects={projects || []}
          isLoading={isProjectsLoading}
          isError={isProjectsError}
          onRetry={() => refetchProjects()}
          searchQuery={searchQuery}
          sortField={sortField}
          sortDir={sortDir}
        />
      </TableErrorBoundary>
    </div>
  );
};

