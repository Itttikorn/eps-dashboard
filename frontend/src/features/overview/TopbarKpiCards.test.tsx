import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TopbarKpiCards } from './TopbarKpiCards';
import { GlobalSummaryData } from '../../api/types';

const mockSummary: GlobalSummaryData = {
  totalDocuments: 12450,
  overallBacklog: 820,
  totalOverdue: 340,
  overdueRatePercent: 2.73,
  totalProjects: 14,
  categories: {
    baseline: { total: 4200, approved: 3800, inReview: 400, overdue: 0 },
    control: { open: 210, closed: 1800 },
    corrective: { open: 85, closed: 620 },
    change: { open: 65, closed: 310 },
    complete: { preCommissioning: 460, postCommissioning: 890 },
  },
  lastUpdatedAt: '2026-03-31T00:00:00Z',
};

describe('TopbarKpiCards Component', () => {
  it('renders skeleton cards while loading', () => {
    render(<TopbarKpiCards isLoading={true} />);
    expect(screen.getByTestId('card-skeleton')).toBeInTheDocument();
  });

  it('renders error alert when isError is true', () => {
    const handleRetry = vi.fn();
    render(<TopbarKpiCards isError={true} onRetry={handleRetry} />);
    expect(screen.getByText('Failed to load portfolio totals')).toBeInTheDocument();
  });

  it('renders 4 macro cards and formatted figures when data is supplied', () => {
    render(<TopbarKpiCards summary={mockSummary} />);
    expect(screen.getByText('12,450')).toBeInTheDocument();
    expect(screen.getByText('820')).toBeInTheDocument();
    expect(screen.getByText('340')).toBeInTheDocument();
    expect(screen.getByText('(2.7%)')).toBeInTheDocument();
    expect(screen.getByText('Across 14 active projects')).toBeInTheDocument();
  });

  it('toggles category contribution drawer when pillar button is clicked', () => {
    render(<TopbarKpiCards summary={mockSummary} projects={[]} />);
    const baselinePill = screen.getByTestId('pillar-pill-baseline');

    fireEvent.click(baselinePill);
    expect(screen.getByTestId('category-detail-grid')).toBeInTheDocument();

    // Clicking again collapses it
    fireEvent.click(baselinePill);
    expect(screen.queryByTestId('category-detail-grid')).not.toBeInTheDocument();
  });
});

