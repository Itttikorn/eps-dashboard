import React, { useMemo } from 'react';
import { ProjectMatrixRow } from '../../api/types';
import { ProjectCard } from './ProjectCard';
import { TableSkeleton } from '../../components/ui/Skeletons';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorAlert } from '../../components/ui/ErrorAlert';

export interface ProjectMatrixTableProps {
  projects?: ProjectMatrixRow[];
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  searchQuery?: string;
  sortField?: 'total' | 'overdue' | 'pending';
  sortDir?: 'asc' | 'desc';
}

export const ProjectMatrixTable: React.FC<ProjectMatrixTableProps> = ({
  projects = [],
  isLoading = false,
  isError = false,
  onRetry,
  searchQuery = '',
  sortField = 'total',
  sortDir = 'desc',
}) => {
  // Memoized filter and sort
  const filteredProjects = useMemo(() => {
    let result = [...projects];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.projectId.toLowerCase().includes(q) ||
          p.siteCode.toLowerCase().includes(q) ||
          p.projectName.toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      let comparison = 0;
      if (sortField === 'total') {
        comparison = a.totalDocuments - b.totalDocuments;
      } else if (sortField === 'overdue') {
        comparison = a.overdueCount - b.overdueCount;
      } else if (sortField === 'pending') {
        comparison = a.inReviewPercent - b.inReviewPercent;
      }
      return sortDir === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [projects, searchQuery, sortField, sortDir]);

  if (isLoading) {
    return <TableSkeleton rows={4} />;
  }

  if (isError) {
    return (
      <ErrorAlert
        title="Failed to load comparative matrix"
        message="Could not retrieve the project comparative list."
        onRetry={onRetry}
      />
    );
  }

  if (filteredProjects.length === 0) {
    return (
      <EmptyState
        title="No Matching Projects Found"
        description={
          searchQuery
            ? `No projects matched the search term "${searchQuery}". Try adjusting your search query.`
            : 'No projects are currently registered in this portfolio.'
        }
      />
    );
  }

  return (
    <div
      className="grid grid-cols-1 md:grid-cols-2 gap-5"
      style={{ contain: 'layout paint' }}
      data-testid="project-matrix-container"
    >
      {filteredProjects.map((project) => (
        <ProjectCard key={project.projectId} project={project} />
      ))}
    </div>
  );
};

