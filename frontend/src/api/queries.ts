import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { downsampleTrendPoints } from '../lib/trend';
import { request, uploadFile } from './client';
import {
  normalizeGlobalSummary,
  normalizeHistoricalTrends,
  normalizeIngestionResult,
  normalizeProjectMatrixRow,
} from './normalizers';
import {
  GlobalSummaryContract,
  GlobalSummaryData,
  HealthCheckContract,
  IngestionBatchRecord,
  IngestionResultContract,
  ProjectContractRow,
  ProjectMatrixRow,
  TrendMetricType,
  TrendPointContract,
  DailyTrendDataPoint,
} from './types';

// Query Keys
export const queryKeys = {
  health: ['health'] as const,
  summary: ['summary'] as const,
  projects: (search?: string) => ['projects', { search }] as const,
  trends: (projectIds: string[], preset: string, metric: TrendMetricType) =>
    ['trends', { projectIds, preset, metric }] as const,
};

// 1. Health Check (polls every 30s)
export function useHealthCheck() {
  return useQuery<HealthCheckContract>({
    queryKey: queryKeys.health,
    queryFn: ({ signal }) => request<HealthCheckContract>('/health', { signal }),
    refetchInterval: 30000,
    staleTime: 15000,
  });
}

// 2. Global Macro Summary
export function useGlobalSummary() {
  return useQuery<GlobalSummaryData>({
    queryKey: queryKeys.summary,
    queryFn: async ({ signal }) => {
      const contract = await request<GlobalSummaryContract>('/projects/summary', { signal });
      return normalizeGlobalSummary(contract);
    },
    staleTime: 60000,
    gcTime: 10 * 60 * 1000,
  });
}

// 3. Project Matrix
export function useProjectMatrix(search?: string) {
  return useQuery<ProjectMatrixRow[]>({
    queryKey: queryKeys.projects(search),
    queryFn: async ({ signal }) => {
      const queryParams = new URLSearchParams();
      if (search) queryParams.set('search', search);
      const url = `/projects${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const contractRows = await request<ProjectContractRow[]>(url, { signal });
      return Array.isArray(contractRows) ? contractRows.map(normalizeProjectMatrixRow) : [];
    },
    staleTime: 30000,
    gcTime: 5 * 60 * 1000,
    placeholderData: (previousData) => previousData,
  });
}

// 4. Historical Trends
export function useHistoricalTrends(
  projectIds: string[],
  preset: string,
  metric: TrendMetricType,
  endDate?: string
) {
  return useQuery<DailyTrendDataPoint[]>({
    queryKey: ['trends', { projectIds, preset, metric, endDate }] as const,
    queryFn: async ({ signal }) => {
      if (projectIds.length === 0) return [];
      const queryParams = new URLSearchParams();
      queryParams.set('project_ids', projectIds.join(','));
      queryParams.set('preset', preset);
      if (endDate) {
        queryParams.set('end_date', endDate);
      }
      const url = `/analytics/trends?${queryParams.toString()}`;
      const points = await request<TrendPointContract[]>(url, { signal });
      const normalized = normalizeHistoricalTrends(points, metric);
      return downsampleTrendPoints(normalized, 730);
    },
    staleTime: 120000,
    gcTime: 15 * 60 * 1000,
    enabled: projectIds.length > 0,
  });
}

// 5. Upload Snapshot Mutation
export function useUploadSnapshot() {
  const qc = useQueryClient();

  return useMutation<IngestionBatchRecord, Error, { file: File; signal?: AbortSignal }>({
    mutationFn: async ({ file, signal }) => {
      const formData = new FormData();
      formData.append('file', file);
      const res = await uploadFile<IngestionResultContract>('/ingest', formData, signal);
      return normalizeIngestionResult(res);
    },
    onSuccess: () => {
      // Invalidate relevant query caches
      qc.invalidateQueries({ queryKey: ['projects'] });
      qc.invalidateQueries({ queryKey: queryKeys.summary });
      qc.invalidateQueries({ queryKey: ['trends'] });
    },
  });
}

