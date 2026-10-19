import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HeaderNav } from './HeaderNav';

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

describe('HeaderNav Component', () => {
  it('renders brand title and upload action', () => {
    const queryClient = createTestQueryClient();
    const handleOpenUpload = vi.fn();

    render(
      <QueryClientProvider client={queryClient}>
        <HeaderNav onOpenUploadModal={handleOpenUpload} />
      </QueryClientProvider>
    );

    expect(screen.getByText('Conzol Doc Tracker')).toBeInTheDocument();
    expect(screen.getByTestId('health-heartbeat')).toBeInTheDocument();

    const uploadBtn = screen.getByTestId('header-upload-btn');
    fireEvent.click(uploadBtn);
    expect(handleOpenUpload).toHaveBeenCalledTimes(1);
  });
});

