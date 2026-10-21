import React, { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { UploadCloud, CheckCircle2, AlertCircle, FileText, Loader2 } from 'lucide-react';
import { validateCsvFile } from '../../lib/validation';
import { useUploadSnapshot } from '../../api/queries';
import { IngestionErrorModal } from './IngestionErrorModal';
import { IngestionBatchRecord, ApiClientError } from '../../api/types';

export interface CsvUploadZoneProps {
  onUploadSuccess?: (result: IngestionBatchRecord) => void;
}

export const CsvUploadZone: React.FC<CsvUploadZoneProps> = ({ onUploadSuccess }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<IngestionBatchRecord | null>(null);
  const [errorDetails, setErrorDetails] = useState<{
    open: boolean;
    title: string;
    message: string;
    isConflict: boolean;
    details: string[];
  }>({
    open: false,
    title: '',
    message: '',
    isConflict: false,
    details: [],
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadMutation = useUploadSnapshot();

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file) processSelectedFile(file);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file) processSelectedFile(file);
    }
  };

  const processSelectedFile = (file: File) => {
    setSuccessResult(null);
    setValidationError(null);

    const validation = validateCsvFile(file);
    if (!validation.valid) {
      setValidationError(validation.error || 'Invalid file');
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  const handleUploadSubmit = async () => {
    if (!selectedFile) return;

    try {
      const record = await uploadMutation.mutateAsync({ file: selectedFile });
      setSuccessResult(record);
      setSelectedFile(null);
      onUploadSuccess?.(record);
    } catch (err: unknown) {
      const apiErr = err as ApiClientError;
      const isConflict = apiErr.classification === 'conflict' || apiErr.statusCode === 409;
      const isValidation = apiErr.statusCode === 400;

      setErrorDetails({
        open: true,
        title: isConflict
          ? 'Chronology Conflict'
          : isValidation
          ? 'Invalid CSV Format'
          : 'Upload Ingestion Failed',
        message: apiErr.statusDescription || 'Unable to process CSV file on the server.',
        isConflict,
        details: isConflict
          ? ['Existing dataset snapshot is more recent than this file.']
          : isValidation
          ? [apiErr.statusDescription || 'Check CSV formatting, headers, and UTF-8 encoding.']
          : [apiErr.statusDescription || 'An internal server error occurred. Please check docker container logs.'],
      });
    }
  };

  return (
    <div className="bg-white dark:bg-[#252526] border border-slate-200 dark:border-[#3c3c3c] rounded-xl p-6 shadow-xs" data-testid="csv-upload-zone">
      <div className="pb-3 mb-4 border-b border-slate-100 dark:border-[#3c3c3c]">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100">
          CSV Snapshot Ingestion
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-300 mt-0.5">
          Upload ConZol report (.csv) (Max 50 MB)
        </p>
      </div>

      {/* Drag & Drop Visual Box */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
          isDragOver
            ? 'border-blue-500 dark:border-[#3794ff] bg-blue-50/70 dark:bg-[#007acc]/15'
            : 'border-slate-300 dark:border-[#3c3c3c] hover:border-blue-500 dark:hover:border-[#007acc] bg-slate-50/70 dark:bg-[#1e1e1e] hover:bg-blue-50/20 dark:hover:bg-[#2a2d2e]'
        }`}
        data-testid="dropzone-area"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="hidden"
          data-testid="file-input"
        />

        <div className="w-14 h-14 rounded-full bg-blue-100 dark:bg-[#007acc]/20 text-blue-600 dark:text-[#3794ff] border border-blue-200 dark:border-[#007acc]/40 flex items-center justify-center mx-auto mb-3">
          <UploadCloud className="w-7 h-7" />
        </div>

        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">
          Drag & Drop CSV snapshot file here
        </h4>
        <p className="text-xs text-slate-600 dark:text-slate-300 max-w-sm mx-auto mb-2">
          or click anywhere to browse from your computer.
        </p>
        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          Limit: 50 MB • Format: .CSV
        </span>
      </div>

      {/* Validation Error Banner */}
      {validationError && (
        <div className="mt-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 flex items-center gap-2.5 text-xs text-red-700 dark:text-red-300">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600 dark:text-red-400" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Selected File Card & Submit CTA */}
      {selectedFile && (
        <div className="mt-4 p-4 rounded-lg bg-slate-100/80 dark:bg-[#1e1e1e] border border-slate-200 dark:border-[#3c3c3c] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 truncate">
            <div className="w-9 h-9 rounded bg-blue-100 dark:bg-[#007acc]/20 text-blue-600 dark:text-[#3794ff] flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="truncate text-xs">
              <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                {selectedFile.name}
              </p>
              <p className="text-slate-500 dark:text-slate-400 tabular-nums">
                {(selectedFile.size / 1024).toFixed(1)} KB
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setSelectedFile(null)}
              disabled={uploadMutation.isPending}
              className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded hover:bg-slate-200/60 dark:hover:bg-[#2d2d2d] transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleUploadSubmit}
              disabled={uploadMutation.isPending}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 dark:bg-[#007acc] dark:hover:bg-[#0e639c] disabled:bg-blue-400 text-white text-xs font-semibold shadow-xs transition-colors"
              data-testid="submit-upload-btn"
            >
              {uploadMutation.isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Submit Snapshot</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Success Receipt Feedback */}
      {successResult && (
        <div
          className="mt-4 p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs"
          data-testid="upload-success-receipt"
        >
          <div className="flex items-center gap-2 font-bold mb-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Snapshot Ingested Successfully!</span>
          </div>
          <p className="text-[11px] text-emerald-800 dark:text-emerald-300">
            Batch ID: <strong className="font-mono">{successResult.batchId}</strong> • Total Rows:{' '}
            <strong className="tabular-nums">{successResult.totalRows}</strong> • Deltas Updated:{' '}
            <strong className="tabular-nums">{successResult.deltasUpdated}</strong> • Deduplicated Rows:{' '}
            <strong className="tabular-nums">{successResult.skippedUnchanged}</strong>
          </p>
        </div>
      )}

      {/* Error Diagnostics Modal */}
      <IngestionErrorModal
        open={errorDetails.open}
        onClose={() => setErrorDetails((prev) => ({ ...prev, open: false }))}
        title={errorDetails.title}
        isConflict={errorDetails.isConflict}
        errorMessage={errorDetails.message}
        details={errorDetails.details}
      />
    </div>
  );
};

