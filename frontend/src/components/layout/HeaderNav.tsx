import React from 'react';
import { UploadCloud, Layers, Activity } from 'lucide-react';
import { useHealthCheck } from '../../api/queries';
import { ThemeToggle } from '../ui/ThemeToggle';

export interface HeaderNavProps {
  onOpenUploadModal: () => void;
  isDark?: boolean;
  onThemeChange?: (isDark: boolean) => void;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  onOpenUploadModal,
  isDark,
  onThemeChange,
}) => {
  const { data: health, isSuccess, isError } = useHealthCheck();

  const isHealthy = isSuccess && (health?.service === 'UP' || health?.status === 'healthy');

  return (
    <header
      className="bg-[#152444] dark:bg-[#181818] text-white border-b border-slate-800 dark:border-[#333333] shadow-md sticky top-0 z-40"
      data-testid="header-nav"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand and Title */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold tracking-tight text-white leading-none">
                Conzol Doc Tracker
              </h1>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30">
                v1.0.0
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 hidden sm:block">
              Corporate Document Management System
            </p>
          </div>
        </div>

        {/* Right Actions: Health heartbeat, CSV quick upload trigger, Theme toggle */}
        <div className="flex items-center gap-3">
          {/* Health Heartbeat indicator */}
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/60 border border-slate-800 text-xs text-slate-300"
            title={
              isHealthy
                ? 'System Backend: UP'
                : isError
                ? 'System Backend: Offline / Connection issue'
                : 'Checking system status...'
            }
            data-testid="health-heartbeat"
          >
            <Activity className="w-3.5 h-3.5 text-slate-400" />
            <span
              className={`w-2 h-2 rounded-full ${
                isHealthy
                  ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
                  : isError
                  ? 'bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.8)]'
                  : 'bg-amber-400 animate-pulse'
              }`}
            />
            <span className="text-[11px] font-medium hidden md:inline">
              {isHealthy ? 'Operational' : isError ? 'Degraded' : 'Connecting'}
            </span>
          </div>

          {/* Quick Upload Button */}
          <button
            type="button"
            onClick={onOpenUploadModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-xs transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-[#152444] cursor-pointer"
            data-testid="header-upload-btn"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload CSV</span>
          </button>

          {/* Theme Toggle */}
          <ThemeToggle isDark={isDark} onThemeChange={onThemeChange} />
        </div>
      </div>
    </header>
  );
};

