import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DashboardShell } from './DashboardShell';

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

describe('DashboardShell Component', () => {
  it('renders children content within main container', () => {
    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <DashboardShell
          activeTab="overview"
          onTabChange={vi.fn()}
          onOpenUploadModal={vi.fn()}
        >
          <div data-testid="test-child-content">Child View Loaded</div>
        </DashboardShell>
      </QueryClientProvider>
    );

    expect(screen.getByTestId('test-child-content')).toBeInTheDocument();
    expect(screen.getByTestId('header-nav')).toBeInTheDocument();
  });

  it('hides GlobalFilterBar when activeTab is ingest', () => {
    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <DashboardShell
          activeTab="ingest"
          onTabChange={vi.fn()}
          onOpenUploadModal={vi.fn()}
        >
          <div>Ingest Tab</div>
        </DashboardShell>
      </QueryClientProvider>
    );

    expect(screen.queryByTestId('global-filter-bar')).not.toBeInTheDocument();
  });
});

