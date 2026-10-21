import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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

  it('displays error when a non-csv file is selected and does not upload', () => {
    const uploadSpy = vi.spyOn(client, 'uploadFile');
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
    expect(uploadSpy).not.toHaveBeenCalled();
  });

  it('automatically triggers upload and displays in-progress status when a valid csv file is selected', async () => {
    let resolveUpload!: (val: any) => void;
    const uploadPromise = new Promise((resolve) => {
      resolveUpload = resolve;
    });
    const uploadSpy = vi.spyOn(client, 'uploadFile').mockReturnValue(uploadPromise as any);

    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <CsvUploadZone />
      </QueryClientProvider>
    );

    const input = screen.getByTestId('file-input');
    const validCsv = new File(['id,name\n1,test'], 'snapshot.csv', { type: 'text/csv' });

    fireEvent.change(input, { target: { files: [validCsv] } });

    // Wait for automatic upload to be triggered without clicking any submit button
    await waitFor(() => {
      expect(uploadSpy).toHaveBeenCalledTimes(1);
    });
    expect(uploadSpy).toHaveBeenCalledWith('/ingest', expect.any(FormData), undefined);

    // No manual submit button should exist
    expect(screen.queryByTestId('submit-upload-btn')).not.toBeInTheDocument();

    // In-progress status shown directly inside the dropzone
    expect(screen.getByTestId('uploading-state')).toBeInTheDocument();
    expect(screen.getByText('snapshot.csv')).toBeInTheDocument();
    expect(screen.getByText(/Uploading and processing snapshot\.\.\./i)).toBeInTheDocument();
    // No separate selected file card is rendered below the dropzone
    expect(screen.queryByTestId('file-upload-status')).not.toBeInTheDocument();

    // Resolve upload and verify success receipt
    resolveUpload({
      batch_id: 'batch-test-123',
      total_rows: 50,
      deltas_updated: 40,
      skipped_unchanged: 10,
      status: 'INGESTED',
    });

    expect(await screen.findByTestId('upload-success-receipt')).toBeInTheDocument();
    expect(screen.getByText(/Deduplicated Rows:/i)).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('automatically triggers upload when a valid file is dropped into dropzone', async () => {
    const uploadSpy = vi.spyOn(client, 'uploadFile').mockResolvedValue({
      batch_id: 'batch-drop-123',
      total_rows: 20,
      deltas_updated: 15,
      skipped_unchanged: 5,
      status: 'INGESTED',
    });

    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <CsvUploadZone />
      </QueryClientProvider>
    );

    const dropzone = screen.getByTestId('dropzone-area');
    const validCsv = new File(['id,name\n2,drop'], 'dropped.csv', { type: 'text/csv' });

    fireEvent.drop(dropzone, {
      dataTransfer: {
        files: [validCsv],
      },
    });

    await waitFor(() => {
      expect(uploadSpy).toHaveBeenCalledTimes(1);
    });
    expect(uploadSpy).toHaveBeenCalledWith('/ingest', expect.any(FormData), undefined);
    expect(await screen.findByTestId('upload-success-receipt')).toBeInTheDocument();
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

