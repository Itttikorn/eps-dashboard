export function formatNumber(val?: number | null): string {
  if (val === undefined || val === null || isNaN(val)) return '—';
  return new Intl.NumberFormat('en-US').format(val);
}

export function formatPercent(val?: number | null, decimals = 1): string {
  if (val === undefined || val === null || isNaN(val)) return '—';
  return `${val.toFixed(decimals)}%`;
}

export function formatDate(dateString?: string | null): string {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
}

export function formatDurationMs(ms?: number | null): string {
  if (ms === undefined || ms === null || isNaN(ms)) return '—';
  if (ms < 1000) return `${ms} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

