import { describe, it, expect } from 'vitest';
import { formatNumber, formatPercent, formatDate, formatDurationMs } from './format';

describe('format utilities', () => {
  describe('formatNumber', () => {
    it('formats numbers with thousand separators', () => {
      expect(formatNumber(12450)).toBe('12,450');
      expect(formatNumber(0)).toBe('0');
    });

    it('returns dash for null/undefined/NaN', () => {
      expect(formatNumber(null)).toBe('—');
      expect(formatNumber(undefined)).toBe('—');
      expect(formatNumber(NaN)).toBe('—');
    });
  });

  describe('formatPercent', () => {
    it('formats percentages with given decimals', () => {
      expect(formatPercent(12.345, 1)).toBe('12.3%');
      expect(formatPercent(50, 2)).toBe('50.00%');
    });

    it('returns dash for null/undefined/NaN', () => {
      expect(formatPercent(null)).toBe('—');
      expect(formatPercent(undefined)).toBe('—');
      expect(formatPercent(NaN)).toBe('—');
    });
  });

  describe('formatDate', () => {
    it('formats valid ISO date strings', () => {
      expect(formatDate('2026-03-31')).toContain('2026');
    });

    it('returns dash for empty/null date string', () => {
      expect(formatDate('')).toBe('—');
      expect(formatDate(null)).toBe('—');
      expect(formatDate(undefined)).toBe('—');
    });

    it('returns raw string for invalid date', () => {
      expect(formatDate('invalid-date-xyz')).toBe('invalid-date-xyz');
    });
  });

  describe('formatDurationMs', () => {
    it('formats milliseconds below 1000', () => {
      expect(formatDurationMs(450)).toBe('450 ms');
    });

    it('formats seconds above 1000', () => {
      expect(formatDurationMs(2500)).toBe('2.50 s');
    });

    it('returns dash for null/undefined/NaN', () => {
      expect(formatDurationMs(null)).toBe('—');
      expect(formatDurationMs(undefined)).toBe('—');
      expect(formatDurationMs(NaN)).toBe('—');
    });
  });
});

