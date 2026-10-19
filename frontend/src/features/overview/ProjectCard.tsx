import React from 'react';
import { ProjectMatrixRow } from '../../api/types';
import { OverdueBadge, DelinquencyChip, TrendTag } from '../../components/ui/Badges';
import { DisciplineAccordion } from './DisciplineAccordion';

export interface ProjectCardProps {
  project: ProjectMatrixRow;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
  const pillarsList = [
    { key: 'baseline', name: 'Baseline Drawings', color: '#2f6fce', data: project.pillars.baseline },
    { key: 'control', name: 'Control (ITP/RFI)', color: '#12a4a0', data: project.pillars.control },
    { key: 'corrective', name: 'Corrective (NCR/CAR)', color: '#ee8a1f', data: project.pillars.corrective },
    { key: 'change', name: 'Change (PCR/DCR)', color: '#26a65b', data: project.pillars.change },
    { key: 'complete', name: 'Complete (Punchlist)', color: '#8b5cf6', data: project.pillars.complete },
  ] as const;

  return (
    <div
      className="bg-white dark:bg-[#252526] border border-slate-200 dark:border-[#3c3c3c] rounded-xl p-5 shadow-xs transition-shadow hover:shadow-md"
      data-testid={`project-card-${project.projectId}`}
    >
      {/* Header: Project Site Code, ID, Name, Health Badge, Net Change */}
      <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-slate-100 dark:border-[#3c3c3c]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800 dark:bg-[#007acc]/20 dark:text-[#3794ff] border border-blue-200 dark:border-[#007acc]/40">
              {project.siteCode}
            </span>
            <span className="text-xs font-mono font-semibold text-slate-500 dark:text-slate-400">
              {project.projectId}
            </span>
            <TrendTag direction={project.netChange} />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate max-w-md">
            {project.projectName}
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <OverdueBadge
            overduePercent={project.overduePercent}
            overdueCount={project.overdueCount}
          />
        </div>
      </div>

      {/* Summary KPI Row */}
      <div className="grid grid-cols-4 gap-2 my-3 py-2.5 px-2 bg-slate-50 dark:bg-[#1e1e1e] border border-slate-200 dark:border-[#3c3c3c] rounded-lg text-center text-xs">
        <div>
          <span className="block text-[11px] font-medium text-slate-500 dark:text-slate-400">Total Docs</span>
          <span className="font-bold text-slate-900 dark:text-slate-100 tabular-nums">
            {project.totalDocuments.toLocaleString()}
          </span>
        </div>
        <div>
          <span className="block text-[11px] font-medium text-slate-500 dark:text-slate-400">Approved</span>
          <span className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
            {project.approvedCount} ({project.approvedPercent.toFixed(0)}%)
          </span>
        </div>
        <div>
          <span className="block text-[11px] font-medium text-slate-500 dark:text-slate-400">In Review</span>
          <span className="font-bold text-amber-600 dark:text-amber-400 tabular-nums">
            {project.inReviewCount} ({project.inReviewPercent.toFixed(0)}%)
          </span>
        </div>
        <div>
          <span className="block text-[11px] font-medium text-slate-500 dark:text-slate-400">Overdue</span>
          <span className="font-bold text-red-600 dark:text-red-400 tabular-nums">
            {project.overdueCount} ({project.overduePercent.toFixed(1)}%)
          </span>
        </div>
      </div>

      {/* 5 QA/QC Lifecycle Pillar Progress Bars with Delinquency Chips */}
      <div className="space-y-2.5 my-3">
        {pillarsList.map((p) => {
          const detail = p.data;
          const approvalPct = 'approvedPercent' in detail ? detail.approvedPercent : (detail.total > 0 ? (detail.closed / detail.total) * 100 : 0);

          return (
            <div key={p.key} className="text-xs">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                  <span className="font-semibold text-slate-700 dark:text-slate-200">{p.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 dark:text-slate-400 tabular-nums">
                    Vol: {detail.total}
                  </span>
                  <DelinquencyChip
                    pendingPercent={detail.pendingPercent}
                    isCritical={detail.isCritical}
                  />
                </div>
              </div>
              <div className="w-full bg-slate-100 dark:bg-[#1e1e1e] border dark:border-[#3c3c3c]/60 h-2 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    backgroundColor: p.color,
                    width: `${Math.min(100, Math.max(0, approvalPct))}%`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Discipline Accordion */}
      <DisciplineAccordion
        disciplines={project.disciplines}
        drawingTypes={project.drawingTypes}
        pendingAgingDays={project.pendingAgingDays}
      />
    </div>
  );
};

