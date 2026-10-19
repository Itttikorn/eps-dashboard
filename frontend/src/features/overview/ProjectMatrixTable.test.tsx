import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProjectMatrixTable } from './ProjectMatrixTable';
import { ProjectMatrixRow } from '../../api/types';

const mockProjects: ProjectMatrixRow[] = [
  {
    projectId: 'PRJ-01',
    projectCode: 'RYG-A',
    projectName: 'Rayong Complex',
    siteCode: 'RYG-A',
    healthStatus: 'ON TRACK',
    totalDocuments: 1000,
    approvedCount: 900,
    approvedPercent: 90,
    inReviewCount: 80,
    inReviewPercent: 8,
    overdueCount: 20,
    overduePercent: 2,
    netChange: 'IMPROVING',
    lastSnapshotDate: '2026-03-31',
    pillars: {
      baseline: { total: 400, approved: 360, inReview: 40, overdue: 5, approvedPercent: 90, pendingPercent: 10, isCritical: false },
      control: { total: 200, open: 10, closed: 190, pendingPercent: 5, isCritical: false },
      corrective: { total: 100, open: 10, closed: 90, pendingPercent: 10, isCritical: false },
      change: { total: 150, open: 10, closed: 140, pendingPercent: 6.7, isCritical: false },
      complete: { total: 150, open: 10, closed: 140, pendingPercent: 6.7, isCritical: false },
    },
    disciplines: {
      me: { total: 400, approved: 360 },
      ce: { total: 300, approved: 270 },
      ee: { total: 300, approved: 270 },
    },
    drawingTypes: ['GAD', 'ISO'],
    pendingAgingDays: 7,
  },
  {
    projectId: 'PRJ-02',
    projectCode: 'BKK-1',
    projectName: 'Bangkok Center',
    siteCode: 'BKK-1',
    healthStatus: 'CRITICAL',
    totalDocuments: 2000,
    approvedCount: 1000,
    approvedPercent: 50,
    inReviewCount: 950,
    inReviewPercent: 47.5,
    overdueCount: 50,
    overduePercent: 2.5,
    netChange: 'DEGRADING',
    lastSnapshotDate: '2026-03-31',
    pillars: {
      baseline: { total: 800, approved: 400, inReview: 400, overdue: 20, approvedPercent: 50, pendingPercent: 50, isCritical: true },
      control: { total: 400, open: 200, closed: 200, pendingPercent: 50, isCritical: true },
      corrective: { total: 200, open: 100, closed: 100, pendingPercent: 50, isCritical: true },
      change: { total: 300, open: 150, closed: 150, pendingPercent: 50, isCritical: true },
      complete: { total: 300, open: 100, closed: 200, pendingPercent: 33.3, isCritical: false },
    },
    disciplines: {
      me: { total: 800, approved: 400 },
      ce: { total: 600, approved: 300 },
      ee: { total: 600, approved: 300 },
    },
    drawingTypes: ['GAD', 'PID'],
    pendingAgingDays: 35,
  },
];

describe('ProjectMatrixTable Component', () => {
  it('renders skeleton rows when loading', () => {
    render(<ProjectMatrixTable isLoading={true} />);
    expect(screen.getByTestId('table-skeleton')).toBeInTheDocument();
  });

  it('renders error state when isError is true', () => {
    const handleRetry = vi.fn();
    render(<ProjectMatrixTable isError={true} onRetry={handleRetry} />);
    expect(screen.getByText('Failed to load comparative matrix')).toBeInTheDocument();
  });

  it('renders empty state when filtered list has no items', () => {
    render(
      <ProjectMatrixTable
        projects={mockProjects}
        searchQuery="NON_EXISTENT_QUERY"
      />
    );
    expect(screen.getByText('No Matching Projects Found')).toBeInTheDocument();
  });

  it('renders project cards filtered by search query', () => {
    render(
      <ProjectMatrixTable
        projects={mockProjects}
        searchQuery="Bangkok"
      />
    );
    expect(screen.getByText('Bangkok Center')).toBeInTheDocument();
    expect(screen.queryByText('Rayong Complex')).not.toBeInTheDocument();
  });

  it('renders all projects when no search query is specified', () => {
    render(<ProjectMatrixTable projects={mockProjects} />);
    expect(screen.getByText('Rayong Complex')).toBeInTheDocument();
    expect(screen.getByText('Bangkok Center')).toBeInTheDocument();
  });
});

