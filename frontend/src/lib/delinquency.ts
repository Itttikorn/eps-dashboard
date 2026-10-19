import { HealthStatus, NetChangeDirection } from '../api/types';

export function calculatePendingRatio(open: number, closed: number): number {
  const sum = open + closed;
  if (sum <= 0) return 0;
  return (open / sum) * 100;
}

export function isDelinquencyCritical(pendingRatio: number): boolean {
  return pendingRatio >= 45.0;
}

export function classifyOverdueHealth(overduePercent: number): {
  status: HealthStatus;
  label: string;
  badgeClass: string;
} {
  if (overduePercent > 15.0) {
    return {
      status: 'CRITICAL',
      label: 'CRITICAL',
      badgeClass: 'bg-red-100 text-red-800 dark:bg-red-950/70 dark:text-red-300 border border-red-300 dark:border-red-800',
    };
  }
  if (overduePercent >= 5.0) {
    return {
      status: 'ATTENTION',
      label: 'ATTENTION',
      badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-300 dark:border-amber-800',
    };
  }
  return {
    status: 'ON TRACK',
    label: 'ON TRACK',
    badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800',
  };
}

export function getTrendDirectionIndicator(direction: NetChangeDirection): {
  symbol: string;
  colorClass: string;
  label: string;
} {
  switch (direction) {
    case 'IMPROVING':
      // Backlog shrinking is positive (Green)
      return { symbol: '▼', colorClass: 'text-emerald-600 dark:text-emerald-400', label: 'Backlog shrinking' };
    case 'DEGRADING':
      // Backlog expanding is negative (Red)
      return { symbol: '▲', colorClass: 'text-red-600 dark:text-red-400', label: 'Backlog expanding' };
    case 'STABLE':
    default:
      return { symbol: '—', colorClass: 'text-slate-500 dark:text-slate-400', label: 'Backlog stable' };
  }
}

