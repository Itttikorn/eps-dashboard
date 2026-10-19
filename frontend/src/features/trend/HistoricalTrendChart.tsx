import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { DailyTrendDataPoint, TrendMetricType } from '../../api/types';
import { getProjectColor } from '../../lib/palette';
import { formatDate } from '../../lib/format';
import { UnifiedCustomTooltip } from './UnifiedCustomTooltip';
import { ChartSkeleton } from '../../components/ui/Skeletons';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorAlert } from '../../components/ui/ErrorAlert';

export interface HistoricalTrendChartProps {
  data?: DailyTrendDataPoint[];
  selectedProjectIds: string[];
  allKnownProjectIds?: string[];
  metricType: TrendMetricType;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
}

const METRIC_LABELS: Record<TrendMetricType, string> = {
  total_documents: 'Total Documents',
  approved_count: 'Approved Documents',
  in_review_count: 'In-Review Backlog',
  overdue_count: 'Overdue Volume',
};

export const HistoricalTrendChart: React.FC<HistoricalTrendChartProps> = ({
  data = [],
  selectedProjectIds,
  allKnownProjectIds = [],
  metricType,
  isLoading = false,
  isError = false,
  onRetry,
}) => {
  if (isLoading) {
    return <ChartSkeleton />;
  }

  if (isError) {
    return (
      <ErrorAlert
        title="Failed to load historical trend analytics"
        message="Could not retrieve the time-series metric data from the server."
        onRetry={onRetry}
      />
    );
  }

  if (selectedProjectIds.length === 0) {
    return (
      <EmptyState
        title="No Projects Selected for Comparison"
        description="Please select at least one project from the project selector to display trend curves."
      />
    );
  }

  if (data.length === 0) {
    return (
      <EmptyState
        title="No Historical Data Found"
        description="There is no historical snapshot data recorded for the selected projects and date preset."
      />
    );
  }

  return (
    <div
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs"
      data-testid="historical-trend-chart-container"
    >
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wide">
            Comparative Time-Series ({METRIC_LABELS[metricType]})
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Hover curves to view synchronized comparative snapshot details
          </p>
        </div>
      </div>

      <div className="w-full h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#94a3b833" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={(d) => formatDate(d)}
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#cbd5e140' }}
            />
            <YAxis
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#cbd5e140' }}
              tickFormatter={(v) => Number(v).toLocaleString()}
            />
            <Tooltip
              content={
                <UnifiedCustomTooltip metricLabel={METRIC_LABELS[metricType]} />
              }
            />
            <Legend
              wrapperStyle={{ paddingTop: 15, fontSize: 12 }}
              iconType="circle"
            />
            {selectedProjectIds.map((projId) => {
              const colorInfo = getProjectColor(projId, allKnownProjectIds);

              return (
                <Line
                  key={projId}
                  type="monotone"
                  dataKey={projId}
                  name={projId}
                  stroke={colorInfo.color}
                  strokeWidth={2}
                  strokeDasharray={colorInfo.strokeDasharray}
                  dot={{ r: 2.5, fill: colorInfo.color }}
                  activeDot={{ r: 5, stroke: '#ffffff', strokeWidth: 2 }}
                  isAnimationActive={true}
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

