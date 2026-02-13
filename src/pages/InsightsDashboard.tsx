import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useProject } from '../contexts/ProjectContext';
import { fetchInsightsSummary } from '../api/insights';
import { HealthScore } from '../components/insights/HealthScore';
import { TopIssues } from '../components/insights/TopIssues';
import { CostInsights } from '../components/insights/CostInsights';
import { SecuritySummary } from '../components/insights/SecuritySummary';

const TIME_WINDOWS = [
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
  { value: '90d', label: '90 days' },
] as const;

export function InsightsDashboard() {
  const { currentProject } = useProject();
  const projectId = currentProject?.project_id || 'default';
  const [timeWindow, setTimeWindow] = useState('7d');

  const { data, isLoading, error } = useQuery({
    queryKey: ['insights-summary', projectId, timeWindow],
    queryFn: () => fetchInsightsSummary(projectId, timeWindow),
    staleTime: 2 * 60 * 1000,
  });

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Insights</h1>
          <p className="mt-1 text-sm text-gray-500">
            Health overview for your AI system
          </p>
        </div>
        <div className="flex rounded-lg border border-gray-300 bg-white">
          {TIME_WINDOWS.map((tw) => (
            <button
              key={tw.value}
              onClick={() => setTimeWindow(tw.value)}
              className={`px-3 py-1.5 text-sm font-medium transition-colors first:rounded-l-lg last:rounded-r-lg ${
                timeWindow === tw.value
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {tw.label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-4">
          <div className="h-32 animate-pulse rounded-lg bg-gray-200" />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="h-64 animate-pulse rounded-lg bg-gray-200" />
            <div className="h-64 animate-pulse rounded-lg bg-gray-200" />
            <div className="h-64 animate-pulse rounded-lg bg-gray-200" />
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-lg bg-red-50 p-4">
          <p className="text-sm text-red-800">
            Failed to load insights: {error instanceof Error ? error.message : 'Unknown error'}
          </p>
        </div>
      )}

      {/* Empty state */}
      {data && data.trace_count === 0 && (
        <div className="rounded-lg bg-white p-12 text-center shadow">
          <h3 className="text-lg font-medium text-gray-900">No traces yet</h3>
          <p className="mt-2 text-sm text-gray-500">
            Start sending traces via the SDK, OTLP, or Langfuse import to see insights here.
          </p>
        </div>
      )}

      {/* Dashboard */}
      {data && data.trace_count > 0 && (
        <div className="space-y-4">
          <HealthScore
            score={data.health_score}
            trend={data.health_trend}
            errorRate={data.error_rate}
            traceCount={data.trace_count}
          />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <TopIssues issues={data.top_issues} />
            <CostInsights data={data.cost_insights} />
            <SecuritySummary data={data.security_summary} />
          </div>
        </div>
      )}
    </div>
  );
}
