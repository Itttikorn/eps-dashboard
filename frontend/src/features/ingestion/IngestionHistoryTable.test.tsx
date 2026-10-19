import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { IngestionHistoryTable } from './IngestionHistoryTable';
import { IngestionBatchRecord } from '../../api/types';

const mockBatches: IngestionBatchRecord[] = [
  {
    batchId: 'BATCH-20260331-001',
    fileSha256: 'abc123sha',
    projectTarget: 'ALL_PORTFOLIO',
    snapshotDate: '2026-03-31',
    totalRows: 12450,
    deltasUpdated: 350,
    skippedUnchanged: 12100,
    status: 'INGESTED',
    elapsedMs: 2450,
    createdAt: '2026-03-31T08:00:00Z',
  },
  {
    batchId: 'BATCH-20260330-002',
    fileSha256: 'def456sha',
    projectTarget: 'RYG-A',
    snapshotDate: '2026-03-30',
    totalRows: 4200,
    deltasUpdated: 0,
    skippedUnchanged: 4200,
    status: 'ALREADY_INGESTED',
    elapsedMs: 820,
    createdAt: '2026-03-30T08:00:00Z',
  },
];

describe('IngestionHistoryTable Component', () => {
  it('renders skeleton rows when loading', () => {
    render(<IngestionHistoryTable isLoading={true} />);
    expect(screen.getByTestId('table-skeleton')).toBeInTheDocument();
  });

  it('renders empty state when batches array is empty', () => {
    render(<IngestionHistoryTable batches={[]} />);
    expect(screen.getByText('No Ingestion History')).toBeInTheDocument();
  });

  it('renders batch records and audit ledger table', () => {
    render(<IngestionHistoryTable batches={mockBatches} />);

    expect(screen.getByTestId('ingestion-history-table-container')).toBeInTheDocument();
    expect(screen.getByText('BATCH-20260331-001')).toBeInTheDocument();
    expect(screen.getByText('ALL_PORTFOLIO')).toBeInTheDocument();
    expect(screen.getByText('+350')).toBeInTheDocument();
    expect(screen.getByText('INGESTED')).toBeInTheDocument();

    expect(screen.getByText('BATCH-20260330-002')).toBeInTheDocument();
    expect(screen.getByText('RYG-A')).toBeInTheDocument();
    expect(screen.getByText('ALREADY_INGESTED')).toBeInTheDocument();
  });
});

