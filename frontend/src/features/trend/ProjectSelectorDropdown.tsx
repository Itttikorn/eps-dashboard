import React from 'react';
import { Checkbox } from 'antd';
import { getProjectColor } from '../../lib/palette';

export interface ProjectSelectorDropdownProps {
  availableProjects: { id: string; name: string }[];
  selectedProjectIds: string[];
  onToggleProject: (projectId: string) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
}

export const ProjectSelectorDropdown: React.FC<ProjectSelectorDropdownProps> = ({
  availableProjects,
  selectedProjectIds,
  onToggleProject,
  onSelectAll,
  onClearAll,
}) => {
  const allKnownIds = availableProjects.map((p) => p.id);

  return (
    <div
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs"
      data-testid="project-selector-dropdown"
    >
      <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100 dark:border-slate-800">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
          Projects to Compare ({selectedProjectIds.length}/{availableProjects.length})
        </h4>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onSelectAll}
            className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-semibold"
            data-testid="select-all-projects-btn"
          >
            Select All
          </button>
          <span className="text-slate-300 dark:text-slate-700">•</span>
          <button
            type="button"
            onClick={onClearAll}
            className="text-[11px] text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:underline font-semibold"
            data-testid="clear-all-projects-btn"
          >
            Clear All
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
        {availableProjects.map((proj) => {
          const isSelected = selectedProjectIds.includes(proj.id);
          const colorInfo = getProjectColor(proj.id, allKnownIds);

          return (
            <label
              key={proj.id}
              className={`flex items-center gap-2.5 p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                isSelected
                  ? 'bg-slate-50 dark:bg-slate-800/80 border-slate-300 dark:border-slate-700'
                  : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 opacity-60 hover:opacity-100'
              }`}
            >
              <Checkbox
                checked={isSelected}
                onChange={() => onToggleProject(proj.id)}
              />
              <span
                className="w-3 h-3 rounded-full shrink-0 shadow-2xs"
                style={{
                  backgroundColor: colorInfo.color,
                  border: colorInfo.isDashed ? '2px dashed #ffffff' : undefined,
                }}
              />
              <span className="font-semibold text-slate-800 dark:text-slate-200 truncate" title={`${proj.id} - ${proj.name}`}>
                {proj.id}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
};

