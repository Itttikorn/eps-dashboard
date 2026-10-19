import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MetricSelector } from './MetricSelector';

describe('MetricSelector Component', () => {
  it('renders 4 metric toggle options', () => {
    render(
      <MetricSelector
        selectedMetric="total_documents"
        onSelectMetric={vi.fn()}
      />
    );

    expect(screen.getByTestId('metric-radio-total_documents')).toBeInTheDocument();
    expect(screen.getByTestId('metric-radio-approved_count')).toBeInTheDocument();
    expect(screen.getByTestId('metric-radio-in_review_count')).toBeInTheDocument();
    expect(screen.getByTestId('metric-radio-overdue_count')).toBeInTheDocument();
  });

  it('triggers onSelectMetric when user chooses a metric', () => {
    const handleSelect = vi.fn();
    render(
      <MetricSelector
        selectedMetric="total_documents"
        onSelectMetric={handleSelect}
      />
    );

    fireEvent.click(screen.getByTestId('metric-radio-overdue_count'));
    expect(handleSelect).toHaveBeenCalledWith('overdue_count');
  });
});

