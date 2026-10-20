import React, { useEffect } from 'react';
import {
  X,
  Wrench,
  HardHat,
  Zap,
} from 'lucide-react';
import { ProjectMatrixRow } from '../../api/types';
import { DelinquencyChip, TrendTag } from '../../components/ui/Badges';

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

export interface DocMetricTriadCardProps {
  title: string;
  icon?: React.ReactNode;
  total: number;
  pending: number;
  overdue: number;
  approved: number;
  pendingLabel?: string;
  overdueLabel?: string;
  approvedLabel?: string;
}

export const DocMetricTriadCard: React.FC<DocMetricTriadCardProps> = ({
  title,
  icon,
  total,
  pending,
  overdue,
  approved,
  pendingLabel = 'PENDING',
  overdueLabel = 'OVERDUE',
  approvedLabel = 'APPROVED',
}) => {
  return (
    <div className="bg-white dark:bg-[#252526] p-3 rounded-xl border border-slate-200 dark:border-[#3c3c3c] flex flex-col justify-between">
      <div className="flex items-center justify-between mb-2 gap-1.5">
        <span className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-100 text-xs truncate">
          {icon}
          {title}
        </span>
        <span className="text-[11px] text-slate-500 dark:text-slate-400 shrink-0">
          Total: <strong className="text-slate-700 dark:text-slate-200 tabular-nums">{total}</strong>
        </span>
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {/* Pending Box */}
        <div className="py-2 px-1 rounded-lg bg-slate-50 dark:bg-[#1e1e1e] border border-slate-200/70 dark:border-[#333] flex flex-col items-center justify-center text-center">
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            {pendingLabel}
          </span>
          <span
            className={`text-sm font-bold mt-0.5 tabular-nums ${
              pending > 0 ? 'text-amber-500 dark:text-amber-400' : 'text-slate-400 dark:text-slate-500'
            }`}
          >
            {pending}
          </span>
        </div>

        {/* Overdue Box */}
        <div className="py-2 px-1 rounded-lg bg-slate-50 dark:bg-[#1e1e1e] border border-slate-200/70 dark:border-[#333] flex flex-col items-center justify-center text-center">
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            {overdueLabel}
          </span>
          <span
            className={`text-sm font-bold mt-0.5 tabular-nums ${
              overdue > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400 dark:text-slate-500'
            }`}
          >
            {overdue}
          </span>
        </div>

        {/* Approved / Closed Box */}
        <div className="py-2 px-1 rounded-lg bg-slate-50 dark:bg-[#1e1e1e] border border-slate-200/70 dark:border-[#333] flex flex-col items-center justify-center text-center">
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            {approvedLabel}
          </span>
          <span
            className={`text-sm font-bold mt-0.5 tabular-nums ${
              approved > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'
            }`}
          >
            {approved}
          </span>
        </div>
      </div>
    </div>
  );
};

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

  // Check which standard types or custom types are tagged
  const activeTypesSet = new Set((project.drawingTypes || []).map((t) => t.toUpperCase()));

  const getAgingStatusBadge = (days: number, openCount: number) => {
    if (openCount === 0) {
      return (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 whitespace-nowrap">
          On Track
        </span>
      );
    }
    if (days >= 20) {
      return (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 whitespace-nowrap">
          Critical Lag
        </span>
      );
    }
    if (days >= 10) {
      return (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 whitespace-nowrap">
          Attention
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 whitespace-nowrap">
        On Track
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
        {/* Fixed Header: Project Name, Health Status, Trend Tag, Aging, Close Button */}
        <div className="flex items-start justify-between gap-4 p-5 sm:p-6 pb-4 border-b border-slate-200 dark:border-[#3c3c3c] shrink-0 bg-white dark:bg-[#252526]">
          <div>
            <h2
              id="modal-project-title"
              className="text-lg font-bold text-slate-900 dark:text-slate-100 leading-snug mb-1.5"
            >
              {project.projectName}
            </h2>
            <div className="flex items-center gap-2 flex-wrap">
              {project.projectName !== project.projectId &&
                project.projectName !== `Project ${project.projectId}` && (
                  <span className="text-xs font-mono font-semibold text-slate-500 dark:text-slate-400">
                    {project.projectId}
                  </span>
                )}
              <span
                className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
                  project.healthStatus === 'CRITICAL'
                    ? 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300 border-red-300 dark:border-red-800'
                    : project.healthStatus === 'ATTENTION'
                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                    : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                }`}
                data-testid={`modal-health-badge-${project.healthStatus.toLowerCase().replace(/\s+/g, '-')}`}
              >
                {project.healthStatus}
              </span>
              <TrendTag direction={project.netChange} />
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#2a2d2e] transition-colors"
            aria-label="Close project modal"
            data-testid="close-project-modal-btn"
          >
            <X className="w-5 h-5 cursor-pointer" />
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
              <DocMetricTriadCard
                title="Mechanical (ME)"
                icon={<Wrench className="w-3.5 h-3.5 text-blue-500 shrink-0" />}
                total={project.disciplines.me.total}
                pending={project.disciplines.me.underReview}
                overdue={project.disciplines.me.overdue}
                approved={project.disciplines.me.approved}
                pendingLabel="PENDING"
                overdueLabel="OVERDUE"
                approvedLabel="APPROVED"
              />
              <DocMetricTriadCard
                title="Civil (CE)"
                icon={<HardHat className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                total={project.disciplines.ce.total}
                pending={project.disciplines.ce.underReview}
                overdue={project.disciplines.ce.overdue}
                approved={project.disciplines.ce.approved}
                pendingLabel="PENDING"
                overdueLabel="OVERDUE"
                approvedLabel="APPROVED"
              />
              <DocMetricTriadCard
                title="Electrical (EE)"
                icon={<Zap className="w-3.5 h-3.5 text-purple-500 shrink-0" />}
                total={project.disciplines.ee.total}
                pending={project.disciplines.ee.underReview}
                overdue={project.disciplines.ee.overdue}
                approved={project.disciplines.ee.approved}
                pendingLabel="PENDING"
                overdueLabel="OVERDUE"
                approvedLabel="APPROVED"
              />
            </div>

            {/* Deliverable Drawing Types Status Tiles */}
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1.5">
                Deliverable Drawing Types:
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

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              {/* ITP Submission by Discipline */}
              <div className="bg-white dark:bg-[#252526] p-3 rounded-xl border border-slate-200 dark:border-[#3c3c3c] flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-800 dark:text-slate-100 text-xs">
                    ITP Submissions
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">1 per branch</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { label: 'ME', active: Boolean(project.itpSubmissions?.me) },
                    { label: 'CE', active: Boolean(project.itpSubmissions?.ce) },
                    { label: 'EE', active: Boolean(project.itpSubmissions?.ee) },
                  ].map((branch) => (
                    <div
                      key={branch.label}
                      className={`py-2 px-1 rounded-lg flex flex-col items-center justify-center text-center border transition-colors ${
                        branch.active
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                          : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
                      }`}
                    >
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        {branch.label}
                      </span>
                      <span className="text-sm font-bold mt-0.5 whitespace-nowrap">
                        {branch.active ? 'Submitted' : 'Pending'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* RFI Transmittals */}
              <DocMetricTriadCard
                title="RFI Transmittals"
                total={project.pillars.control.total}
                pending={project.pillars.control.open}
                overdue={project.pillars.control.overdue}
                approved={project.pillars.control.closed}
                pendingLabel="PENDING"
                overdueLabel="OVERDUE"
                approvedLabel="APPROVED"
              />

              {/* ITR Reports */}
              <DocMetricTriadCard
                title="ITR Reports"
                total={project.pillars.control.total}
                pending={project.pillars.control.open}
                overdue={project.pillars.control.overdue}
                approved={project.pillars.control.closed}
                pendingLabel="PENDING"
                overdueLabel="OVERDUE"
                approvedLabel="APPROVED"
              />
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

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              {/* Card 1: NCR */}
              <DocMetricTriadCard
                title="NCR"
                total={project.pillars.ncr?.total ?? 0}
                pending={project.pillars.ncr?.open ?? 0}
                overdue={project.pillars.ncr?.overdue ?? 0}
                approved={project.pillars.ncr?.closed ?? 0}
                pendingLabel="PENDING"
                overdueLabel="OVERDUE"
                approvedLabel="CLOSED"
              />

              {/* Card 2: CAR */}
              <DocMetricTriadCard
                title="CAR"
                total={project.pillars.car?.total ?? 0}
                pending={project.pillars.car?.open ?? 0}
                overdue={project.pillars.car?.overdue ?? 0}
                approved={project.pillars.car?.closed ?? 0}
                pendingLabel="PENDING"
                overdueLabel="OVERDUE"
                approvedLabel="CLOSED"
              />

              {/* Card 3: Backlog Aging */}
              <div className="bg-white dark:bg-[#252526] p-3 rounded-xl border border-slate-200 dark:border-[#3c3c3c] flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-800 dark:text-slate-100 text-xs whitespace-nowrap">
                    Backlog Aging
                  </span>
                  {getAgingStatusBadge(project.pendingAgingDays, project.pillars.corrective.open)}
                </div>
                <div className="flex flex-col items-center justify-center py-1 text-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 leading-tight">
                    Average
                  </span>
                  <span
                    className={`text-base font-bold tabular-nums mt-0.5 ${
                      project.pillars.corrective.open === 0
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : project.pendingAgingDays >= 20
                        ? 'text-rose-600 dark:text-rose-400'
                        : project.pendingAgingDays >= 10
                        ? 'text-amber-500'
                        : 'text-emerald-600 dark:text-emerald-400'
                    }`}
                  >
                    {project.pillars.corrective.open === 0
                      ? '0 days'
                      : project.pendingAgingDays > 0
                      ? `${project.pendingAgingDays.toFixed(1)} days`
                      : '< 1 day'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 4: Engineering Change Tracking (FCR / DCR / VOR) */}
          <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-[#1e1e1e] border border-green-200/60 dark:border-green-900/40">
            <div className="flex items-center justify-between mb-3">
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

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              {/* Card 1: FCR */}
              <DocMetricTriadCard
                title="FCR"
                total={project.pillars.fcr?.total ?? 0}
                pending={project.pillars.fcr?.open ?? 0}
                overdue={project.pillars.fcr?.overdue ?? 0}
                approved={project.pillars.fcr?.closed ?? 0}
                pendingLabel="PENDING"
                overdueLabel="OVERDUE"
                approvedLabel="CLOSED"
              />

              {/* Card 2: DCR */}
              <DocMetricTriadCard
                title="DCR"
                total={project.pillars.dcr?.total ?? 0}
                pending={project.pillars.dcr?.open ?? 0}
                overdue={project.pillars.dcr?.overdue ?? 0}
                approved={project.pillars.dcr?.closed ?? 0}
                pendingLabel="PENDING"
                overdueLabel="OVERDUE"
                approvedLabel="CLOSED"
              />

              {/* Card 3: VOR */}
              <DocMetricTriadCard
                title="VOR"
                total={project.pillars.vor?.total ?? 0}
                pending={project.pillars.vor?.open ?? 0}
                overdue={project.pillars.vor?.overdue ?? 0}
                approved={project.pillars.vor?.closed ?? 0}
                pendingLabel="PENDING"
                overdueLabel="OVERDUE"
                approvedLabel="CLOSED"
              />
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
              <div className="bg-white dark:bg-[#252526] p-3 rounded-xl border border-slate-200 dark:border-[#3c3c3c]">
                <span className="font-bold text-slate-700 dark:text-slate-200 block mb-1">
                  Handover & Commissioning
                </span>
                <span className="text-slate-500 dark:text-slate-400">
                  {project.pillars.complete.total > 0
                    ? `${project.pillars.complete.closed} of ${project.pillars.complete.total} handover packages processed`
                    : 'Commissioning & Punchlists will initiate upon construction closure'}
                </span>
              </div>

              <div className="bg-white dark:bg-[#252526] p-3 rounded-xl border border-slate-200 dark:border-[#3c3c3c]">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-700 dark:text-slate-200">
                    Overdue SLA Compliance
                  </span>
                  <span
                    className={`text-xs font-bold tabular-nums ${
                      project.overdueCount > 0
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-emerald-600 dark:text-emerald-400'
                    }`}
                  >
                    {project.overdueCount === 0 ? '100% Compliant' : `${(100 - project.overduePercent).toFixed(1)}% On-Time`}
                  </span>
                </div>
                <span className="text-slate-500 dark:text-slate-400">
                  {project.overdueCount > 0
                    ? `${project.overdueCount} ${project.overdueCount === 1 ? 'transmittal exceeds' : 'transmittals exceed'} SLA turnaround window`
                    : '100% of transmittals within SLA response window'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};
