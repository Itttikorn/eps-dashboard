// Universal API Envelope contracts and internal UI View Models

export interface StatusInfo {
  code: number;
  header: string;
  description: string;
}

export interface UniversalEnvelope<T> {
  status: StatusInfo;
  result: T;
  total?: number;
  search_params?: Record<string, unknown>;
}

// Contract DTOs (Tolerant Parsing)
export interface CategoryCountsContract {
  baseline_drawings?: number;
  control?: number;
  corrective?: number;
  change?: number;
  complete?: number;
}

export interface GlobalSummaryContract {
  total_projects?: number;
  total_documents?: number;
  total_overdue?: number;
  category_counts?: CategoryCountsContract;
  last_updated_at?: string;
  // Legacy fields
  overdue_documents?: number;
  approved_documents?: number;
  under_review_documents?: number;
  global_approval_rate?: number;
}

export interface CategoryMetricsContract {
  total?: number;
  open?: number;
  closed?: number;
  pending_pct?: number;
  is_critical?: boolean;
  avg_age_days?: number;
}

export interface ProjectContractRow {
  project_id?: string;
  project_code?: string; // legacy fallback
  site_code?: string;
  project_name?: string;
  baseline_drawings?: {
    total?: number;
    approved?: number;
    in_review?: number;
    overdue?: number;
  } | number;
  control?: CategoryMetricsContract;
  corrective?: CategoryMetricsContract;
  change?: CategoryMetricsContract;
  complete?: CategoryMetricsContract;
  overdue_count?: number;
  total_documents?: number;
  net_change?: 'IMPROVING' | 'DEGRADING' | 'STABLE' | string;
  last_snapshot_date?: string;
  disciplines?: {
    me?: { total?: number; approved?: number };
    ce?: { total?: number; approved?: number };
    ee?: { total?: number; approved?: number };
  };
  drawing_types?: string[];
  pending_aging_days?: number;
}

export interface ProjectMetricsByDateContract {
  total_documents?: number;
  approved_count?: number;
  in_review_count?: number;
  overdue_count?: number;
  pending_ratio?: number;
}

export interface TrendPointContract {
  date: string;
  project_metrics?: Record<string, ProjectMetricsByDateContract>;
}

export interface IngestionResultContract {
  batch_id: string;
  file_sha256?: string;
  status: 'INGESTED' | 'ALREADY_INGESTED' | 'FAILED' | string;
  snapshot_date?: string;
  total_rows?: number;
  deltas_updated?: number;
  skipped_unchanged?: number;
  created_at?: string;
  project_code?: string;
  processed_count?: number;
  errors?: string[];
  elapsed_ms?: number;
}

export interface HealthCheckContract {
  service?: string;
  database?: string;
  timestamp?: string;
  status?: string;
}

// -------------------------------------------------------------
// UI View Models
// -------------------------------------------------------------

export interface GlobalSummaryData {
  totalProjects: number;
  totalDocuments: number;
  totalOverdue: number;
  overallBacklog: number;
  overdueRatePercent: number;
  categories: {
    baseline: { total: number; approved: number; inReview: number; overdue: number };
    control: { open: number; closed: number };
    corrective: { open: number; closed: number };
    change: { open: number; closed: number };
    complete: { preCommissioning: number; postCommissioning: number };
  } | null;
  lastUpdatedAt: string | null;
}

export type HealthStatus = 'ON TRACK' | 'ATTENTION' | 'CRITICAL';
export type NetChangeDirection = 'IMPROVING' | 'DEGRADING' | 'STABLE';

export interface PillarPillDetail {
  total: number;
  open: number;
  closed: number;
  pendingPercent: number;
  isCritical: boolean;
}

export interface ProjectMatrixRow {
  projectId: string;
  projectCode: string;
  projectName: string;
  siteCode: string;
  healthStatus: HealthStatus;
  totalDocuments: number;
  approvedCount: number;
  approvedPercent: number;
  inReviewCount: number;
  inReviewPercent: number;
  overdueCount: number;
  overduePercent: number;
  netChange: NetChangeDirection;
  lastSnapshotDate: string | null;
  pillars: {
    baseline: {
      total: number;
      approved: number;
      inReview: number;
      overdue: number;
      approvedPercent: number;
      pendingPercent: number;
      isCritical: boolean;
    };
    control: PillarPillDetail;
    corrective: PillarPillDetail;
    change: PillarPillDetail;
    complete: PillarPillDetail;
  };
  disciplines: {
    me: { total: number; approved: number };
    ce: { total: number; approved: number };
    ee: { total: number; approved: number };
  };
  drawingTypes: string[];
  pendingAgingDays: number;
}

export type TrendMetricType = 'total_documents' | 'approved_count' | 'in_review_count' | 'overdue_count';

export interface DailyTrendDataPoint {
  date: string;
  [projectId: string]: number | string;
}

export interface IngestionBatchRecord {
  batchId: string;
  fileSha256: string | null;
  projectTarget: string;
  snapshotDate: string;
  totalRows: number;
  deltasUpdated: number;
  skippedUnchanged: number;
  status: 'INGESTED' | 'ALREADY_INGESTED' | 'FAILED' | string;
  createdAt: string;
  elapsedMs: number;
}

export interface ApiClientError extends Error {
  classification: 'network' | 'client' | 'conflict' | 'server';
  statusCode: number;
  statusHeader: string;
  statusDescription: string;
}

