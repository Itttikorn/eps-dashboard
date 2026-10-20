import React, { useEffect } from 'react';
import {
  X,
  Wrench,
  HardHat,
  Zap,
  Clock,
} from 'lucide-react';
import { ProjectMatrixRow } from '../../api/types';
import { OverdueBadge, DelinquencyChip, TrendTag } from '../../components/ui/Badges';

export interface ProjectDetailModalProps {
  project: ProjectMatrixRow | null;
  onClose: () => void;
}

// Standard Conzol Engineering Workflow Drawing Types
const STANDARD_DRAW_TYPES = [
  { code: 'FS', name: 'Flowsheet' },
  { code: 'ML', name: 'Machine List' },
  { code: 'PR', name: 'Procurement List' },
  { code: 'GA', name: 'General Arrangement' },
  { code: 'LD', name: 'Load Data' },
  { code: 'FD', name: 'Fabrication Drawing' },
];

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

  const calcPct = (num: number, denom: number) =>
    denom > 0 ? Math.min(100, Math.max(0, (num / denom) * 100)) : 0;

  const mePct = calcPct(project.disciplines.me.approved, project.disciplines.me.total);
  const cePct = calcPct(project.disciplines.ce.approved, project.disciplines.ce.total);
  const eePct = calcPct(project.disciplines.ee.approved, project.disciplines.ee.total);

  // Check which standard types or custom types are tagged
  const activeTypesSet = new Set((project.drawingTypes || []).map((t) => t.toUpperCase()));

  // Delinquency rate level helper
  const getDelinquencyColor = (pct: number) => {
    if (pct >= 45) return 'text-red-600 dark:text-red-400 font-bold';
    if (pct >= 25) return 'text-amber-600 dark:text-amber-400 font-bold';
    return 'text-emerald-600 dark:text-emerald-400 font-medium';
  };

  const getAgingBadge = (days: number) => {
    if (days >= 20) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300 border border-red-200 dark:border-red-800">
          <Clock className="w-3 h-3 text-red-500" />
          {days.toFixed(1)} Days (Critical Lag)
        </span>
      );
    }
    if (days >= 10) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
          <Clock className="w-3 h-3 text-amber-500" />
          {days.toFixed(1)} Days (Attention)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
        <Clock className="w-3 h-3 text-emerald-500" />
        {days > 0 ? `${days.toFixed(1)} Days (On Track)` : 'No Open Backlog'}
      </span>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs transition-opacity duration-200"
      onClick={onClose}
      data-testid="project-detail-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-project-title"
    >
      <div
        className="bg-white dark:bg-[#252526] border border-slate-200 dark:border-[#3c3c3c] rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl relative transition-all overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        data-testid="project-detail-modal"
      >
        {/* Fixed Header: Site, ID, Net Change, Health Badge, Close Button */}
        <div className="flex items-start justify-between gap-4 p-5 sm:p-6 pb-4 border-b border-slate-200 dark:border-[#3c3c3c] shrink-0 bg-white dark:bg-[#252526]">
          <div>
            <h2
              id="modal-project-title"
              className="text-lg font-bold text-slate-900 dark:text-slate-100 leading-snug mb-1.5"
            >
              {project.projectName}
            </h2>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono font-semibold text-slate-500 dark:text-slate-400">
                {project.projectId}
              </span>
              <TrendTag direction={project.netChange} />
              <OverdueBadge
                overduePercent={project.overduePercent}
                overdueCount={project.overdueCount}
              />
            </div>
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

        {/* Scrollable Body with Sleek Custom Scrollbar */}
        <div className="overflow-y-auto px-5 sm:px-6 py-4 flex-1 custom-scrollbar space-y-4">
          {/* Macro Summary KPI Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4 py-3 px-3 bg-slate-50 dark:bg-[#1e1e1e] border border-slate-200 dark:border-[#3c3c3c] rounded-xl text-center text-xs">
          <div>
            <span className="block text-[11px] font-medium text-slate-500 dark:text-slate-400">
              Total Documents
            </span>
            <span className="font-bold text-slate-900 dark:text-slate-100 tabular-nums text-sm">
              {project.totalDocuments.toLocaleString()}
            </span>
          </div>
          <div>
            <span className="block text-[11px] font-medium text-slate-500 dark:text-slate-400">
              Approved
            </span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums text-sm">
              {project.approvedCount} ({project.approvedPercent.toFixed(0)}%)
            </span>
          </div>
          <div>
            <span className="block text-[11px] font-medium text-slate-500 dark:text-slate-400">
              In Review
            </span>
            <span className="font-bold text-amber-600 dark:text-amber-400 tabular-nums text-sm">
              {project.inReviewCount} ({project.inReviewPercent.toFixed(0)}%)
            </span>
          </div>
          <div>
            <span className="block text-[11px] font-medium text-slate-500 dark:text-slate-400">
              Overdue SLA
            </span>
            <span className="font-bold text-red-600 dark:text-red-400 tabular-nums text-sm">
              {project.overdueCount} ({project.overduePercent.toFixed(1)}%)
            </span>
          </div>
        </div>

        {/* 5 Combined Operational Diagnostic Sections (replacing the 8 mock dropdowns) */}
        <div className="space-y-4">
          {/* SECTION 1: Baseline Drawings & Disciplines (from 'draw' dropdown) */}
          <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-[#1e1e1e] border border-blue-200/60 dark:border-blue-900/40">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#2f6fce] shrink-0" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100">
                  ① Baseline Drawings & Disciplines
                </h3>
              </div>
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                {project.pillars.baseline.approved} / {project.pillars.baseline.total} Approved (
                {project.pillars.baseline.approvedPercent.toFixed(0)}%)
              </span>
            </div>

            {/* Discipline Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs mb-3.5">
              {/* ME */}
              <div className="bg-white dark:bg-[#252526] p-2.5 rounded-lg border border-slate-200 dark:border-[#3c3c3c]">
                <div className="flex items-center justify-between mb-1">
                  <span className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-200 text-xs">
                    <Wrench className="w-3.5 h-3.5 text-blue-500" /> Mechanical (ME)
                  </span>
                  <span className="text-xs font-bold tabular-nums text-slate-900 dark:text-slate-100">
                    {project.disciplines.me.approved}/{project.disciplines.me.total}
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-[#1e1e1e] h-1.5 rounded-full overflow-hidden">
                  <div className="bg-blue-500 h-full rounded-full transition-all" style={{ width: `${mePct}%` }} />
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 text-right">
                  {mePct.toFixed(0)}% Complete
                </div>
              </div>

              {/* CE */}
              <div className="bg-white dark:bg-[#252526] p-2.5 rounded-lg border border-slate-200 dark:border-[#3c3c3c]">
                <div className="flex items-center justify-between mb-1">
                  <span className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-200 text-xs">
                    <HardHat className="w-3.5 h-3.5 text-amber-500" /> Civil (CE)
                  </span>
                  <span className="text-xs font-bold tabular-nums text-slate-900 dark:text-slate-100">
                    {project.disciplines.ce.approved}/{project.disciplines.ce.total}
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-[#1e1e1e] h-1.5 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full transition-all" style={{ width: `${cePct}%` }} />
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 text-right">
                  {cePct.toFixed(0)}% Complete
                </div>
              </div>

              {/* EE */}
              <div className="bg-white dark:bg-[#252526] p-2.5 rounded-lg border border-slate-200 dark:border-[#3c3c3c]">
                <div className="flex items-center justify-between mb-1">
                  <span className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-200 text-xs">
                    <Zap className="w-3.5 h-3.5 text-purple-500" /> Electrical (EE)
                  </span>
                  <span className="text-xs font-bold tabular-nums text-slate-900 dark:text-slate-100">
                    {project.disciplines.ee.approved}/{project.disciplines.ee.total}
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-[#1e1e1e] h-1.5 rounded-full overflow-hidden">
                  <div className="bg-purple-500 h-full rounded-full transition-all" style={{ width: `${eePct}%` }} />
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 text-right">
                  {eePct.toFixed(0)}% Complete
                </div>
              </div>
            </div>

            {/* Deliverable Drawing Types Status Tiles */}
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1.5">
                Deliverable Drawing Types (Conzol Engineering Workflow):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {STANDARD_DRAW_TYPES.map((t) => {
                  const isOn =
                    activeTypesSet.has(t.code) ||
                    (project.drawingTypes &&
                      project.drawingTypes.some(
                        (tag) => tag.toUpperCase().includes(t.code) || t.name.toUpperCase().includes(tag.toUpperCase())
                      ));
                  return (
                    <div
                      key={t.code}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold border transition-colors ${
                        isOn
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700'
                          : 'bg-slate-100 text-slate-400 border-slate-200 dark:bg-[#252526] dark:text-slate-500 dark:border-[#3c3c3c]'
                      }`}
                      title={`${t.name}: ${isOn ? 'Deliverable active on site' : 'Not yet tagged in transmittals'}`}
                    >
                      <span>{t.code}</span>
                      <span className="text-[10px] font-normal opacity-75 hidden sm:inline">{t.name}</span>
                    </div>
                  );
                })}
                {/* Any additional tags from Conzol CSV not in the 6 standard */}
                {project.drawingTypes &&
                  project.drawingTypes
                    .filter((tag) => !STANDARD_DRAW_TYPES.some((s) => s.code === tag.toUpperCase()))
                    .map((customTag) => (
                      <div
                        key={customTag}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-700"
                      >
                        {customTag}
                      </div>
                    ))}
              </div>
            </div>
          </div>

          {/* SECTION 2: Quality Control & Field Inspections (from 'itp' & 'rfi' dropdowns) */}
          <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-[#1e1e1e] border border-teal-200/60 dark:border-teal-900/40">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#12a4a0] shrink-0" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100">
                  ② Quality Control & Inspections (ITP / RFI / ITR)
                </h3>
              </div>
              <DelinquencyChip
                pendingPercent={project.pillars.control.pendingPercent}
                isCritical={project.pillars.control.isCritical}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* ITP Submission by Discipline */}
              <div className="bg-white dark:bg-[#252526] p-3 rounded-lg border border-slate-200 dark:border-[#3c3c3c]">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-700 dark:text-slate-200">
                    ITP Submission Status (ME / CE / EE)
                  </span>
                  <span className="text-[11px] text-slate-400">1 transmittal / branch</span>
                </div>
                <div className="flex items-center gap-2">
                  {[
                    { label: 'ME', active: project.disciplines.me.total > 0 },
                    { label: 'CE', active: project.disciplines.ce.total > 0 },
                    { label: 'EE', active: project.disciplines.ee.total > 0 },
                  ].map((branch) => (
                    <div
                      key={branch.label}
                      className={`flex-1 py-1.5 px-2 rounded text-center text-xs font-bold border ${
                        branch.active
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                          : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800'
                      }`}
                    >
                      {branch.label}: {branch.active ? 'Submitted ✓' : 'Pending'}
                    </div>
                  ))}
                </div>
              </div>

              {/* RFI Transmittals Breakdown */}
              <div className="bg-white dark:bg-[#252526] p-3 rounded-lg border border-slate-200 dark:border-[#3c3c3c]">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-700 dark:text-slate-200">RFI Transmittals</span>
                  <span className="text-slate-500 dark:text-slate-400">
                    Total: <strong>{project.pillars.control.total}</strong>
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs py-1">
                  <span className="text-slate-500 dark:text-slate-400">
                    Open:{' '}
                    <strong className={getDelinquencyColor(project.pillars.control.pendingPercent)}>
                      {project.pillars.control.open}
                    </strong>
                  </span>
                  <span className="text-slate-500 dark:text-slate-400">
                    Closed: <strong className="text-emerald-600 dark:text-emerald-400">{project.pillars.control.closed}</strong>
                  </span>
                  <span className="text-slate-500 dark:text-slate-400">
                    Pending Rate:{' '}
                    <strong className={getDelinquencyColor(project.pillars.control.pendingPercent)}>
                      {project.pillars.control.pendingPercent.toFixed(1)}%
                    </strong>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 3: Corrective Actions & Aging (from 'ncr' & 'car' dropdowns) */}
          <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-[#1e1e1e] border border-orange-200/60 dark:border-orange-900/40">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ee8a1f] shrink-0" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100">
                  ③ Corrective Actions & Resolution Aging (NCR / CAR)
                </h3>
              </div>
              <DelinquencyChip
                pendingPercent={project.pillars.corrective.pendingPercent}
                isCritical={project.pillars.corrective.isCritical}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs mb-3">
              {/* NCR & CAR Metrics */}
              <div className="bg-white dark:bg-[#252526] p-3 rounded-lg border border-slate-200 dark:border-[#3c3c3c]">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-slate-700 dark:text-slate-200">
                    Corrective Volume (NCR & CAR)
                  </span>
                  <span className="font-semibold text-slate-500 dark:text-slate-400">
                    Total: {project.pillars.corrective.total}
                  </span>
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Open Action Items:</span>
                    <strong className={getDelinquencyColor(project.pillars.corrective.pendingPercent)}>
                      {project.pillars.corrective.open}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Closed / Resolved:</span>
                    <strong className="text-emerald-600 dark:text-emerald-400">
                      {project.pillars.corrective.closed}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Average Open Aging Days */}
              <div className="bg-white dark:bg-[#252526] p-3 rounded-lg border border-slate-200 dark:border-[#3c3c3c] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-700 dark:text-slate-200">
                      Average Open Aging
                    </span>
                    {getAgingBadge(project.pendingAgingDays)}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Tracks the average turnaround speed of open NCR/CAR transmittals before closure.
                  </p>
                </div>
                <div className="text-[10px] text-slate-400 dark:text-slate-500 pt-1 border-t border-slate-100 dark:border-[#3c3c3c]">
                  Threshold: &lt;10d Normal · 10–20d Warning · &ge;20d Critical
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 4: Change Management & Impact (from 'fcr', 'dcr', 'vo' dropdowns) */}
          <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-[#1e1e1e] border border-green-200/60 dark:border-green-900/40">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#26a65b] shrink-0" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100">
                  ④ Engineering Change Tracking (FCR / DCR / VOR)
                </h3>
              </div>
              <DelinquencyChip
                pendingPercent={project.pillars.change.pendingPercent}
                isCritical={project.pillars.change.isCritical}
              />
            </div>
            <div className="bg-white dark:bg-[#252526] p-3 rounded-lg border border-slate-200 dark:border-[#3c3c3c] text-xs">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <span className="block text-[11px] text-slate-500 dark:text-slate-400">
                    Total Changes
                  </span>
                  <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                    {project.pillars.change.total}
                  </span>
                </div>
                <div>
                  <span className="block text-[11px] text-slate-500 dark:text-slate-400">
                    Open / In-Review
                  </span>
                  <span
                    className={`font-bold text-sm ${getDelinquencyColor(
                      project.pillars.change.pendingPercent
                    )}`}
                  >
                    {project.pillars.change.open}
                  </span>
                </div>
                <div>
                  <span className="block text-[11px] text-slate-500 dark:text-slate-400">
                    Closed / Incorporated
                  </span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                    {project.pillars.change.closed}
                  </span>
                </div>
              </div>

              {/* Sub-breakdown: FCR, DCR, VOR */}
              <div className="grid grid-cols-3 gap-2 mt-2.5 pt-2 border-t border-slate-100 dark:border-[#3c3c3c] text-center text-[11px]">
                <div className="bg-slate-50 dark:bg-[#202020] p-1.5 rounded">
                  <span className="text-slate-500 dark:text-slate-400 block font-medium">FCR (Field)</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {project.pillars.fcr?.total ?? 0}
                  </span>
                </div>
                <div className="bg-slate-50 dark:bg-[#202020] p-1.5 rounded">
                  <span className="text-slate-500 dark:text-slate-400 block font-medium">DCR (Design)</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {project.pillars.dcr?.total ?? 0}
                  </span>
                </div>
                <div className="bg-slate-50 dark:bg-[#202020] p-1.5 rounded">
                  <span className="text-slate-500 dark:text-slate-400 block font-medium">VOR (Variation)</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {project.pillars.vor?.total ?? 0}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 5: Closeout & SLA Monitor (from 'complete' & 'overdue' dropdowns) */}
          <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-[#1e1e1e] border border-purple-200/60 dark:border-purple-900/40">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#8b5cf6] shrink-0" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100">
                  ⑤ Project Closeout & SLA Compliance
                </h3>
              </div>
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                {project.pillars.complete.total > 0
                  ? `${project.pillars.complete.closed} Closed`
                  : 'Pending Final Handover'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-white dark:bg-[#252526] p-3 rounded-lg border border-slate-200 dark:border-[#3c3c3c]">
                <span className="font-bold text-slate-700 dark:text-slate-200 block mb-1">
                  Handover & Commissioning
                </span>
                <span className="text-slate-500 dark:text-slate-400">
                  {project.pillars.complete.total > 0
                    ? `${project.pillars.complete.closed} of ${project.pillars.complete.total} handover packages processed`
                    : 'Commissioning & Punchlists will initiate upon construction closure'}
                </span>
              </div>

              <div className="bg-white dark:bg-[#252526] p-3 rounded-lg border border-slate-200 dark:border-[#3c3c3c]">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-700 dark:text-slate-200">
                    Overdue SLA Compliance
                  </span>
                  <OverdueBadge
                    overdueCount={project.overdueCount}
                    overduePercent={project.overduePercent}
                  />
                </div>
                <span className="text-slate-500 dark:text-slate-400">
                  {project.overdueCount > 0
                    ? `${project.overdueCount} transmittals exceed the 14-day standard turnaround SLA`
                    : '100% of transmittals within SLA response window'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

        {/* Fixed Footer: Close button */}
        <div className="flex items-center justify-end px-5 sm:px-6 py-3.5 border-t border-slate-200 dark:border-[#3c3c3c] shrink-0 bg-slate-50/80 dark:bg-[#202021]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-[#2a2d2e] dark:hover:bg-[#333333] text-slate-700 dark:text-slate-200 font-semibold text-xs border border-slate-200 dark:border-[#3c3c3c] transition-colors"
          >
            Close Diagnostics
          </button>
        </div>
      </div>
    </div>
  );
};
