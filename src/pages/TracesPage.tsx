import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useProject } from '../contexts/ProjectContext';
import { fetchTraces, type Trace } from '../api/traces';
import { format, parseISO } from 'date-fns';
import ExecutionDetail from './ExecutionDetail';

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms.toFixed(0)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

function safeParseAttributes(raw: string): Record<string, unknown> {
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    success: 'bg-green-100 text-green-800',
    completed: 'bg-green-100 text-green-800',
    error: 'bg-red-100 text-red-800',
    failed: 'bg-red-100 text-red-800',
    running: 'bg-blue-100 text-blue-800',
  };
  const cls = colors[status] ?? 'bg-gray-100 text-gray-800';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${cls}`}>
      {status}
    </span>
  );
}

export function TracesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentProject } = useProject();
  const projectId = currentProject?.project_id || 'default';

  const agentFilter = searchParams.get('agent') ?? '';
  const startFilter = searchParams.get('start') ?? '';
  const endFilter = searchParams.get('end') ?? '';

  const { data, isLoading, error } = useQuery({
    queryKey: ['traces', projectId, agentFilter, startFilter, endFilter],
    queryFn: () =>
      fetchTraces(projectId, {
        agentName: agentFilter || undefined,
        startTime: startFilter || undefined,
        endTime: endFilter || undefined,
        limit: 100,
      }),
    staleTime: 60 * 1000,
  });

  const traces = data?.traces ?? [];
  const [selectedTraceId, setSelectedTraceId] = useState<string | null>(null);

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Link to="/drift" className="hover:text-indigo-600 transition-colors">
              Drift
            </Link>
            <span>/</span>
            <span className="text-gray-900">Traces</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Traces</h1>
          {agentFilter && (
            <p className="mt-1 text-sm text-gray-500">
              Filtered by agent: <span className="font-medium text-gray-800">{agentFilter}</span>
            </p>
          )}
        </div>

        {/* Clear filter button */}
        {agentFilter && (
          <button
            onClick={() => setSearchParams({})}
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm rounded-md text-gray-600 bg-white hover:bg-gray-50"
          >
            Clear filter
          </button>
        )}
      </div>

      {/* Active filters chip */}
      {(agentFilter || startFilter || endFilter) && (
        <div className="mb-4 flex flex-wrap gap-2">
          {agentFilter && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-sm font-medium border border-indigo-200">
              Agent: {agentFilter}
            </span>
          )}
          {startFilter && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-sm border border-gray-200">
              From: {startFilter}
            </span>
          )}
          {endFilter && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-sm border border-gray-200">
              To: {endFilter}
            </span>
          )}
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-lg bg-gray-200" />
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          Failed to load traces. Please try again.
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && traces.length === 0 && (
        <div className="text-center py-16 text-gray-500">
          <svg className="mx-auto h-12 w-12 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="font-medium">No traces found</p>
          {agentFilter && (
            <p className="mt-1 text-sm">No traces for agent "{agentFilter}" in the selected time window.</p>
          )}
        </div>
      )}

      {/* Table */}
      {!isLoading && traces.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 text-sm text-gray-500">
            {data?.count} trace{data?.count !== 1 ? 's' : ''}
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trace ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Agent / Service
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Spans
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Started
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {traces.map((trace: Trace) => {
                  const attrs = safeParseAttributes(trace.attributes);
                  const agentName = attrs['agent.name'] as string | undefined;
                  const model = attrs['llm.model'] as string | undefined;

                  let startedLabel = '—';
                  try {
                    startedLabel = format(parseISO(trace.started_at), 'MMM d, HH:mm:ss');
                  } catch {
                    // leave as —
                  }

                  return (
                    <tr key={trace.trace_id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs text-gray-600">
                          {trace.trace_id.slice(0, 16)}…
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900">
                          {agentName ?? trace.service_name}
                        </div>
                        {model && (
                          <div className="text-xs text-gray-400">{model}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={trace.status} />
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {formatDuration(trace.duration_ms)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {trace.span_count}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {startedLabel}
                      </td>
                      <td className="px-4 py-3">
                        {(trace.status === 'error' || trace.status === 'failed') && (
                          <button
                            onClick={() => setSelectedTraceId(trace.trace_id)}
                            className="inline-flex items-center gap-1 text-sm font-medium text-red-600 hover:text-red-800 transition-colors"
                          >
                            Debug →
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedTraceId && (
        <ExecutionDetail
          executionId={selectedTraceId}
          onClose={() => setSelectedTraceId(null)}
          autoDebug={true}
        />
      )}
    </div>
  );
}
