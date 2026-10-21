import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CsvUploadZone } from './CsvUploadZone';
import * as client from '../../api/client';

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

describe('CsvUploadZone Component', () => {
  it('renders dropzone area and title', () => {
    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <CsvUploadZone />
      </QueryClientProvider>
    );

    expect(screen.getByTestId('csv-upload-zone')).toBeInTheDocument();
    expect(screen.getByText(/CSV Snapshot Ingestion/i)).toBeInTheDocument();
    expect(screen.getByTestId('dropzone-area')).toBeInTheDocument();
  });

  it('displays error when a non-csv file is selected', () => {
    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <CsvUploadZone />
      </QueryClientProvider>
    );

    const input = screen.getByTestId('file-input');
    const invalidFile = new File(['content'], 'document.pdf', { type: 'application/pdf' });

    fireEvent.change(input, { target: { files: [invalidFile] } });
    expect(screen.getByText(/Only \.csv files are supported/i)).toBeInTheDocument();
  });

  it('displays file details and submit button when a valid csv file is selected', () => {
    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <CsvUploadZone />
      </QueryClientProvider>
    );

    const input = screen.getByTestId('file-input');
    const validCsv = new File(['id,name\n1,test'], 'snapshot.csv', { type: 'text/csv' });

    fireEvent.change(input, { target: { files: [validCsv] } });
    expect(screen.getByText('snapshot.csv')).toBeInTheDocument();
    expect(screen.getByTestId('submit-upload-btn')).toBeInTheDocument();
  });

  it('displays success receipt with Deduplicated Rows on successful upload', async () => {
    vi.spyOn(client, 'uploadFile').mockResolvedValue({
      batch_id: 'batch-test-123',
      total_rows: 50,
      deltas_updated: 40,
      skipped_unchanged: 10,
      status: 'INGESTED',
    });

    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <CsvUploadZone />
      </QueryClientProvider>
    );

    const input = screen.getByTestId('file-input');
    const validCsv = new File(['id,name\n1,test'], 'snapshot.csv', { type: 'text/csv' });
    fireEvent.change(input, { target: { files: [validCsv] } });

    const submitBtn = screen.getByTestId('submit-upload-btn');
    fireEvent.click(submitBtn);

    expect(await screen.findByTestId('upload-success-receipt')).toBeInTheDocument();
    expect(screen.getByText(/Deduplicated Rows:/i)).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('resets file input value so selecting the same file triggers onChange again', () => {
    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <CsvUploadZone />
      </QueryClientProvider>
    );

    const input = screen.getByTestId('file-input') as HTMLInputElement;
    const file = new File(['content'], 'test.csv', { type: 'text/csv' });
    const valueSetterSpy = vi.spyOn(input, 'value', 'set');

    fireEvent.change(input, { target: { files: [file] } });
    expect(valueSetterSpy).toHaveBeenCalledWith('');
    expect(input.value).toBe('');
  });

  it('displays 32 MB limit labels in UI', () => {
    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <CsvUploadZone />
      </QueryClientProvider>
    );

    expect(screen.getByText(/Max 32 MB/i)).toBeInTheDocument();
    expect(screen.getByText(/Limit: 32 MB/i)).toBeInTheDocument();
  });
});



