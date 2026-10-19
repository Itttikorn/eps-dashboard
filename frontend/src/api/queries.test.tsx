import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useHealthCheck, useGlobalSummary, useUploadSnapshot, queryKeys } from './queries';
import * as client from './client';

describe('API Queries Hooks', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    vi.restoreAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('useHealthCheck fetches and returns health data', async () => {
    vi.spyOn(client, 'request').mockResolvedValue({
      service: 'UP',
      database: 'connected',
      timestamp: '2026-10-19T12:00:00Z',
    });

    const { result } = renderHook(() => useHealthCheck(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.service).toBe('UP');
  });

  it('useGlobalSummary fetches and normalizes global summary', async () => {
    vi.spyOn(client, 'request').mockResolvedValue({
      total_projects: 3,
      total_documents: 600,
      total_overdue: 30,
    });

    const { result } = renderHook(() => useGlobalSummary(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.totalProjects).toBe(3);
    expect(result.current.data?.totalDocuments).toBe(600);
    expect(result.current.data?.totalOverdue).toBe(30);
    expect(result.current.data?.overdueRatePercent).toBe(5);
  });

  it('useUploadSnapshot invalidates query caches on success', async () => {
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    vi.spyOn(client, 'uploadFile').mockResolvedValue({
      batch_id: 'batch-987',
      status: 'INGESTED',
      total_rows: 100,
    });

    const { result } = renderHook(() => useUploadSnapshot(), { wrapper });

    const file = new File(['content'], 'test.csv', { type: 'text/csv' });
    await result.current.mutateAsync({ file });

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['projects'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.summary });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['trends'] });
  });

  it('useProjectMatrix fetches and normalizes project rows', async () => {
    vi.spyOn(client, 'request').mockResolvedValue([
      {
        project_id: 'PRJ-01',
        project_name: 'Test Project',
        site_code: 'TP-1',
        total_documents: 100,
        approved_count: 80,
        in_review_count: 15,
        overdue_count: 5,
        pillars: {
          baseline: { total: 40, approved: 35, in_review: 5, overdue: 0 },
          control: { total: 20, open: 5, closed: 15 },
          corrective: { total: 10, open: 2, closed: 8 },
          change: { total: 15, open: 2, closed: 13 },
          complete: { total: 15, open: 1, closed: 14 },
        },
      },
    ]);

    const { useProjectMatrix } = await import('./queries');
    const { result } = renderHook(() => useProjectMatrix('2026-03-31'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.[0]?.projectId).toBe('PRJ-01');
    expect(result.current.data?.[0]?.siteCode).toBe('TP-1');
  });

  it('useHistoricalTrends fetches and normalizes trend series', async () => {
    vi.spyOn(client, 'request').mockResolvedValue([
      {
        project_id: 'PRJ-01',
        points: [{ date: '2026-03-01', value: 100 }],
      },
    ]);

    const { useHistoricalTrends } = await import('./queries');
    const { result } = renderHook(
      () => useHistoricalTrends(['PRJ-01'], '30D', 'total_documents'),
      { wrapper }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeDefined();
  });

  it('useIngestionHistory fetches and normalizes batch audit ledger', async () => {
    vi.spyOn(client, 'request').mockResolvedValue([
      {
        batch_id: 'BATCH-001',
        project_target: 'ALL',
        snapshot_date: '2026-03-31',
        total_rows: 500,
        deltas_updated: 20,
        skipped_unchanged: 480,
        status: 'INGESTED',
        elapsed_ms: 1200,
      },
    ]);

    const { useIngestionHistory } = await import('./queries');
    const { result } = renderHook(() => useIngestionHistory(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.[0]?.batchId).toBe('BATCH-001');
    expect(result.current.data?.[0]?.status).toBe('INGESTED');
  });
});

