import React from 'react';
import { useIngestionHistory } from '../../api/queries';
import { CsvUploadZone } from './CsvUploadZone';
import { IngestionHistoryTable } from './IngestionHistoryTable';
import { ErrorAlert } from '../../components/ui/ErrorAlert';

export const CsvIngestionScreen: React.FC = () => {
  const { data: batches = [], isLoading, isError, error, refetch } = useIngestionHistory();

  return (
    <div className="space-y-6" data-testid="csv-ingestion-screen">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          CSV Snapshot Ingestion & Batch Ledger
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Upload daily engineering document exports (Conzol CSV), monitor batch deltas, and review historical audit entries.
        </p>
      </div>

      {isError && (
        <ErrorAlert
          title="Failed to Load Ingestion Ledger"
          message={error instanceof Error ? error.message : 'Unable to retrieve ingestion history.'}
          onRetry={() => refetch()}
        />
      )}

      {/* Upload Zone */}
      <CsvUploadZone onUploadSuccess={() => refetch()} />

      {/* Ingestion Batch Audit Table */}
      <IngestionHistoryTable batches={batches} isLoading={isLoading} />
    </div>
  );
};

