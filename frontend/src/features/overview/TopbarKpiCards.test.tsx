import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
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

  it('renders 3 macro cards and formatted figures with red percentage when overdue > 0', () => {
    render(<TopbarKpiCards summary={mockSummary} />);
    expect(screen.getByText('12,450')).toBeInTheDocument();
    expect(screen.getByText('820')).toBeInTheDocument();
    expect(screen.getByText('340')).toBeInTheDocument();
    expect(screen.getByText('(2.7%)')).toBeInTheDocument();
    expect(screen.getByText('Across 14 active projects')).toBeInTheDocument();

    // Verify overdue threshold text is removed
    expect(screen.queryByText(/Target SLA threshold/i)).not.toBeInTheDocument();

    // Verify percentage is styled in red when overdueRatePercent > 0
    const pctElement = screen.getByTestId('overdue-percentage');
    expect(pctElement.className).toContain('text-red-600');
  });

  it('renders overdue percentage with neutral text when overdue is 0', () => {
    const zeroOverdueSummary: GlobalSummaryData = {
      ...mockSummary,
      totalOverdue: 0,
      overdueRatePercent: 0,
    };
    render(<TopbarKpiCards summary={zeroOverdueSummary} />);
    const pctElement = screen.getByTestId('overdue-percentage');
    expect(pctElement.className).toContain('text-slate-400');
    expect(pctElement.className).not.toContain('text-red-600');
  });
});
