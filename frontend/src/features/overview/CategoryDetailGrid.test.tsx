import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CategoryDetailGrid } from './CategoryDetailGrid';
import { ProjectMatrixRow } from '../../api/types';

const mockProjects: ProjectMatrixRow[] = [
  {
    projectId: 'PRJ-01',
    projectCode: 'RYG-A',
    projectName: 'Rayong Petrochemical Complex',
    siteCode: 'RYG-A',
    healthStatus: 'ON TRACK',
    totalDocuments: 1200,
    approvedCount: 1000,
    approvedPercent: 83.3,
    inReviewCount: 150,
    inReviewPercent: 12.5,
    overdueCount: 20,
    overduePercent: 1.67,
    netChange: 'IMPROVING',
    lastSnapshotDate: '2026-03-31',
    pillars: {
      baseline: {
        total: 400,
        approved: 360,
        inReview: 40,
        overdue: 5,
        approvedPercent: 90,
        pendingPercent: 10.0,
        isCritical: false,
      },
      control: { total: 300, open: 30, closed: 270, pendingPercent: 10.0, isCritical: false },
      corrective: { total: 100, open: 50, closed: 50, pendingPercent: 50.0, isCritical: true },
      change: { total: 200, open: 20, closed: 180, pendingPercent: 10.0, isCritical: false },
      complete: { total: 200, open: 10, closed: 190, pendingPercent: 5.0, isCritical: false },
    },
    disciplines: {
      me: { total: 400, approved: 350 },
      ce: { total: 400, approved: 350 },
      ee: { total: 400, approved: 300 },
    },
    drawingTypes: ['GAD', 'ISO', 'PID'],
    pendingAgingDays: 14,
  },
];

describe('CategoryDetailGrid Component', () => {
  it('returns null when categoryKey is null', () => {
    const { container } = render(
      <CategoryDetailGrid
        categoryKey={null}
        categoryName=""
        categoryColor="#2f6fce"
        projects={mockProjects}
        onClose={vi.fn()}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders project contribution breakdown when categoryKey is selected', () => {
    const handleClose = vi.fn();
    render(
      <CategoryDetailGrid
        categoryKey="corrective"
        categoryName="Corrective (NCR/CAR)"
        categoryColor="#ee8a1f"
        projects={mockProjects}
        onClose={handleClose}
      />
    );

    expect(screen.getByTestId('category-detail-grid')).toBeInTheDocument();
    expect(screen.getByText(/Corrective \(NCR\/CAR\) — Project Contribution Breakdown/i)).toBeInTheDocument();
    expect(screen.getByText('RYG-A')).toBeInTheDocument();
    expect(screen.getByText('Rayong Petrochemical Complex')).toBeInTheDocument();
    expect(screen.getByText('CRITICAL')).toBeInTheDocument();
    expect(screen.getByText('50.0%')).toBeInTheDocument();

    const closeBtn = screen.getByLabelText(/Close detail breakdown/i);
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
