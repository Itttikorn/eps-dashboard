import React, { useState, useRef, useMemo, useEffect } from 'react';
import { TrendMetricType } from '../../api/types';
import { TrendPreset } from '../../lib/trend';
import { useHistoricalTrends, useProjectMatrix } from '../../api/queries';
import { PresetToolbar } from './PresetToolbar';
import { MetricSelector } from './MetricSelector';
import { ProjectSelectorDropdown } from './ProjectSelectorDropdown';
import { HistoricalTrendChart } from './HistoricalTrendChart';
import { ChartErrorBoundary } from '../../components/ui/ErrorBoundaries';

export const TrendTab: React.FC = () => {
  const [preset, setPreset] = useState<TrendPreset>('90D');
  const [metric, setMetric] = useState<TrendMetricType>('total_documents');
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const hasAutoSelectedRef = useRef(false);

  // Fetch all known projects to populate selector
  const { data: projects } = useProjectMatrix();
  const availableProjects = useMemo(
    () => (projects ?? []).map((p) => ({ id: p.projectId, name: p.projectName })),
    [projects]
  );
  const allKnownProjectIds = useMemo(
    () => availableProjects.map((p) => p.id),
    [availableProjects]
  );

  // Auto-select first 3 projects once when projects first load
  useEffect(() => {
    if (!hasAutoSelectedRef.current && availableProjects.length > 0) {
      hasAutoSelectedRef.current = true;
      setSelectedProjectIds(availableProjects.slice(0, 3).map((p) => p.id));
    }
  }, [availableProjects]);

  const {
    data: trendData = [],
    isLoading,
    isError,
    refetch,
  } = useHistoricalTrends(selectedProjectIds, preset, metric);

  const handleToggleProject = (id: string) => {
    setSelectedProjectIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    setSelectedProjectIds(availableProjects.map((p) => p.id));
  };

  const handleClearAll = () => {
    setSelectedProjectIds([]);
  };

  return (
    <div className="space-y-6" data-testid="trend-tab">
      {/* Top Filter Bar: Presets & Metric Selector */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <PresetToolbar currentPreset={preset} onSelectPreset={setPreset} />
        <MetricSelector selectedMetric={metric} onSelectMetric={setMetric} />
      </div>

      {/* Project Selector Multi-select Grid */}
      <ProjectSelectorDropdown
        availableProjects={availableProjects}
        selectedProjectIds={selectedProjectIds}
        onToggleProject={handleToggleProject}
        onSelectAll={handleSelectAll}
        onClearAll={handleClearAll}
      />

      {/* Time-Series Canvas */}
      <ChartErrorBoundary>
        <HistoricalTrendChart
          data={trendData}
          selectedProjectIds={selectedProjectIds}
          allKnownProjectIds={allKnownProjectIds}
          metricType={metric}
          isLoading={isLoading}
          isError={isError}
          onRetry={() => refetch()}
        />
      </ChartErrorBoundary>
    </div>
  );
};
