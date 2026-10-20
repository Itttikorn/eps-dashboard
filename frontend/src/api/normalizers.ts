import {
  CategoryMetricsContract,
  GlobalSummaryContract,
  GlobalSummaryData,
  HealthStatus,
  IngestionBatchRecord,
  IngestionResultContract,
  NetChangeDirection,
  PillarPillDetail,
  ProjectContractRow,
  ProjectMatrixRow,
  TrendPointContract,
  DailyTrendDataPoint,
} from './types';

export function normalizeHealthStatus(overduePercent: number): HealthStatus {
  if (overduePercent > 15) return 'CRITICAL';
  if (overduePercent >= 5) return 'ATTENTION';
  return 'ON TRACK';
}

export function normalizeNetChange(val?: string | null): NetChangeDirection {
  if (!val) return 'STABLE';
  const upper = val.toUpperCase();
  if (upper === 'IMPROVING' || upper === 'DECREASING' || upper === 'DOWN') return 'IMPROVING';
  if (upper === 'DEGRADING' || upper === 'INCREASING' || upper === 'UP') return 'DEGRADING';
  return 'STABLE';
}

function normalizePillarDetail(contract?: CategoryMetricsContract): PillarPillDetail {
  const total = contract?.total ?? 0;
  const open = contract?.open ?? 0;
  const closed = contract?.closed ?? (total > open ? total - open : 0);
  const sum = open + closed;
  const pendingPercent = sum > 0 ? (open / sum) * 100 : 0;
  const isCritical = contract?.is_critical ?? (pendingPercent >= 45.0);

  return {
    total,
    open,
    closed,
    pendingPercent,
    isCritical,
  };
}

export function normalizeGlobalSummary(raw?: GlobalSummaryContract | null): GlobalSummaryData {
  if (!raw) {
    return {
      totalProjects: 0,
      totalDocuments: 0,
      totalOverdue: 0,
      overallBacklog: 0,
      overdueRatePercent: 0,
      categories: null,
      lastUpdatedAt: null,
    };
  }

  const totalProjects = raw.total_projects ?? 0;
  const totalDocuments = raw.total_documents ?? 0;
  const totalOverdue = raw.total_overdue ?? raw.overdue_documents ?? 0;
  const overallBacklog = raw.under_review_documents ?? 0;
  const overdueRatePercent =
    totalDocuments > 0 ? (totalOverdue / totalDocuments) * 100 : 0;

  const cats = raw.category_counts;
  const categories = cats
    ? {
        baseline: {
          total: cats.baseline_drawings ?? 0,
          approved: raw.approved_documents ?? 0,
          inReview: raw.under_review_documents ?? 0,
          overdue: totalOverdue,
        },
        control: {
          open: cats.control ?? 0,
          closed: 0,
        },
        corrective: {
          open: cats.corrective ?? 0,
          closed: 0,
        },
        change: {
          open: cats.change ?? 0,
          closed: 0,
        },
        complete: {
          preCommissioning: cats.complete ?? 0,
          postCommissioning: 0,
        },
      }
    : null;

  return {
    totalProjects,
    totalDocuments,
    totalOverdue,
    overallBacklog,
    overdueRatePercent,
    categories,
    lastUpdatedAt: raw.last_updated_at ?? null,
  };
}

