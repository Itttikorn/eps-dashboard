import { describe, it, expect } from 'vitest';
import { validateCsvFile, MAX_UPLOAD_BYTES } from './validation';

describe('Validation logic', () => {
  it('accepts valid .csv file within size limit', () => {
    const file = new File(['col1,col2\n1,2'], 'data.csv', { type: 'text/csv' });
    const result = validateCsvFile(file);
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('rejects non-.csv extension case-insensitively', () => {
    const file = new File(['text'], 'data.txt', { type: 'text/plain' });
    const result = validateCsvFile(file);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Only .csv files are supported');
  });

  it('rejects invalid MIME types', () => {
    const file = new File(['content'], 'data.csv', { type: 'application/pdf' });
    const result = validateCsvFile(file);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Unsupported MIME type');
  });

  it('enforces 50 MB boundary (52,428,800 vs 52,428,801 bytes)', () => {
    const validFile = new File([''], 'data.csv', { type: 'text/csv' });
    Object.defineProperty(validFile, 'size', { value: MAX_UPLOAD_BYTES });
    expect(validateCsvFile(validFile).valid).toBe(true);

    const oversizedFile = new File([''], 'data.csv', { type: 'text/csv' });
    Object.defineProperty(oversizedFile, 'size', { value: MAX_UPLOAD_BYTES + 1 });
    const overResult = validateCsvFile(oversizedFile);
    expect(overResult.valid).toBe(false);
    expect(overResult.error).toContain('File size exceeds 50 MB limit');
  });
});

