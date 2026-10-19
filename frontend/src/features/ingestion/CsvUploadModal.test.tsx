import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CsvUploadModal } from './CsvUploadModal';

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

describe('CsvUploadModal Component', () => {
  it('renders modal content when open is true', () => {
    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <CsvUploadModal open={true} onClose={vi.fn()} />
      </QueryClientProvider>
    );

    expect(screen.getByTestId('csv-upload-zone')).toBeInTheDocument();
  });

  it('does not render modal content when open is false', () => {
    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <CsvUploadModal open={false} onClose={vi.fn()} />
      </QueryClientProvider>
    );

    expect(screen.queryByTestId('csv-upload-zone')).not.toBeInTheDocument();
  });
});

