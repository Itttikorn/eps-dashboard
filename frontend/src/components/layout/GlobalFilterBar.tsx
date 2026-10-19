import React from 'react';
import { Calendar, Filter } from 'lucide-react';
import { Select, DatePicker } from 'antd';
import dayjs, { Dayjs } from 'dayjs';

export interface GlobalFilterBarProps {
  allProjects: { id: string; name: string }[];
  selectedProjectIds: string[];
  onSelectProjectIds: (ids: string[]) => void;
  snapshotDate: string;
  onSnapshotDateChange: (date: string) => void;
}

export const GlobalFilterBar: React.FC<GlobalFilterBarProps> = ({
  allProjects,
  selectedProjectIds,
  onSelectProjectIds,
  snapshotDate,
  onSnapshotDateChange,
}) => {
  const handleQuickPreset = (preset: 'today' | 'yesterday' | 'latest') => {
    const today = new Date();
    if (preset === 'today') {
      onSnapshotDateChange(today.toISOString().split('T')[0] ?? '');
    } else if (preset === 'yesterday') {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      onSnapshotDateChange(yesterday.toISOString().split('T')[0] ?? '');
    } else {
      // Latest snapshot
      onSnapshotDateChange('2026-03-31');
    }
  };

  const projectOptions = allProjects.map((p) => ({
    label: `${p.id} - ${p.name}`,
    value: p.id,
  }));

  return (
    <div
      className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 py-3 px-4 sm:px-6 lg:px-8 shadow-2xs transition-colors"
      data-testid="global-filter-bar"
    >
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        {/* Multi-Project Selector */}
        <div className="flex items-center gap-2 flex-1 min-w-[280px] max-w-xl">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 shrink-0">
            Projects:
          </span>
          <Select
            mode="multiple"
            allowClear
            style={{ width: '100%' }}
            placeholder="All Projects (Active Portfolio)"
            value={selectedProjectIds}
            onChange={onSelectProjectIds}
            options={projectOptions}
            maxTagCount="responsive"
            className="text-xs"
          />
        </div>

        {/* Snapshot Date Picker & Quick Presets */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 shrink-0">
              Snapshot Date:
            </span>
            <DatePicker
              value={snapshotDate ? dayjs(snapshotDate) : undefined}
              onChange={(_: Dayjs | null, dateString: string | string[]) => {
                if (typeof dateString === 'string' && dateString) {
                  onSnapshotDateChange(dateString);
                }
              }}
              className="text-xs"
              allowClear={false}
            />
          </div>

          {/* Quick Date Presets */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => handleQuickPreset('latest')}
              className="px-2 py-1 text-[11px] font-medium rounded text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition-colors"
            >
              Latest
            </button>
            <button
              type="button"
              onClick={() => handleQuickPreset('yesterday')}
              className="px-2 py-1 text-[11px] font-medium rounded text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition-colors"
            >
              Yesterday
            </button>
            <button
              type="button"
              onClick={() => handleQuickPreset('today')}
              className="px-2 py-1 text-[11px] font-medium rounded text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition-colors"
            >
              Today
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

