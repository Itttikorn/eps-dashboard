import React from 'react';
import { IngestionBatchRecord } from '../../api/types';
import { formatDate, formatDurationMs } from '../../lib/format';
import { TableSkeleton } from '../../components/ui/Skeletons';
import { EmptyState } from '../../components/ui/EmptyState';

export interface IngestionHistoryTableProps {
  batches?: IngestionBatchRecord[];
  isLoading?: boolean;
}

export const IngestionHistoryTable: React.FC<IngestionHistoryTableProps> = ({
  batches = [],
  isLoading = false,
}) => {
  if (isLoading) {
    return <TableSkeleton rows={4} />;
  }

  if (batches.length === 0) {
    return (
      <EmptyState
        title="No Ingestion History"
        description="No daily CSV snapshot batches have been recorded in this session yet."
      />
    );
  }

  return (
    <div
      className="bg-white dark:bg-[#252526] border border-slate-200 dark:border-[#3c3c3c] rounded-xl overflow-hidden shadow-xs"
      data-testid="ingestion-history-table-container"
    >
      <div className="px-5 py-4 border-b border-slate-100 dark:border-[#3c3c3c] flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wide text-slate-800 dark:text-slate-100">
            Batch Ingestion Audit Ledger
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Operational ledger recording snapshot updates and processed row deltas
          </p>
        </div>
        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-[#1e1e1e] border dark:border-[#3c3c3c] text-slate-600 dark:text-slate-300">
          {batches.length} Batches Logged
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 dark:bg-[#1e1e1e] text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200/70 dark:border-[#3c3c3c]">
            <tr>
              <th className="py-3 px-4">Batch ID</th>
              <th className="py-3 px-4">Target Scope</th>
              <th className="py-3 px-4">Snapshot Date</th>
              <th className="py-3 px-4 text-right">Total Rows</th>
              <th className="py-3 px-4 text-right">Deltas Updated</th>
              <th className="py-3 px-4 text-right">Skipped Unchanged</th>
              <th className="py-3 px-4">Ingestion Status</th>
              <th className="py-3 px-4 text-right">Elapsed</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-[#3c3c3c] text-slate-700 dark:text-slate-300">
            {batches.map((batch) => {
              const isSuccess = batch.status === 'INGESTED' || batch.status === 'SUCCESS';
              const isAlready = batch.status === 'ALREADY_INGESTED';

              return (
                <tr
                  key={batch.batchId}
                  className="hover:bg-slate-50/60 dark:hover:bg-[#2a2d2e] transition-colors"
                >
                  <td className="py-3 px-4 font-mono font-medium text-slate-900 dark:text-slate-100">
                    {batch.batchId}
                  </td>
                  <td className="py-3 px-4 font-semibold text-blue-600 dark:text-blue-400">
                    {batch.projectTarget}
                  </td>
                  <td className="py-3 px-4 tabular-nums">{formatDate(batch.snapshotDate)}</td>
                  <td className="py-3 px-4 text-right font-bold tabular-nums">
                    {batch.totalRows.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                    +{batch.deltasUpdated.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right text-slate-400 tabular-nums">
                    {batch.skippedUnchanged.toLocaleString()}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        isSuccess
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                          : isAlready
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-300 dark:border-blue-800'
                          : 'bg-red-100 text-red-800 dark:bg-red-950/80 dark:text-red-300 border border-red-300 dark:border-red-800'
                      }`}
                    >
                      {batch.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right text-slate-400 tabular-nums">
                    {formatDurationMs(batch.elapsedMs)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

