import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useProject } from '../contexts/ProjectContext';
import { fetchTraces, type Trace } from '../api/traces';
import { format, parseISO } from 'date-fns';
import ExecutionDetail from './ExecutionDetail';

const PAGE_SIZE = 50;

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

  // Read filters from URL
  const agentFilter = searchParams.get('agent') ?? '';
  const statusFilter = searchParams.get('status') ?? '';
  const startFilter = searchParams.get('start') ?? '';
  const endFilter = searchParams.get('end') ?? '';
  const pageParam = parseInt(searchParams.get('page') ?? '1', 10);
  const currentPage = isNaN(pageParam) || pageParam < 1 ? 1 : pageParam;

  // Local state for filter inputs (applied on submit)
  const [agentInput, setAgentInput] = useState(agentFilter);
  const [statusInput, setStatusInput] = useState(statusFilter);
  const [startInput, setStartInput] = useState(startFilter);
  const [endInput, setEndInput] = useState(endFilter);

  const offset = (currentPage - 1) * PAGE_SIZE;

  const { data, isLoading, error } = useQuery({
    queryKey: ['traces', projectId, agentFilter, statusFilter, startFilter, endFilter, offset],
    queryFn: () =>
      fetchTraces(projectId, {
        agentName: agentFilter || undefined,
        status: statusFilter || undefined,
        startTime: startFilter || undefined,
        endTime: endFilter || undefined,
        limit: PAGE_SIZE,
        offset,
      }),
    staleTime: 60 * 1000,
  });

  const traces = data?.traces ?? [];
  const hasMore = traces.length === PAGE_SIZE;
  const [selectedTraceId, setSelectedTraceId] = useState<string | null>(null);

  function applyFilters() {
    const params: Record<string, string> = {};
    if (agentInput) params.agent = agentInput;
    if (statusInput) params.status = statusInput;
    if (startInput) params.start = startInput;
    if (endInput) params.end = endInput;
    // Reset to page 1 when filters change
    setSearchParams(params);
  }

  function clearFilters() {
    setAgentInput('');
    setStatusInput('');
    setStartInput('');
    setEndInput('');
    setSearchParams({});
  }

  function goToPage(page: number) {
    const params: Record<string, string> = {};
    if (agentFilter) params.agent = agentFilter;
    if (statusFilter) params.status = statusFilter;
    if (startFilter) params.start = startFilter;
    if (endFilter) params.end = endFilter;
    if (page > 1) params.page = page.toString();
    setSearchParams(params);
  }

  const hasActiveFilters = agentFilter || statusFilter || startFilter || endFilter;

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Traces</h1>
        <p className="mt-1 text-sm text-gray-500">
          View and investigate execution traces across your AI system
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Agent / Service</label>
            <input
              type="text"
              value={agentInput}
              onChange={(e) => setAgentInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
              placeholder="Filter by agent..."
              className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
            <select
              value={statusInput}
              onChange={(e) => setStatusInput(e.target.value)}
              className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">All statuses</option>
              <option value="success">Success</option>
              <option value="error">Error</option>
              <option value="failed">Failed</option>
              <option value="running">Running</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">From</label>
            <input
              type="datetime-local"
              value={startInput}
              onChange={(e) => setStartInput(e.target.value)}
              className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">To</label>
            <input
              type="datetime-local"
              value={endInput}
              onChange={(e) => setEndInput(e.target.value)}
              className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div className="flex items-end gap-2">
            <button
              onClick={applyFilters}
              className="px-4 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 transition-colors"
            >
              Filter
            </button>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="px-3 py-1.5 border border-gray-300 text-sm text-gray-600 rounded-md bg-white hover:bg-gray-50 transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

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
          {hasActiveFilters && (
            <p className="mt-1 text-sm">Try adjusting your filters.</p>
          )}
        </div>
      )}

      {/* Table */}
      {!isLoading && traces.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <span className="text-sm text-gray-500">
              {currentPage > 1 && `Page ${currentPage} · `}
              {data?.count} trace{data?.count !== 1 ? 's' : ''}
            </span>
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

                  const isError = trace.status === 'error' || trace.status === 'failed';

                  return (
                    <tr
                      key={trace.trace_id}
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => setSelectedTraceId(trace.trace_id)}
                    >
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
                        <span
                          className={`inline-flex items-center gap-1 text-sm font-medium transition-colors ${
                            isError
                              ? 'text-red-600 hover:text-red-800'
                              : 'text-indigo-600 hover:text-indigo-800'
                          }`}
                        >
                          {isError ? 'Debug' : 'View'} →
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage <= 1}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm rounded-md text-gray-600 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <span className="text-sm text-gray-500">Page {currentPage}</span>
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={!hasMore}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm rounded-md text-gray-600 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {selectedTraceId && (
        <ExecutionDetail
          executionId={selectedTraceId}
          onClose={() => setSelectedTraceId(null)}
          autoDebug={traces.some(
            (t) => t.trace_id === selectedTraceId && (t.status === 'error' || t.status === 'failed')
          )}
        />
      )}
    </div>
  );
}
