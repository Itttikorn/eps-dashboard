import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CsvUploadZone } from './CsvUploadZone';

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
    expect(screen.getByText(/Daily CSV Snapshot Ingestion Portal/i)).toBeInTheDocument();
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
});

