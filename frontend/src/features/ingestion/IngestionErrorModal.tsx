import React from 'react';
import { Modal } from 'antd';
import { AlertTriangle, Clock, FileWarning } from 'lucide-react';

export interface IngestionErrorModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  isConflict?: boolean;
  errorMessage?: string;
  details?: string[];
}

export const IngestionErrorModal: React.FC<IngestionErrorModalProps> = ({
  open,
  onClose,
  title = 'CSV Ingestion Failed',
  isConflict = false,
  errorMessage = 'The uploaded CSV could not be processed.',
  details = [],
}) => {
  // Filter out any details that duplicate the main error message or empty entries
  const normalizedError = errorMessage.trim().toLowerCase();
  const distinctDetails = details.filter(
    (d) => d && d.trim() !== '' && d.trim().toLowerCase() !== normalizedError
  );

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={[
        <button
          key="close"
          type="button"
          onClick={onClose}
          className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 font-semibold rounded-lg text-xs transition-colors cursor-pointer"
        >
          Close
        </button>,
      ]}
      title={
        <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
          {isConflict ? <Clock className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          <span>{isConflict ? 'Chronology Downgrade Conflict (409)' : title}</span>
        </div>
      }
      data-testid="ingestion-error-modal"
    >
      <div className="py-2 text-xs text-slate-700 dark:text-slate-300">
        <p className="mb-3 font-medium">{errorMessage}</p>

        {isConflict ? (
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg text-amber-800 dark:text-amber-300 mb-3">
            <strong>Warning:</strong> The snapshot date in this file predates our most recent ingestion.
            Overwriting with older data would regress portfolio history. To proceed, verify the export date or provide a newer snapshot.
          </div>
        ) : null}

        {distinctDetails.length > 0 && (
          <div className="mt-3">
            <span className="font-semibold block mb-1.5 flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
              <FileWarning className="w-3.5 h-3.5 text-red-500" /> Detected Row Discrepancies:
            </span>
            <div className="max-h-48 overflow-y-auto bg-slate-50 dark:bg-slate-800 p-2.5 rounded border border-slate-200 dark:border-slate-700 font-mono text-[11px] space-y-1">
              {distinctDetails.map((d, i) => (
                <div key={i} className="text-red-600 dark:text-red-400">
                  {d}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
