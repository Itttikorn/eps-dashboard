import React from 'react';
import { TrendPreset } from '../../lib/trend';

export interface PresetToolbarProps {
  currentPreset: TrendPreset;
  onSelectPreset: (preset: TrendPreset) => void;
  startDate?: string;
  endDate?: string;
  onCustomDateChange?: (start: string, end: string) => void;
}

export const PresetToolbar: React.FC<PresetToolbarProps> = ({
  currentPreset,
  onSelectPreset,
}) => {
  const presets: { id: TrendPreset; label: string }[] = [
    { id: '30D', label: '30 Days' },
    { id: '90D', label: '90 Days' },
    { id: '180D', label: '180 Days' },
    { id: '1Y', label: '1 Year' },
    { id: 'ALL', label: 'All Time' },
  ];

  return (
    <div className="flex items-center gap-1.5 flex-wrap" data-testid="preset-toolbar">
      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mr-1 hidden sm:inline">
        Preset Range:
      </span>
      <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
        {presets.map((p) => {
          const isSelected = currentPreset === p.id;

          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onSelectPreset(p.id)}
              aria-pressed={isSelected}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                isSelected
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 font-bold shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
              data-testid={`preset-btn-${p.id}`}
            >
              {p.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

