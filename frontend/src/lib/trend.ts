export type TrendPreset = '30D' | '90D' | '180D' | '1Y' | 'ALL';

export interface DateWindow {
  startDate: string | null;
  endDate: string | null;
}

export function getPresetDateWindow(preset: TrendPreset, referenceDate: Date = new Date()): DateWindow {
  const end = new Date(referenceDate);
  const formatDate = (d: Date) => d.toISOString().split('T')[0] ?? '';

  if (preset === 'ALL') {
    return { startDate: null, endDate: formatDate(end) };
  }

  const start = new Date(referenceDate);
  switch (preset) {
    case '30D':
      start.setDate(start.getDate() - 30);
      break;
    case '90D':
      start.setDate(start.getDate() - 90);
      break;
    case '180D':
      start.setDate(start.getDate() - 180);
      break;
    case '1Y':
      start.setFullYear(start.getFullYear() - 1);
      break;
  }

  return {
    startDate: formatDate(start),
    endDate: formatDate(end),
  };
}

/**
 * Downsamples data points if array length exceeds maxPoints (default 730 points, approx 2 years daily).
 */
export function downsampleTrendPoints<T>(points: T[], maxPoints = 730): T[] {
  if (points.length <= maxPoints) return points;

  const result: T[] = [];
  const step = (points.length - 1) / (maxPoints - 1);

  for (let i = 0; i < maxPoints; i++) {
    const index = Math.round(i * step);
    const item = points[index];
    if (item !== undefined) {
      result.push(item);
    }
  }

  return result;
}

