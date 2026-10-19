import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HistoricalTrendChart } from './HistoricalTrendChart';
import { DailyTrendDataPoint } from '../../api/types';

const mockTrendData: DailyTrendDataPoint[] = [
  { date: '2026-03-01', 'PRJ-01': 120, 'PRJ-02': 240 },
  { date: '2026-03-02', 'PRJ-01': 125, 'PRJ-02': 245 },
];

describe('HistoricalTrendChart Component', () => {
  it('renders skeleton when loading', () => {
    render(
      <HistoricalTrendChart
        isLoading={true}
        selectedProjectIds={['PRJ-01']}
        metricType="total_documents"
      />
    );
    expect(screen.getByTestId('chart-skeleton')).toBeInTheDocument();
  });

  it('renders error alert when isError is true', () => {
    const handleRetry = vi.fn();
    render(
      <HistoricalTrendChart
        isError={true}
        onRetry={handleRetry}
        selectedProjectIds={['PRJ-01']}
        metricType="total_documents"
      />
    );
    expect(screen.getByText('Failed to load historical trend analytics')).toBeInTheDocument();
  });

  it('renders empty state when no projects are selected', () => {
    render(
      <HistoricalTrendChart
        data={mockTrendData}
        selectedProjectIds={[]}
        metricType="total_documents"
      />
    );
    expect(screen.getByText('No Projects Selected for Comparison')).toBeInTheDocument();
  });

  it('renders empty state when data array is empty', () => {
    render(
      <HistoricalTrendChart
        data={[]}
        selectedProjectIds={['PRJ-01']}
        metricType="total_documents"
      />
    );
    expect(screen.getByText('No Historical Data Found')).toBeInTheDocument();
  });

  it('renders chart container when valid data is supplied', () => {
    render(
      <HistoricalTrendChart
        data={mockTrendData}
        selectedProjectIds={['PRJ-01', 'PRJ-02']}
        metricType="total_documents"
      />
    );
    expect(screen.getByTestId('historical-trend-chart-container')).toBeInTheDocument();
    expect(screen.getByText(/Comparative Time-Series \(Total Documents\)/i)).toBeInTheDocument();
  });
});

