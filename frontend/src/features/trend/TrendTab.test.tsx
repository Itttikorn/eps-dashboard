import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TrendTab } from './TrendTab';
import * as queries from '../../api/queries';

vi.mock('../../api/queries', async () => {
  const actual = await vi.importActual<typeof queries>('../../api/queries');
  return {
    ...actual,
    useProjectMatrix: vi.fn(),
    useHistoricalTrends: vi.fn(),
  };
});

describe('TrendTab Component - Selection Memoization', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    vi.clearAllMocks();

    vi.mocked(queries.useProjectMatrix).mockReturnValue({
      data: [
        { projectId: 'P1', projectName: 'Project 1' },
        { projectId: 'P2', projectName: 'Project 2' },
        { projectId: 'P3', projectName: 'Project 3' },
        { projectId: 'P4', projectName: 'Project 4' },
      ],
      isLoading: false,
      isError: false,
    } as any);

    vi.mocked(queries.useHistoricalTrends).mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as any);
  });

  it('auto-selects first 3 projects initially, but allows Clear All without re-selecting', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <TrendTab />
      </QueryClientProvider>
    );

    // Initial render should auto-select 3 projects
    await waitFor(() => {
      expect(screen.getByText(/Projects to Compare \(3\/4\)/)).toBeInTheDocument();
    });

    // Click "Clear All"
    const clearBtn = screen.getByRole('button', { name: /clear all/i });
    fireEvent.click(clearBtn);

    // Should stay at 0 selected and NOT re-trigger auto-selection
    await waitFor(() => {
      expect(screen.getByText(/Projects to Compare \(0\/4\)/)).toBeInTheDocument();
    });
  });
});