export function normalizeProjectMatrixRow(raw: ProjectContractRow): ProjectMatrixRow {
  const projectId = raw.project_id || raw.project_code || 'UNKNOWN';
  const projectCode = raw.project_code || raw.project_id || 'UNKNOWN';
  const projectName = raw.project_name || projectCode;
  const siteCode = raw.site_code || 'DEFAULT';

  const totalDocuments = raw.total_documents ?? 0;
  const overdueCount = raw.overdue_count ?? 0;
  const overduePercent = totalDocuments > 0 ? (overdueCount / totalDocuments) * 100 : 0;
  const healthStatus = normalizeHealthStatus(overduePercent);
  const netChange = normalizeNetChange(raw.net_change);

  // Baseline drawings pillar
  let baseTotal = 0;
  let baseApproved = 0;
  let baseInReview = 0;
  let baseOverdue = 0;

  if (typeof raw.baseline_drawings === 'number') {
    baseTotal = raw.baseline_drawings;
  } else if (raw.baseline_drawings && typeof raw.baseline_drawings === 'object') {
    baseTotal = raw.baseline_drawings.total ?? 0;
    baseApproved = raw.baseline_drawings.approved ?? 0;
    baseInReview = raw.baseline_drawings.in_review ?? 0;
    baseOverdue = raw.baseline_drawings.overdue ?? 0;
  }

  const baseApprovedPercent = baseTotal > 0 ? (baseApproved / baseTotal) * 100 : 0;
  const pendingDrawings = Math.max(0, baseTotal - baseApproved);
  const basePendingPercent = baseTotal > 0 ? Math.min(100, (pendingDrawings / baseTotal) * 100) : 0;

  const baselinePillar = {
    total: baseTotal,
    approved: baseApproved,
    inReview: baseInReview,
    overdue: baseOverdue,
    approvedPercent: baseApprovedPercent,
    pendingPercent: basePendingPercent,
    isCritical: basePendingPercent >= 45.0,
  };

  const controlPillar = normalizePillarDetail(raw.control);
  const correctivePillar = normalizePillarDetail(raw.corrective);
  const changePillar = normalizePillarDetail(raw.change);
  const fcrPillar = normalizePillarDetail(raw.fcr ?? raw.change);
  const dcrPillar = normalizePillarDetail(raw.dcr);
  const vorPillar = normalizePillarDetail(raw.vor);
  const completePillar = normalizePillarDetail(raw.complete);

  // Overall counts
  const calculatedApproved = baseApproved + controlPillar.closed + correctivePillar.closed + changePillar.closed + completePillar.closed;
  const calculatedInReview = baseInReview + controlPillar.open + correctivePillar.open + changePillar.open + completePillar.open;

  const approvedCount = calculatedApproved > 0 || totalDocuments === 0
    ? calculatedApproved
    : ((raw as unknown as { approved_documents?: number }).approved_documents ?? 0);
  const inReviewCount = calculatedInReview > 0 || totalDocuments === 0
    ? calculatedInReview
    : ((raw as unknown as { under_review_documents?: number }).under_review_documents ?? 0);
  const approvedPercent = totalDocuments > 0 ? (approvedCount / totalDocuments) * 100 : 0;
  const inReviewPercent = totalDocuments > 0 ? (inReviewCount / totalDocuments) * 100 : 0;

  return {
    projectId,
    projectCode,
    projectName,
    siteCode,
    healthStatus,
    totalDocuments,
    approvedCount,
    approvedPercent,
    inReviewCount,
    inReviewPercent,
    overdueCount,
    overduePercent,
    netChange,
    lastSnapshotDate: raw.last_snapshot_date ?? null,
    pillars: {
      baseline: baselinePillar,
      control: controlPillar,
      corrective: correctivePillar,
      change: changePillar,
      fcr: fcrPillar,
      dcr: dcrPillar,
      vor: vorPillar,
      complete: completePillar,
    },
    disciplines: {
      me: {
        total: raw.disciplines?.me?.total ?? 0,
        approved: raw.disciplines?.me?.approved ?? 0,
      },
      ce: {
        total: raw.disciplines?.ce?.total ?? 0,
        approved: raw.disciplines?.ce?.approved ?? 0,
      },
      ee: {
        total: raw.disciplines?.ee?.total ?? 0,
        approved: raw.disciplines?.ee?.approved ?? 0,
      },
    },
    drawingTypes: raw.drawing_types ?? ['FS', 'ML', 'PR', 'GA', 'LD', 'FD', 'PID', 'SLD'],
    pendingAgingDays: raw.pending_aging_days ?? 0,
  };
}

export function normalizeHistoricalTrends(
  points: TrendPointContract[],
  selectedMetric: 'total_documents' | 'approved_count' | 'in_review_count' | 'overdue_count' = 'total_documents'
): DailyTrendDataPoint[] {
  if (!Array.isArray(points)) return [];

  return points.map((pt) => {
    const row: DailyTrendDataPoint = {
      date: pt.date,
    };

    if (pt.project_metrics) {
      for (const [projId, metrics] of Object.entries(pt.project_metrics)) {
        row[projId] = metrics[selectedMetric] ?? 0;
      }
    }

    return row;
  });
}

export function normalizeIngestionResult(raw: IngestionResultContract): IngestionBatchRecord {
  return {
    batchId: raw.batch_id || 'UNKNOWN',
    fileSha256: raw.file_sha256 ?? null,
    projectTarget: raw.project_code || 'PORTFOLIO',
    snapshotDate: raw.snapshot_date || new Date().toISOString().split('T')[0] || '',
    totalRows: raw.total_rows ?? raw.processed_count ?? 0,
    deltasUpdated: raw.deltas_updated ?? 0,
    skippedUnchanged: raw.skipped_unchanged ?? 0,
    status: raw.status || 'INGESTED',
    createdAt: raw.created_at || new Date().toISOString(),
    elapsedMs: raw.elapsed_ms ?? 0,
  };
}

