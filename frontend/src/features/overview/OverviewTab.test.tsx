import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { OverviewTab } from './OverviewTab';
import * as queries from '../../api/queries';
import { GlobalSummaryData, ProjectMatrixRow } from '../../api/types';

vi.mock('../../api/queries', async () => {
  const actual = await vi.importActual<typeof queries>('../../api/queries');
  return {
    ...actual,
    useGlobalSummary: vi.fn(),
    useProjectMatrix: vi.fn(),
  };
});

const mockSummary: GlobalSummaryData = {
  totalProjects: 2,
  totalDocuments: 200,
  overallBacklog: 25,
  totalOverdue: 10,
  overdueRatePercent: 5,
  categories: null,
  lastUpdatedAt: null,
};

const mockProjects: ProjectMatrixRow[] = [
  {
    projectId: 'PRJ-01',
    projectCode: 'SKK-01',
    projectName: 'Alpha Olefins Revamp',
    healthStatus: 'CRITICAL',
    totalDocuments: 120,
    approvedCount: 60,
    approvedPercent: 50,
    inReviewCount: 45,
    inReviewPercent: 37.5,
    overdueCount: 15,
    overduePercent: 12.5,
    netChange: 'DEGRADING',
    lastSnapshotDate: '2026-03-31',
    pillars: {
      baseline: { total: 50, approved: 25, inReview: 20, overdue: 5, approvedPercent: 50, pendingPercent: 40, isCritical: true },
      control: { total: 20, open: 5, closed: 15, overdue: 0, pendingPercent: 25, isCritical: false },
      corrective: { total: 10, open: 2, closed: 8, overdue: 0, pendingPercent: 20, isCritical: false },
      ncr: { total: 10, open: 2, closed: 8, overdue: 0, pendingPercent: 20, isCritical: false },
      car: { total: 10, open: 2, closed: 8, overdue: 0, pendingPercent: 20, isCritical: false },
      change: { total: 15, open: 5, closed: 10, overdue: 0, pendingPercent: 33.3, isCritical: false },
      fcr: { total: 10, open: 2, closed: 8, overdue: 0, pendingPercent: 20, isCritical: false },
      dcr: { total: 5, open: 1, closed: 4, overdue: 0, pendingPercent: 20, isCritical: false },
      vor: { total: 5, open: 1, closed: 4, overdue: 0, pendingPercent: 20, isCritical: false },
      complete: { total: 5, open: 1, closed: 4, overdue: 0, pendingPercent: 20, isCritical: false },
    },
    disciplines: {
      me: { total: 50, approved: 25, underReview: 20, overdue: 5 },
      ce: { total: 40, approved: 20, underReview: 15, overdue: 5 },
      ee: { total: 30, approved: 15, underReview: 10, overdue: 5 },
    },
    itpSubmissions: {
      me: true,
      ce: true,
      ee: false,
    },
    drawingTypes: ['GAD'],
    pendingAgingDays: 7,
  },
  {
    projectId: 'PRJ-02',
    projectCode: 'RYG-02',
    projectName: 'Beta Polyethylene Plant',
    healthStatus: 'ATTENTION',
    totalDocuments: 80,
    approvedCount: 70,
    approvedPercent: 87.5,
    inReviewCount: 10,
    inReviewPercent: 12.5,
    overdueCount: 0,
    overduePercent: 0,
    netChange: 'IMPROVING',
    lastSnapshotDate: '2026-03-31',
    pillars: {
      baseline: { total: 40, approved: 35, inReview: 5, overdue: 0, approvedPercent: 87.5, pendingPercent: 12.5, isCritical: false },
      control: { total: 10, open: 1, closed: 9, overdue: 0, pendingPercent: 10, isCritical: false },
      corrective: { total: 10, open: 1, closed: 9, overdue: 0, pendingPercent: 10, isCritical: false },
      ncr: { total: 10, open: 1, closed: 9, overdue: 0, pendingPercent: 10, isCritical: false },
      car: { total: 10, open: 1, closed: 9, overdue: 0, pendingPercent: 10, isCritical: false },
      change: { total: 10, open: 1, closed: 9, overdue: 0, pendingPercent: 10, isCritical: false },
      fcr: { total: 5, open: 0, closed: 5, overdue: 0, pendingPercent: 0, isCritical: false },
      dcr: { total: 2, open: 0, closed: 2, overdue: 0, pendingPercent: 0, isCritical: false },
      vor: { total: 1, open: 0, closed: 1, overdue: 0, pendingPercent: 0, isCritical: false },
      complete: { total: 2, open: 0, closed: 2, overdue: 0, pendingPercent: 0, isCritical: false },
    },
    disciplines: {
      me: { total: 30, approved: 28, underReview: 2, overdue: 0 },
      ce: { total: 30, approved: 26, underReview: 4, overdue: 0 },
      ee: { total: 20, approved: 16, underReview: 4, overdue: 0 },
    },
    itpSubmissions: {
      me: false,
      ce: true,
      ee: true,
    },
    drawingTypes: ['ISO'],
    pendingAgingDays: 3,
  },
];

