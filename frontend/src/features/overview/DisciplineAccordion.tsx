import React, { useState } from 'react';
import { ChevronDown, Wrench, HardHat, Zap, Clock, Tag } from 'lucide-react';

export interface DisciplineAccordionProps {
  disciplines: {
    me: { total: number; approved: number };
    ce: { total: number; approved: number };
    ee: { total: number; approved: number };
  };
  drawingTypes: string[];
  pendingAgingDays: number;
}

export const DisciplineAccordion: React.FC<DisciplineAccordionProps> = ({
  disciplines,
  drawingTypes,
  pendingAgingDays,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const calcPct = (app: number, tot: number) => (tot > 0 ? (app / tot) * 100 : 0);

  const mePct = calcPct(disciplines.me.approved, disciplines.me.total);
  const cePct = calcPct(disciplines.ce.approved, disciplines.ce.total);
  const eePct = calcPct(disciplines.ee.approved, disciplines.ee.total);

  return (
    <div className="mt-3 border-t border-slate-100 dark:border-[#3c3c3c] pt-2.5" data-testid="discipline-accordion">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="expand-btn w-full flex items-center justify-between text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors py-1 focus:outline-none"
        aria-expanded={isOpen}
      >
        <span className="flex items-center gap-1.5">
          <span>Engineering Discipline & Drawing Breakdown</span>
        </span>
        <ChevronDown
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180 text-blue-600 dark:text-[#3794ff]' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="mt-3 p-3 bg-slate-50 dark:bg-[#1e1e1e] rounded-lg border border-slate-200/70 dark:border-[#3c3c3c] space-y-3">
          {/* Engineering Disciplines Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            {/* ME */}
            <div className="bg-white dark:bg-[#252526] p-2.5 rounded border border-slate-200/60 dark:border-[#3c3c3c]">
              <div className="flex items-center justify-between mb-1">
                <span className="flex items-center gap-1 font-bold text-slate-700 dark:text-slate-200">
                  <Wrench className="w-3.5 h-3.5 text-blue-500" /> ME (Mechanical)
                </span>
                <span className="text-[11px] font-bold tabular-nums text-slate-900 dark:text-slate-100">
                  {disciplines.me.approved}/{disciplines.me.total}
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-[#1e1e1e] border dark:border-[#3c3c3c]/50 h-1.5 rounded-full overflow-hidden">
                <div className="bg-blue-500 h-full rounded-full" style={{ width: `${mePct}%` }} />
              </div>
            </div>

            {/* CE */}
            <div className="bg-white dark:bg-[#252526] p-2.5 rounded border border-slate-200/60 dark:border-[#3c3c3c]">
              <div className="flex items-center justify-between mb-1">
                <span className="flex items-center gap-1 font-bold text-slate-700 dark:text-slate-200">
                  <HardHat className="w-3.5 h-3.5 text-amber-500" /> CE (Civil)
                </span>
                <span className="text-[11px] font-bold tabular-nums text-slate-900 dark:text-slate-100">
                  {disciplines.ce.approved}/{disciplines.ce.total}
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-[#1e1e1e] border dark:border-[#3c3c3c]/50 h-1.5 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-full rounded-full" style={{ width: `${cePct}%` }} />
              </div>
            </div>

            {/* EE */}
            <div className="bg-white dark:bg-[#252526] p-2.5 rounded border border-slate-200/60 dark:border-[#3c3c3c]">
              <div className="flex items-center justify-between mb-1">
                <span className="flex items-center gap-1 font-bold text-slate-700 dark:text-slate-200">
                  <Zap className="w-3.5 h-3.5 text-emerald-500" /> EE (Electrical)
                </span>
                <span className="text-[11px] font-bold tabular-nums text-slate-900 dark:text-slate-100">
                  {disciplines.ee.approved}/{disciplines.ee.total}
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-[#1e1e1e] border dark:border-[#3c3c3c]/50 h-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${eePct}%` }} />
              </div>
            </div>
          </div>

          {/* Drawing Type Chips & Aging metric */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/60 dark:border-[#3c3c3c] text-xs">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Tag className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-500 dark:text-slate-400 font-medium">Drawing Types:</span>
              <div className="flex gap-1 flex-wrap">
                {drawingTypes.map((dt) => (
                  <span
                    key={dt}
                    className="px-1.5 py-0.5 rounded bg-white dark:bg-[#252526] text-[10px] font-bold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-[#3c3c3c]"
                  >
                    {dt}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Pending Aging Avg:</span>
              <span className="font-bold tabular-nums text-slate-800 dark:text-slate-200">
                {pendingAgingDays} days
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

