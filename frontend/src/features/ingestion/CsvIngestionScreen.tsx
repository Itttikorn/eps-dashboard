import React from 'react';
import { CsvUploadZone } from './CsvUploadZone';

export const CsvIngestionScreen: React.FC = () => {
  return (
    <div className="space-y-6" data-testid="csv-ingestion-screen">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          CSV Snapshot Ingestion
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Upload ConZol report (.csv) to update the portfolio database and metrics.
        </p>
      </div>

      {/* Upload Zone */}
      <CsvUploadZone />
    </div>
  );
};
