import React, { useMemo, useState } from 'react';
import { ProjectMatrixRow } from '../../api/types';
import { TableSkeleton } from '../../components/ui/Skeletons';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorAlert } from '../../components/ui/ErrorAlert';
import { TrendTag } from '../../components/ui/Badges';
import { ProjectDetailModal } from './ProjectDetailModal';

export interface ProjectMatrixTableProps {
  projects?: ProjectMatrixRow[];
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  searchQuery?: string;
  sortField?: 'total' | 'overdue' | 'pending';
  sortDir?: 'asc' | 'desc';
}

export const ProjectMatrixTable: React.FC<ProjectMatrixTableProps> = ({
  projects = [],
  isLoading = false,
  isError = false,
  onRetry,
  searchQuery = '',
  sortField = 'total',
  sortDir = 'desc',
}) => {
  const [selectedProject, setSelectedProject] = useState<ProjectMatrixRow | null>(null);

  // Memoized filter and sort
  const filteredProjects = useMemo(() => {
    let result = [...projects];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.projectId.toLowerCase().includes(q) ||
          p.siteCode.toLowerCase().includes(q) ||
          p.projectName.toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      let comparison = 0;
      if (sortField === 'total') {
        comparison = a.totalDocuments - b.totalDocuments;
      } else if (sortField === 'overdue') {
        comparison = a.overdueCount - b.overdueCount;
      } else if (sortField === 'pending') {
        comparison = a.inReviewPercent - b.inReviewPercent;
      }
      return sortDir === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [projects, searchQuery, sortField, sortDir]);

  if (isLoading) {
    return <TableSkeleton rows={6} />;
  }

  if (isError) {
    return (
      <ErrorAlert
        title="Failed to load comparative matrix"
        message="Could not retrieve the project comparative list."
        onRetry={onRetry}
      />
    );
  }

  if (filteredProjects.length === 0) {
    return (
      <EmptyState
        title="No Matching Projects Found"
        description={
          searchQuery
            ? `No projects matched the search term "${searchQuery}". Try adjusting your search query.`
            : 'No projects are currently registered in this portfolio.'
        }
      />
    );
  }

  // Delinquency chip renderer helper
  const renderDelinquencyChip = (
    total: number,
    pendingPercent: number,
    isCritical: boolean,
    label?: string
  ) => {
    if (total === 0) {
      return <span className="text-slate-400 dark:text-slate-600 font-mono text-xs">0</span>;
    }

    let chipClass = 'text-slate-800 dark:text-slate-200 font-bold';
    let bgClass = '';

    if (pendingPercent >= 45 || isCritical) {
      chipClass = 'text-red-700 dark:text-red-300 font-bold';
      bgClass = 'bg-red-100/80 dark:bg-red-950/50 border border-red-300/80 dark:border-red-800 animate-pulse';
    } else if (pendingPercent >= 25) {
      chipClass = 'text-amber-700 dark:text-amber-300 font-bold';
      bgClass = 'bg-amber-100/70 dark:bg-amber-950/40 border border-amber-300/70 dark:border-amber-800';
    }

    return (
      <div className="inline-flex flex-col items-center">
        <span
          className={`px-2 py-0.5 rounded-md text-xs tabular-nums ${chipClass} ${bgClass}`}
          title={label ? `${label}: ${total} total (${pendingPercent.toFixed(1)}% pending)` : undefined}
        >
          {total}
        </span>
      </div>
    );
  };

  return (
    <>
      <div
        className="w-full overflow-x-auto rounded-xl border border-slate-200 dark:border-[#3c3c3c] bg-white dark:bg-[#1e1e1e] shadow-xs"
        style={{ contain: 'layout paint' }}
        data-testid="project-matrix-container"
      >
        <table className="w-full min-w-[1080px] text-left border-collapse text-xs">
          {/* Two-Tier Table Headers */}
          <thead>
            {/* Tier 1: Group Super-Headers */}
            <tr className="border-b border-slate-200 dark:border-[#3c3c3c] font-bold text-xs uppercase tracking-wider text-center select-none">
              <th className="py-2.5 px-4 text-left bg-slate-100 dark:bg-[#252526] text-slate-700 dark:text-slate-300 w-[240px]">
                Project & Site
              </th>
              <th className="py-2.5 px-3 bg-[#2f6fce] text-white w-[140px]">
                ① Baseline
              </th>
              <th className="py-2.5 px-3 bg-[#12a4a0] text-white" colSpan={3}>
                ② Control
              </th>
              <th className="py-2.5 px-3 bg-[#ee8a1f] text-white" colSpan={2}>
                ③ Corrective
              </th>
              <th className="py-2.5 px-3 bg-[#26a65b] text-white" colSpan={3}>
                ④ Change
              </th>
              <th className="py-2.5 px-3 bg-[#8b5cf6] text-white w-[90px]">
                ⑤ Complete
              </th>
              <th className="py-2.5 px-3 bg-slate-700 text-white w-[110px]">
                SLA Monitor
              </th>
            </tr>

            {/* Tier 2: Sub-Column Headers */}
            <tr className="border-b border-slate-200 dark:border-[#3c3c3c] text-[11px] font-semibold text-center select-none">
              <th className="py-2.5 px-4 text-left bg-slate-50 dark:bg-[#202020] text-slate-600 dark:text-slate-400">
                Site · Project
              </th>
              <th className="py-2.5 px-2 bg-blue-50 dark:bg-[#1a2b47] text-blue-900 dark:text-blue-200">
                Drawings
              </th>
              <th className="py-2.5 px-2 bg-teal-50 dark:bg-[#0e3332] text-teal-900 dark:text-teal-200">
                ITP
              </th>
              <th className="py-2.5 px-2 bg-teal-50 dark:bg-[#0e3332] text-teal-900 dark:text-teal-200">
                RFI
              </th>
              <th className="py-2.5 px-2 bg-teal-50 dark:bg-[#0e3332] text-teal-900 dark:text-teal-200">
                ITR
              </th>
              <th className="py-2.5 px-2 bg-amber-50 dark:bg-[#3b2a1a] text-amber-900 dark:text-amber-200">
                NCR
              </th>
              <th className="py-2.5 px-2 bg-amber-50 dark:bg-[#3b2a1a] text-amber-900 dark:text-amber-200">
                CAR
              </th>
              <th className="py-2.5 px-2 bg-emerald-50 dark:bg-[#122e1e] text-emerald-900 dark:text-emerald-200">
                FCR
              </th>
              <th className="py-2.5 px-2 bg-emerald-50 dark:bg-[#122e1e] text-emerald-900 dark:text-emerald-200">
                DCR
              </th>
              <th className="py-2.5 px-2 bg-emerald-50 dark:bg-[#122e1e] text-emerald-900 dark:text-emerald-200">
                VOR
              </th>
              <th className="py-2.5 px-2 bg-purple-50 dark:bg-[#281b3d] text-purple-900 dark:text-purple-200">
                Handover
              </th>
              <th className="py-2.5 px-2 bg-slate-100 dark:bg-[#26282b] text-slate-800 dark:text-slate-200">
                Overdue
              </th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-slate-100 dark:divide-[#2a2d2e]">
            {filteredProjects.map((p) => {
              const base = p.pillars.baseline;
              const ctrl = p.pillars.control;
              const corr = p.pillars.corrective;
              const fcr = p.pillars.fcr;
              const dcr = p.pillars.dcr;
              const vor = p.pillars.vor;
              const comp = p.pillars.complete;

              const healthPill =
                p.healthStatus === 'CRITICAL'
                  ? 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400 border border-red-200 dark:border-red-800'
                  : p.healthStatus === 'ATTENTION'
                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                  : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800';

              return (
                <tr
                  key={p.projectId}
                  onClick={() => setSelectedProject(p)}
                  className="hover:bg-blue-50/60 dark:hover:bg-[#2a2d2e] cursor-pointer transition-colors group"
                  data-testid={`project-matrix-row-${p.projectId}`}
                >
                  {/* Column: Site & Project Name */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase bg-blue-100 text-blue-800 dark:bg-[#007acc]/20 dark:text-[#3794ff] border border-blue-200 dark:border-[#007acc]/40">
                        {p.siteCode}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${healthPill}`}>
                        {p.healthStatus}
                      </span>
                      <TrendTag direction={p.netChange} />
                    </div>
                    <div className="font-bold text-slate-900 dark:text-slate-100 text-xs group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {p.projectName}
                    </div>
                  </td>

                  {/* Column: ① Baseline Drawings */}
                  <td className="py-3 px-2 text-center bg-blue-50/30 dark:bg-[#1a2b47]/20">
                    <span
                      className="px-2 py-0.5 rounded-md text-xs font-bold tabular-nums text-slate-800 dark:text-slate-200"
                      title={`Baseline Drawings: ${base.total} total deliverables`}
                    >
                      {base.total > 0 ? (
                        base.total.toLocaleString()
                      ) : (
                        <span className="text-slate-400 dark:text-slate-600 font-mono text-xs">0</span>
                      )}
                    </span>
                  </td>

                  {/* Column: ② Control - ITP */}
                  <td className="py-3 px-2 text-center bg-teal-50/20 dark:bg-[#0e3332]/10">
                    {renderDelinquencyChip(
                      (p.disciplines.me.total > 0 ? 1 : 0) +
                        (p.disciplines.ce.total > 0 ? 1 : 0) +
                        (p.disciplines.ee.total > 0 ? 1 : 0),
                      0,
                      false,
                      'ITP Submissions'
                    )}
                  </td>

                  {/* Column: ② Control - RFI */}
                  <td className="py-3 px-2 text-center bg-teal-50/20 dark:bg-[#0e3332]/10">
                    {renderDelinquencyChip(ctrl.total, ctrl.pendingPercent, ctrl.isCritical, 'RFI Total')}
                  </td>

                  {/* Column: ② Control - ITR */}
                  <td className="py-3 px-2 text-center bg-teal-50/20 dark:bg-[#0e3332]/10">
                    {renderDelinquencyChip(ctrl.closed, 0, false, 'ITR Closed Reports')}
                  </td>

                  {/* Column: ③ Corrective - NCR */}
                  <td className="py-3 px-2 text-center bg-amber-50/20 dark:bg-[#3b2a1a]/10">
                    {renderDelinquencyChip(
                      corr.total,
                      corr.pendingPercent,
                      corr.isCritical,
                      'NCR Transmittals'
                    )}
                  </td>

                  {/* Column: ③ Corrective - CAR */}
                  <td className="py-3 px-2 text-center bg-amber-50/20 dark:bg-[#3b2a1a]/10">
                    {renderDelinquencyChip(
                      corr.closed,
                      corr.pendingPercent,
                      false,
                      'CAR Transmittals'
                    )}
                  </td>

                  {/* Column: ④ Change - FCR */}
                  <td className="py-3 px-2 text-center bg-emerald-50/20 dark:bg-[#122e1e]/10">
                    {renderDelinquencyChip(fcr.total, fcr.pendingPercent, fcr.isCritical, 'FCR Total')}
                  </td>

                  {/* Column: ④ Change - DCR */}
                  <td className="py-3 px-2 text-center bg-emerald-50/20 dark:bg-[#122e1e]/10">
                    {renderDelinquencyChip(dcr.total, dcr.pendingPercent, dcr.isCritical, 'DCR Total')}
                  </td>

                  {/* Column: ④ Change - VOR */}
                  <td className="py-3 px-2 text-center bg-emerald-50/20 dark:bg-[#122e1e]/10">
                    {renderDelinquencyChip(vor.total, vor.pendingPercent, vor.isCritical, 'VOR Total')}
                  </td>

                  {/* Column: ⑤ Complete - Handover */}
                  <td className="py-3 px-2 text-center bg-purple-50/20 dark:bg-[#281b3d]/10">
                    {renderDelinquencyChip(comp.total, comp.pendingPercent, false, 'Handover Items')}
                  </td>

                  {/* Column: SLA Monitor - Overdue Breaches */}
                  <td className="py-3 px-2 text-center bg-slate-50/50 dark:bg-[#26282b]/30">
                    {p.overdueCount > 0 ? (
                      <span
                        className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700 dark:bg-red-950/70 dark:text-red-300 border border-red-300 dark:border-red-800 animate-pulse"
                        title={`${p.overdueCount} documents overdue (${p.overduePercent.toFixed(1)}%)`}
                      >
                        {p.overdueCount}
                      </span>
                    ) : (
                      <span className="text-slate-400 dark:text-slate-600 font-mono text-xs">0</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Unified Project Diagnostics Modal */}
      {selectedProject && (
        <ProjectDetailModal
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
        />
      )}
    </>
  );
};
