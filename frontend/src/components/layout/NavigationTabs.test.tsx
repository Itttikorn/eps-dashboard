import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NavigationTabs } from './NavigationTabs';

describe('NavigationTabs Component', () => {
  it('renders all 3 primary tabs', () => {
    const handleTabChange = vi.fn();
    render(<NavigationTabs activeTab="overview" onTabChange={handleTabChange} />);

    expect(screen.getByTestId('tab-overview')).toBeInTheDocument();
    expect(screen.getByTestId('tab-trends')).toBeInTheDocument();
    expect(screen.getByTestId('tab-ingest')).toBeInTheDocument();
  });

  it('indicates active tab via aria-current and class', () => {
    render(<NavigationTabs activeTab="trends" onTabChange={() => {}} />);

    const trendTab = screen.getByTestId('tab-trends');
    expect(trendTab).toHaveAttribute('aria-current', 'page');
  });

  it('calls onTabChange when a tab is clicked', () => {
    const handleTabChange = vi.fn();
    render(<NavigationTabs activeTab="overview" onTabChange={handleTabChange} />);

    const ingestTab = screen.getByTestId('tab-ingest');
    fireEvent.click(ingestTab);
    expect(handleTabChange).toHaveBeenCalledWith('ingest');
  });
});

