export const MAX_UPLOAD_BYTES = 52428800; // 50 MB in bytes

export const ALLOWED_CSV_MIME_TYPES = new Set([
  'text/csv',
  'application/vnd.ms-excel',
  'text/plain',
  '', // Some operating systems/browsers leave file.type blank for .csv
]);

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

export function validateCsvFile(file: File): FileValidationResult {
  if (!file) {
    return { valid: false, error: 'No file selected.' };
  }

  // Check file extension (.csv case-insensitive)
  const name = file.name || '';
  if (!/\.csv$/i.test(name)) {
    return {
      valid: false,
      error: `Invalid file format "${name}". Only .csv files are supported.`,
    };
  }

  // Check MIME type if present
  if (file.type && !ALLOWED_CSV_MIME_TYPES.has(file.type)) {
    return {
      valid: false,
      error: `Unsupported MIME type "${file.type}". Please upload a standard CSV file.`,
    };
  }

  // Check size limit (<= 50MB)
  if (file.size > MAX_UPLOAD_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `File size exceeds 50 MB limit (${sizeMb} MB). Please upload a smaller snapshot.`,
    };
  }

  return { valid: true };
}

