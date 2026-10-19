import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CardSkeleton, TableSkeleton, ChartSkeleton } from './Skeletons';

describe('Skeletons Component Suite', () => {
  it('renders CardSkeleton with specified count', () => {
    render(<CardSkeleton count={3} />);
    const container = screen.getByTestId('card-skeleton');
    expect(container).toBeInTheDocument();
    expect(container.children.length).toBe(3);
  });

  it('renders TableSkeleton with specified rows', () => {
    render(<TableSkeleton rows={4} />);
    const container = screen.getByTestId('table-skeleton');
    expect(container).toBeInTheDocument();
  });

  it('renders ChartSkeleton placeholder', () => {
    render(<ChartSkeleton />);
    const chart = screen.getByTestId('chart-skeleton');
    expect(chart).toBeInTheDocument();
  });
});

