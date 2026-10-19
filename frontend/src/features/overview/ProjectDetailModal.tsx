import React, { useEffect } from 'react';
import { X, Wrench, HardHat, Zap, Clock, AlertCircle } from 'lucide-react';
import { ProjectMatrixRow } from '../../api/types';
import { OverdueBadge, DelinquencyChip, TrendTag } from '../../components/ui/Badges';

export interface ProjectDetailModalProps {
  project: ProjectMatrixRow | null;
  onClose: () => void;
}

export const ProjectDetailModal: React.FC<ProjectDetailModalProps> = ({
  project,
  onClose,
}) => {
  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (project) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [project, onClose]);

  if (!project) return null;

  const pillarsList = [
    { key: 'baseline', name: 'Baseline Drawings', color: '#2f6fce', data: project.pillars.baseline },
    { key: 'control', name: 'Control (ITP/RFI)', color: '#12a4a0', data: project.pillars.control },
    { key: 'corrective', name: 'Corrective (NCR/CAR)', color: '#ee8a1f', data: project.pillars.corrective },
    { key: 'change', name: 'Change (PCR/DCR)', color: '#26a65b', data: project.pillars.change },
    { key: 'complete', name: 'Complete (Handover)', color: '#8b5cf6', data: project.pillars.complete },
  ] as const;

  const calcPct = (app: number, tot: number) => (tot > 0 ? (app / tot) * 100 : 0);
  const mePct = calcPct(project.disciplines.me.approved, project.disciplines.me.total);
  const cePct = calcPct(project.disciplines.ce.approved, project.disciplines.ce.total);
  const eePct = calcPct(project.disciplines.ee.approved, project.disciplines.ee.total);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity duration-200"
      onClick={onClose}
      data-testid="project-detail-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-project-title"
    >
      <div
        className="bg-white dark:bg-[#252526] border border-slate-200 dark:border-[#3c3c3c] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl relative transition-all"
        onClick={(e) => e.stopPropagation()}
        data-testid="project-detail-modal"
      >
        {/* Header: Site, ID, Net Change, Health Badge, Close Button */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100 dark:border-[#3c3c3c]">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800 dark:bg-[#007acc]/20 dark:text-[#3794ff] border border-blue-200 dark:border-[#007acc]/40">
                {project.siteCode}
              </span>
              <span className="text-xs font-mono font-semibold text-slate-500 dark:text-slate-400">
                {project.projectId}
              </span>
              <TrendTag direction={project.netChange} />
              <OverdueBadge
                overduePercent={project.overduePercent}
                overdueCount={project.overdueCount}
              />
            </div>
            <h2
              id="modal-project-title"
              className="text-base font-bold text-slate-900 dark:text-slate-100 leading-snug"
            >
              {project.projectName}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#2a2d2e] transition-colors"
            aria-label="Close project modal"
            data-testid="close-project-modal-btn"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1. Macro Summary KPI Metrics */}
        <div className="grid grid-cols-4 gap-2.5 my-4 py-3 px-2 bg-slate-50 dark:bg-[#1e1e1e] border border-slate-200/80 dark:border-[#3c3c3c] rounded-xl text-center text-xs">
          <div>
            <span className="block text-[11px] font-medium text-slate-500 dark:text-slate-400">Total Docs</span>
            <span className="font-bold text-slate-900 dark:text-slate-100 tabular-nums text-sm">
              {project.totalDocuments.toLocaleString()}
            </span>
          </div>
          <div>
            <span className="block text-[11px] font-medium text-slate-500 dark:text-slate-400">Approved</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums text-sm">
              {project.approvedCount} ({project.approvedPercent.toFixed(0)}%)
            </span>
          </div>
          <div>
            <span className="block text-[11px] font-medium text-slate-500 dark:text-slate-400">In Review</span>
            <span className="font-bold text-amber-600 dark:text-amber-400 tabular-nums text-sm">
              {project.inReviewCount} ({project.inReviewPercent.toFixed(0)}%)
            </span>
          </div>
          <div>
            <span className="block text-[11px] font-medium text-slate-500 dark:text-slate-400">Overdue</span>
            <span className="font-bold text-red-600 dark:text-red-400 tabular-nums text-sm">
              {project.overdueCount} ({project.overduePercent.toFixed(1)}%)
            </span>
          </div>
        </div>

        {/* 2. 5 QA/QC Lifecycle Pillars Breakdown */}
        <div className="my-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-3">
            QA/QC Lifecycle Pillars
          </h3>
          <div className="space-y-3">
            {pillarsList.map((p) => {
              const detail = p.data;
              const approvalPct =
                'approvedPercent' in detail
                  ? detail.approvedPercent
                  : detail.total > 0
                  ? (detail.closed / detail.total) * 100
                  : 0;

              return (
                <div key={p.key} className="text-xs p-3 rounded-lg bg-slate-50/70 dark:bg-[#1e1e1e] border border-slate-200/60 dark:border-[#3c3c3c]/80">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                      <span className="font-bold text-slate-800 dark:text-slate-100">{p.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-500 dark:text-slate-400 tabular-nums font-medium">
                        Total Volume: {detail.total}
                      </span>
                      <DelinquencyChip
                        pendingPercent={detail.pendingPercent}
                        isCritical={detail.isCritical}
                      />
                    </div>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-[#2a2d2e] h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min(100, Math.max(0, approvalPct))}%`,
                        backgroundColor: p.color,
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-400 mt-1">
                    <span>
                      {'closed' in detail
                        ? `${detail.closed} Closed / ${detail.open} Open`
                        : `${detail.approved} Approved / ${detail.inReview} In-Review`}
                    </span>
                    <span className="font-semibold text-slate-600 dark:text-slate-300">
                      {approvalPct.toFixed(1)}% Approved
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. Engineering Disciplines & Drawing Deliverables Breakdown */}
        <div className="my-5 p-4 rounded-xl bg-slate-50 dark:bg-[#1e1e1e] border border-slate-200/80 dark:border-[#3c3c3c]">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-3 flex items-center justify-between">
            <span>Engineering Discipline Breakdown</span>
            {project.pendingAgingDays > 0 && (
              <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                Avg Open Aging: <strong>{project.pendingAgingDays.toFixed(1)} days</strong>
              </span>
            )}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs mb-4">
            {/* ME */}
            <div className="bg-white dark:bg-[#252526] p-3 rounded-lg border border-slate-200/70 dark:border-[#3c3c3c]">
              <div className="flex items-center justify-between mb-1">
                <span className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-200">
                  <Wrench className="w-3.5 h-3.5 text-blue-500" /> ME
                </span>
                <span className="text-[11px] font-bold tabular-nums text-slate-900 dark:text-slate-100">
                  {project.disciplines.me.approved}/{project.disciplines.me.total}
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-[#1e1e1e] border dark:border-[#3c3c3c]/50 h-1.5 rounded-full overflow-hidden">
                <div className="bg-blue-500 h-full rounded-full" style={{ width: `${mePct}%` }} />
              </div>
            </div>

            {/* CE */}
            <div className="bg-white dark:bg-[#252526] p-3 rounded-lg border border-slate-200/70 dark:border-[#3c3c3c]">
              <div className="flex items-center justify-between mb-1">
                <span className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-200">
                  <HardHat className="w-3.5 h-3.5 text-amber-500" /> CE
                </span>
                <span className="text-[11px] font-bold tabular-nums text-slate-900 dark:text-slate-100">
                  {project.disciplines.ce.approved}/{project.disciplines.ce.total}
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-[#1e1e1e] border dark:border-[#3c3c3c]/50 h-1.5 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-full rounded-full" style={{ width: `${cePct}%` }} />
              </div>
            </div>

            {/* EE */}
            <div className="bg-white dark:bg-[#252526] p-3 rounded-lg border border-slate-200/70 dark:border-[#3c3c3c]">
              <div className="flex items-center justify-between mb-1">
                <span className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-200">
                  <Zap className="w-3.5 h-3.5 text-purple-500" /> EE
                </span>
                <span className="text-[11px] font-bold tabular-nums text-slate-900 dark:text-slate-100">
                  {project.disciplines.ee.approved}/{project.disciplines.ee.total}
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-[#1e1e1e] border dark:border-[#3c3c3c]/50 h-1.5 rounded-full overflow-hidden">
                <div className="bg-purple-500 h-full rounded-full" style={{ width: `${eePct}%` }} />
              </div>
            </div>
          </div>

          {/* Active Drawing Types */}
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-2">
              Deliverable Drawing Types Present:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {project.drawingTypes && project.drawingTypes.length > 0 ? (
                project.drawingTypes.map((type) => (
                  <span
                    key={type}
                    className="px-2 py-0.5 rounded text-[11px] font-bold font-mono bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                  >
                    {type}
                  </span>
                ))
              ) : (
                <span className="text-slate-400 italic text-[11px]">No specific drawing codes tagged</span>
              )}
            </div>
          </div>
        </div>

        {/* Footer: Close button */}
        <div className="flex items-center justify-end pt-3 border-t border-slate-100 dark:border-[#3c3c3c]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-[#1e1e1e] dark:hover:bg-[#2a2d2e] text-slate-700 dark:text-slate-200 font-semibold text-xs border border-slate-200 dark:border-[#3c3c3c] transition-colors"
          >
            Close Diagnostics
          </button>
        </div>
      </div>
    </div>
  );
};
