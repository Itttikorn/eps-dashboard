import React from 'react';
import { NetChangeDirection } from '../../api/types';
import { classifyOverdueHealth, getTrendDirectionIndicator } from '../../lib/delinquency';

export const CategoryBadge: React.FC<{
  name: string;
  color: string;
  count?: number;
  active?: boolean;
  onClick?: () => void;
}> = ({ name, color, count, active = false, onClick }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      style={{
        borderColor: active ? color : undefined,
        backgroundColor: active ? `${color}15` : undefined,
      }}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
        active
          ? 'font-semibold shadow-xs'
          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
      } ${onClick ? 'cursor-pointer' : 'cursor-default'}`}
      data-testid={`category-badge-${name.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
      <span>{name}</span>
      {count !== undefined && (
        <span className="text-[11px] font-bold opacity-80 tabular-nums">({count})</span>
      )}
    </button>
  );
};

export const DelinquencyChip: React.FC<{
  pendingPercent: number;
  isCritical: boolean;
}> = ({ pendingPercent, isCritical }) => {
  if (!isCritical) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 tabular-nums">
        {pendingPercent.toFixed(1)}% pending
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 dark:bg-red-950/80 dark:text-red-300 border border-red-400 dark:border-red-700 chip-blink tabular-nums shadow-xs"
      data-testid="delinquency-critical-chip"
    >
      <span className="w-1.5 h-1.5 rounded-full bg-red-600 dark:bg-red-400 animate-ping" />
      {pendingPercent.toFixed(1)}% DELINQUENT
    </span>
  );
};

export const OverdueBadge: React.FC<{ overduePercent: number; overdueCount?: number }> = ({
  overduePercent,
  overdueCount,
}) => {
  const health = classifyOverdueHealth(overduePercent);

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold tabular-nums ${health.badgeClass}`}
      data-testid={`overdue-badge-${health.status.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <span>{health.label}</span>
      {overdueCount !== undefined && (
        <span className="opacity-90">({overdueCount} docs • {overduePercent.toFixed(1)}%)</span>
      )}
    </span>
  );
};

export const TrendTag: React.FC<{ direction: NetChangeDirection }> = ({ direction }) => {
  const info = getTrendDirectionIndicator(direction);

  return (
    <span
      className={`inline-flex items-center gap-1 font-bold text-xs tabular-nums ${info.colorClass}`}
      title={info.label}
      data-testid={`trend-tag-${direction.toLowerCase()}`}
    >
      <span>{info.symbol}</span>
      <span className="text-[11px] font-medium">{direction}</span>
    </span>
  );
};