describe('OverviewTab Component - Search Filtering', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    vi.clearAllMocks();

    vi.mocked(queries.useGlobalSummary).mockReturnValue({
      data: mockSummary,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as any);

    vi.mocked(queries.useProjectMatrix).mockReturnValue({
      data: mockProjects,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as any);
  });

  it('filters project rows and totalFilteredCount when searching by project name', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <OverviewTab />
      </QueryClientProvider>
    );

    // Initial check: both projects are rendered and total count is 2 of 2
    expect(screen.getByText(/Showing/i)).toHaveTextContent('Showing 2 of 2 projects');
    expect(screen.getByTestId('project-matrix-row-PRJ-01')).toBeInTheDocument();
    expect(screen.getByTestId('project-matrix-row-PRJ-02')).toBeInTheDocument();

    const searchInput = screen.getByPlaceholderText(/filter by project id or name/i);
    fireEvent.change(searchInput, { target: { value: 'Alpha' } });

    await waitFor(
      () => {
        expect(screen.getByText(/Showing/i)).toHaveTextContent('Showing 1 of 2 projects');
        expect(screen.getByTestId('project-matrix-row-PRJ-01')).toBeInTheDocument();
        expect(screen.queryByTestId('project-matrix-row-PRJ-02')).not.toBeInTheDocument();
        expect(screen.queryByText('Beta Polyethylene Plant')).not.toBeInTheDocument();
      },
      { timeout: 1000 }
    );
  });

  it('filters project rows when searching by project ID', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <OverviewTab />
      </QueryClientProvider>
    );

    const searchInput = screen.getByPlaceholderText(/filter by project id or name/i);
    fireEvent.change(searchInput, { target: { value: 'PRJ-02' } });

    await waitFor(
      () => {
        expect(screen.getByText(/Showing/i)).toHaveTextContent('Showing 1 of 2 projects');
        expect(screen.getByTestId('project-matrix-row-PRJ-02')).toBeInTheDocument();
        expect(screen.queryByTestId('project-matrix-row-PRJ-01')).not.toBeInTheDocument();
      },
      { timeout: 1000 }
    );
  });

  it('restores all projects when search input is cleared', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <OverviewTab />
      </QueryClientProvider>
    );

    const searchInput = screen.getByPlaceholderText(/filter by project id or name/i);
    fireEvent.change(searchInput, { target: { value: 'Alpha' } });

    await waitFor(() => {
      expect(screen.getByText(/Showing/i)).toHaveTextContent('Showing 1 of 2 projects');
    });

    fireEvent.change(searchInput, { target: { value: '' } });

    await waitFor(() => {
      expect(screen.getByText(/Showing/i)).toHaveTextContent('Showing 2 of 2 projects');
      expect(screen.getByTestId('project-matrix-row-PRJ-01')).toBeInTheDocument();
      expect(screen.getByTestId('project-matrix-row-PRJ-02')).toBeInTheDocument();
    });
  });
});
