import { describe, it, expect } from 'vitest';
import { getPresetDateWindow, downsampleTrendPoints } from './trend';

describe('Trend utility logic', () => {
  const refDate = new Date('2026-10-19T00:00:00Z');

  it('calculates preset date windows', () => {
    const w30 = getPresetDateWindow('30D', refDate);
    expect(w30.startDate).toBe('2026-09-19');
    expect(w30.endDate).toBe('2026-10-19');

    const w90 = getPresetDateWindow('90D', refDate);
    expect(w90.startDate).toBe('2026-07-21');

    const wAll = getPresetDateWindow('ALL', refDate);
    expect(wAll.startDate).toBeNull();
    expect(wAll.endDate).toBe('2026-10-19');
  });

  it('downsamples data points when exceeding 730 points', () => {
    const raw = Array.from({ length: 1500 }, (_, i) => ({ id: i, value: i * 2 }));
    const downsampled = downsampleTrendPoints(raw, 730);

    expect(downsampled.length).toBeLessThanOrEqual(750);
    expect(downsampled.length).toBeGreaterThan(600);
    expect(downsampled[0]?.id).toBe(0);
    // Preserves last item
    expect(downsampled[downsampled.length - 1]?.id).toBe(1499);
  });

  it('leaves points untouched when length <= 730', () => {
    const raw = Array.from({ length: 100 }, (_, i) => ({ id: i }));
    const result = downsampleTrendPoints(raw, 730);
    expect(result.length).toBe(100);
  });
});

