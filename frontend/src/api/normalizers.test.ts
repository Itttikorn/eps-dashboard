import { describe, it, expect } from 'vitest';
import {
  normalizeGlobalSummary,
  normalizeHistoricalTrends,
  normalizeIngestionResult,
  normalizeProjectMatrixRow,
  normalizeHealthStatus,
  normalizeNetChange,
} from './normalizers';
import { GlobalSummaryContract, ProjectContractRow, TrendPointContract } from './types';

describe('Normalizers', () => {
  describe('normalizeHealthStatus', () => {
    it('maps thresholds correctly', () => {
      expect(normalizeHealthStatus(4.9)).toBe('ON TRACK');
      expect(normalizeHealthStatus(5.0)).toBe('ATTENTION');
      expect(normalizeHealthStatus(15.0)).toBe('ATTENTION');
      expect(normalizeHealthStatus(15.1)).toBe('CRITICAL');
    });
  });

  describe('normalizeNetChange', () => {
    it('normalizes directions', () => {
      expect(normalizeNetChange('IMPROVING')).toBe('IMPROVING');
      expect(normalizeNetChange('DOWN')).toBe('IMPROVING');
      expect(normalizeNetChange('DEGRADING')).toBe('DEGRADING');
      expect(normalizeNetChange('UP')).toBe('DEGRADING');
      expect(normalizeNetChange('STABLE')).toBe('STABLE');
      expect(normalizeNetChange(null)).toBe('STABLE');
    });
  });

  describe('normalizeGlobalSummary', () => {
    it('handles null/undefined gracefully', () => {
      const summary = normalizeGlobalSummary(null);
      expect(summary.totalProjects).toBe(0);
      expect(summary.totalDocuments).toBe(0);
      expect(summary.categories).toBeNull();
      expect(summary.lastUpdatedAt).toBeNull();
    });

    it('normalizes contract-shaped summary', () => {
      const contract: GlobalSummaryContract = {
        total_projects: 5,
        total_documents: 1000,
        total_overdue: 45,
        under_review_documents: 120,
        category_counts: {
          baseline_drawings: 300,
          control: 250,
          corrective: 150,
          change: 200,
          complete: 100,
        },
        last_updated_at: '2026-10-19T10:00:00Z',
      };

      const res = normalizeGlobalSummary(contract);
      expect(res.totalProjects).toBe(5);
      expect(res.totalDocuments).toBe(1000);
      expect(res.totalOverdue).toBe(45);
      expect(res.overdueRatePercent).toBe(4.5);
      expect(res.overallBacklog).toBe(120);
      expect(res.categories?.baseline.total).toBe(300);
      expect(res.categories?.control.open).toBe(250);
      expect(res.lastUpdatedAt).toBe('2026-10-19T10:00:00Z');
    });

    it('falls back to legacy field names when contract fields are missing', () => {
      const legacy: GlobalSummaryContract = {
        total_projects: 3,
        total_documents: 500,
        overdue_documents: 60,
        under_review_documents: 80,
      };

      const res = normalizeGlobalSummary(legacy);
      expect(res.totalOverdue).toBe(60);
      expect(res.overdueRatePercent).toBe(12);
    });
  });

  describe('normalizeProjectMatrixRow', () => {
    it('normalizes full project row and calculates critical flags at 45%', () => {
      const row: ProjectContractRow = {
        project_id: 'PRJ-101',
        site_code: 'BKK',
        project_name: 'Bangkok Solar Site',
        total_documents: 100,
        overdue_count: 8,
        net_change: 'DEGRADING',
        baseline_drawings: {
          total: 50,
          approved: 25,
          in_review: 20,
          overdue: 5,
        },
        control: {
          total: 20,
          open: 10,
          closed: 10,
        },
        corrective: {
          total: 10,
          open: 5,
          closed: 5,
        },
        change: {
          total: 10,
          open: 2,
          closed: 8,
        },
        complete: {
          total: 10,
          open: 1,
          closed: 9,
        },
      };

      const res = normalizeProjectMatrixRow(row);
      expect(res.projectId).toBe('PRJ-101');
      expect(res.healthStatus).toBe('ATTENTION');
      expect(res.netChange).toBe('DEGRADING');
      // baseline pending: (20 + 5) / 50 = 50% => isCritical true
      expect(res.pillars.baseline.isCritical).toBe(true);
      // control pending: 10 / (10+10) = 50% => isCritical true
      expect(res.pillars.control.isCritical).toBe(true);
      // change pending: 2 / 10 = 20% => isCritical false
      expect(res.pillars.change.isCritical).toBe(false);
    });

    it('tolerates legacy project_code instead of project_id', () => {
      const row: ProjectContractRow = {
        project_code: 'LEGACY-CODE',
        total_documents: 0,
      };

      const res = normalizeProjectMatrixRow(row);
      expect(res.projectId).toBe('LEGACY-CODE');
      expect(res.healthStatus).toBe('ON TRACK');
    });

    it('tolerates baseline_drawings as a raw number', () => {
      const row: ProjectContractRow = {
        project_id: 'PRJ-102',
        total_documents: 45,
        baseline_drawings: 33,
      };

      const res = normalizeProjectMatrixRow(row);
      expect(res.pillars.baseline.total).toBe(33);
    });
  });

  describe('normalizeHistoricalTrends', () => {
    it('normalizes trend points by selected metric', () => {
      const points: TrendPointContract[] = [
        {
          date: '2026-10-01',
          project_metrics: {
            'PRJ-1': { total_documents: 100, overdue_count: 5 },
            'PRJ-2': { total_documents: 200, overdue_count: 15 },
          },
        },
        {
          date: '2026-10-02',
          project_metrics: {
            'PRJ-1': { total_documents: 105, overdue_count: 4 },
            'PRJ-2': { total_documents: 210, overdue_count: 14 },
          },
        },
      ];

      const res = normalizeHistoricalTrends(points, 'total_documents');
      expect(res).toHaveLength(2);
      expect(res[0]?.['date']).toBe('2026-10-01');
      expect(res[0]?.['PRJ-1']).toBe(100);
      expect(res[0]?.['PRJ-2']).toBe(200);

      const overdueRes = normalizeHistoricalTrends(points, 'overdue_count');
      expect(overdueRes[1]?.['PRJ-1']).toBe(4);
      expect(overdueRes[1]?.['PRJ-2']).toBe(14);
    });
  });

  describe('normalizeIngestionResult', () => {
    it('normalizes batch response', () => {
      const res = normalizeIngestionResult({
        batch_id: 'b-999',
        status: 'INGESTED',
        total_rows: 500,
        deltas_updated: 45,
        skipped_unchanged: 455,
      });

      expect(res.batchId).toBe('b-999');
      expect(res.totalRows).toBe(500);
      expect(res.deltasUpdated).toBe(45);
      expect(res.skippedUnchanged).toBe(455);
    });
  });
});

