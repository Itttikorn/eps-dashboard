import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SearchToolbar } from './SearchToolbar';
import { ProjectMatrixRow } from '../../api/types';

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
      control: { total: 20, open: 5, closed: 15, pendingPercent: 25, isCritical: false },
      corrective: { total: 10, open: 2, closed: 8, pendingPercent: 20, isCritical: false },
      change: { total: 15, open: 5, closed: 10, pendingPercent: 33.3, isCritical: false },
      fcr: { total: 10, open: 2, closed: 8, pendingPercent: 20, isCritical: false },
      dcr: { total: 5, open: 1, closed: 4, pendingPercent: 20, isCritical: false },
      vor: { total: 5, open: 1, closed: 4, pendingPercent: 20, isCritical: false },
      complete: { total: 5, open: 1, closed: 4, pendingPercent: 20, isCritical: false },
    },
    disciplines: {
      me: { total: 50, approved: 25 },
      ce: { total: 40, approved: 20 },
      ee: { total: 30, approved: 15 },
    },
    drawingTypes: ['GAD'],
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
      control: { total: 10, open: 1, closed: 9, pendingPercent: 10, isCritical: false },
      corrective: { total: 10, open: 1, closed: 9, pendingPercent: 10, isCritical: false },
      change: { total: 10, open: 1, closed: 9, pendingPercent: 10, isCritical: false },
      fcr: { total: 5, open: 0, closed: 5, pendingPercent: 0, isCritical: false },
      dcr: { total: 2, open: 0, closed: 2, pendingPercent: 0, isCritical: false },
      vor: { total: 1, open: 0, closed: 1, pendingPercent: 0, isCritical: false },
      complete: { total: 2, open: 0, closed: 2, pendingPercent: 0, isCritical: false },
    },
    disciplines: {
      me: { total: 30, approved: 28 },
      ce: { total: 30, approved: 26 },
      ee: { total: 20, approved: 16 },
    },
    drawingTypes: ['ISO'],
  },
];

describe('SearchToolbar Component', () => {
  it('renders search input and total filtered count', () => {
    render(
      <SearchToolbar
        searchQuery=""
        onSearchChange={vi.fn()}
        sortField="total"
        onSortFieldChange={vi.fn()}
        sortDir="desc"
        onToggleSortDir={vi.fn()}
        totalFilteredCount={14}
      />
    );

    expect(screen.getByPlaceholderText(/Filter by Project ID/i)).toBeInTheDocument();
    expect(screen.getByText('14')).toBeInTheDocument();
  });

  it('triggers onSearchChange when typing', () => {
    const handleSearch = vi.fn();
    render(
      <SearchToolbar
        searchQuery=""
        onSearchChange={handleSearch}
        sortField="total"
        onSortFieldChange={vi.fn()}
        sortDir="desc"
        onToggleSortDir={vi.fn()}
        totalFilteredCount={14}
      />
    );

    const input = screen.getByPlaceholderText(/Filter by Project ID/i);
    fireEvent.change(input, { target: { value: 'BKK' } });
    expect(handleSearch).toHaveBeenCalledWith('BKK');
  });

  it('toggles sort direction when clicking sort button', () => {
    const handleToggle = vi.fn();
    render(
      <SearchToolbar
        searchQuery="BKK"
        onSearchChange={vi.fn()}
        sortField="total"
        onSortFieldChange={vi.fn()}
        sortDir="desc"
        onToggleSortDir={handleToggle}
        totalFilteredCount={2}
      />
    );

    const toggleBtn = screen.getByLabelText(/Toggle sort direction/i);
    fireEvent.click(toggleBtn);
    expect(handleToggle).toHaveBeenCalledTimes(1);
  });

  it('displays autocomplete dropdown on focus and allows project selection', () => {
    const handleToggleProject = vi.fn();
    render(
      <SearchToolbar
        projects={mockProjects}
        selectedProjectIds={[]}
        onToggleProject={handleToggleProject}
        searchQuery=""
        onSearchChange={vi.fn()}
        sortField="total"
        onSortFieldChange={vi.fn()}
        sortDir="desc"
        onToggleSortDir={vi.fn()}
        totalFilteredCount={2}
        totalProjectsCount={2}
      />
    );

    const input = screen.getByPlaceholderText(/Filter by Project ID/i);
    fireEvent.focus(input);

    expect(screen.getByTestId('search-autocomplete-dropdown')).toBeInTheDocument();
    expect(screen.getByText('Alpha Olefins Revamp')).toBeInTheDocument();
    expect(screen.getByText('Beta Polyethylene Plant')).toBeInTheDocument();

    const item = screen.getByTestId('autocomplete-item-PRJ-01');
    fireEvent.click(item);
    expect(handleToggleProject).toHaveBeenCalledWith('PRJ-01');
  });

  it('renders selected project chips and triggers unselect on chip remove', () => {
    const handleToggleProject = vi.fn();
    render(
      <SearchToolbar
        projects={mockProjects}
        selectedProjectIds={['PRJ-01']}
        onToggleProject={handleToggleProject}
        searchQuery=""
        onSearchChange={vi.fn()}
        sortField="total"
        onSortFieldChange={vi.fn()}
        sortDir="desc"
        onToggleSortDir={vi.fn()}
        totalFilteredCount={1}
        totalProjectsCount={2}
      />
    );

    expect(screen.getByText('Selected Projects (1):')).toBeInTheDocument();
    const removeBtn = screen.getByLabelText('Remove PRJ-01');
    fireEvent.click(removeBtn);
    expect(handleToggleProject).toHaveBeenCalledWith('PRJ-01');
  });

  it('handles quick health status filter change', () => {
    const handleHealthChange = vi.fn();
    render(
      <SearchToolbar
        projects={mockProjects}
        searchQuery=""
        onSearchChange={vi.fn()}
        healthFilter="all"
        onHealthFilterChange={handleHealthChange}
        sortField="total"
        onSortFieldChange={vi.fn()}
        sortDir="desc"
        onToggleSortDir={vi.fn()}
        totalFilteredCount={2}
      />
    );

    const criticalBtn = screen.getByRole('button', { name: /Critical/i });
    fireEvent.click(criticalBtn);
    expect(handleHealthChange).toHaveBeenCalledWith('CRITICAL');
  });

  it('handles overdue toggle click', () => {
    const handleToggleOverdue = vi.fn();
    render(
      <SearchToolbar
        projects={mockProjects}
        searchQuery=""
        onSearchChange={vi.fn()}
        overdueOnly={false}
        onToggleOverdueOnly={handleToggleOverdue}
        sortField="total"
        onSortFieldChange={vi.fn()}
        sortDir="desc"
        onToggleSortDir={vi.fn()}
        totalFilteredCount={2}
      />
    );

    const overdueBtn = screen.getByRole('button', { name: /Overdue Only/i });
    fireEvent.click(overdueBtn);
    expect(handleToggleOverdue).toHaveBeenCalledTimes(1);
  });
});
