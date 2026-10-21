import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CsvUploadModal } from './CsvUploadModal';

vi.mock('./CsvUploadZone', () => ({
  CsvUploadZone: ({ onUploadSuccess }: { onUploadSuccess?: (record: any) => void }) => (
    <div data-testid="csv-upload-zone">
      <button
        data-testid="simulate-upload-success"
        onClick={() => onUploadSuccess?.({ batch_id: 'test-batch', snapshot_date: '2026-03-31' })}
      >
        Simulate Success
      </button>
    </div>
  ),
}));

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

describe('CsvUploadModal Component', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

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

  it('triggers onClose after 2.5s on upload success when modal remains open', () => {
    const handleClose = vi.fn();
    const handleSuccess = vi.fn();
    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <CsvUploadModal open={true} onClose={handleClose} onSuccess={handleSuccess} />
      </QueryClientProvider>
    );

    fireEvent.click(screen.getByTestId('simulate-upload-success'));
    expect(handleSuccess).toHaveBeenCalledWith(
      expect.objectContaining({ batch_id: 'test-batch' })
    );
    expect(handleClose).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(2500);
    });

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('clears auto-close timer if modal closes before 2.5s expires', () => {
    const handleClose = vi.fn();
    const queryClient = createTestQueryClient();

    const { rerender } = render(
      <QueryClientProvider client={queryClient}>
        <CsvUploadModal open={true} onClose={handleClose} />
      </QueryClientProvider>
    );

    fireEvent.click(screen.getByTestId('simulate-upload-success'));

    // Close modal prematurely
    rerender(
      <QueryClientProvider client={queryClient}>
        <CsvUploadModal open={false} onClose={handleClose} />
      </QueryClientProvider>
    );

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(handleClose).not.toHaveBeenCalled();
  });

  it('clears auto-close timer if modal unmounts before 2.5s expires', () => {
    const handleClose = vi.fn();
    const queryClient = createTestQueryClient();

    const { unmount } = render(
      <QueryClientProvider client={queryClient}>
        <CsvUploadModal open={true} onClose={handleClose} />
      </QueryClientProvider>
    );

    fireEvent.click(screen.getByTestId('simulate-upload-success'));

    unmount();

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(handleClose).not.toHaveBeenCalled();
  });
});


