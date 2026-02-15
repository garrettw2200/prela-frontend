import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  fetchReplayExecutionStatus,
  fetchReplayComparison,
  ReplayComparisonResponse,
  SpanDifference,
} from '../api/replay';

function StatusBadge({ status }: { status: string }) {
  const color =
    status === 'completed'
      ? 'bg-green-100 text-green-800'
      : status === 'running'
        ? 'bg-yellow-100 text-yellow-800'
        : 'bg-red-100 text-red-800';

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${color}`}>
      {status}
    </span>
  );
}

function DeltaValue({ original, modified, unit, invert }: { original: number; modified: number; unit: string; invert?: boolean }) {
  const delta = modified - original;
  const pct = original !== 0 ? ((delta / original) * 100).toFixed(1) : 'N/A';
  // For cost/duration, negative = good (green). invert flips this logic.
  const isGood = invert ? delta > 0 : delta < 0;
  const color = delta === 0 ? 'text-gray-500' : isGood ? 'text-green-600' : 'text-red-600';

  return (
    <span className={`text-sm font-medium ${color}`}>
      {delta > 0 ? '+' : ''}{delta.toFixed(unit === 'ms' ? 0 : 4)}{unit}
      {pct !== 'N/A' && ` (${delta > 0 ? '+' : ''}${pct}%)`}
    </span>
  );
}

function SummaryCard({ label, original, modified, unit, invert }: { label: string; original: number; modified: number; unit: string; invert?: boolean }) {
  return (
    <div className="rounded-lg bg-white p-4 shadow">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <div className="mt-2 flex items-baseline gap-4">
        <div>
          <p className="text-xs text-gray-400">Original</p>
          <p className="text-lg font-semibold text-gray-900">
            {unit === '$' ? `$${original.toFixed(4)}` : `${original.toFixed(unit === 'ms' ? 0 : 0)}${unit}`}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Modified</p>
          <p className="text-lg font-semibold text-gray-900">
            {unit === '$' ? `$${modified.toFixed(4)}` : `${modified.toFixed(unit === 'ms' ? 0 : 0)}${unit}`}
          </p>
        </div>
      </div>
      <div className="mt-1">
        <DeltaValue original={original} modified={modified} unit={unit === '$' ? '' : unit} invert={invert} />
      </div>
    </div>
  );
}

function ComparisonView({ comparison }: { comparison: ReplayComparisonResponse }) {
  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <SummaryCard
          label="Duration"
          original={comparison.original.total_duration_ms}
          modified={comparison.modified.total_duration_ms}
          unit="ms"
        />
        <SummaryCard
          label="Total Tokens"
          original={comparison.original.total_tokens}
          modified={comparison.modified.total_tokens}
          unit=""
        />
        <SummaryCard
          label="Cost"
          original={comparison.original.total_cost_usd}
          modified={comparison.modified.total_cost_usd}
          unit="$"
        />
      </div>

      {/* Summary text */}
      {comparison.summary && (
        <div className="rounded-lg bg-blue-50 p-4">
          <p className="text-sm text-blue-800">{comparison.summary}</p>
        </div>
      )}

      {/* Differences table */}
      {comparison.differences.length > 0 && (
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-900">Span Differences</h3>
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Span</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Field</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Original</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Modified</th>
                {comparison.semantic_similarity_available && (
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Similarity</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {comparison.differences.map((diff: SpanDifference, i: number) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{diff.span_name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{diff.field}</td>
                  <td className="max-w-xs truncate px-6 py-4 font-mono text-xs text-gray-500">
                    {typeof diff.original_value === 'string'
                      ? diff.original_value.slice(0, 100)
                      : JSON.stringify(diff.original_value)?.slice(0, 100)}
                  </td>
                  <td className="max-w-xs truncate px-6 py-4 font-mono text-xs text-gray-500">
                    {typeof diff.modified_value === 'string'
                      ? diff.modified_value.slice(0, 100)
                      : JSON.stringify(diff.modified_value)?.slice(0, 100)}
                  </td>
                  {comparison.semantic_similarity_available && (
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {diff.semantic_similarity != null
                        ? `${(diff.semantic_similarity * 100).toFixed(1)}%`
                        : '—'}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function ReplayExecutionDetail() {
  const { executionId } = useParams<{ executionId: string }>();

  const { data: status, isLoading: statusLoading, error: statusError } = useQuery({
    queryKey: ['replay-execution', executionId],
    queryFn: () => fetchReplayExecutionStatus(executionId!),
    enabled: !!executionId,
    refetchInterval: (query) => {
      if (query.state.data?.status === 'running') return 3000;
      return false;
    },
  });

  const { data: comparison } = useQuery({
    queryKey: ['replay-comparison', executionId],
    queryFn: () => fetchReplayComparison(executionId!),
    enabled: !!executionId && status?.status === 'completed',
    staleTime: Infinity,
  });

  if (statusLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
        <div className="h-32 animate-pulse rounded-lg bg-gray-200" />
      </div>
    );
  }

  if (statusError || !status) {
    return (
      <div className="rounded-lg bg-red-50 p-4">
        <p className="text-sm text-red-800">
          Failed to load execution: {statusError instanceof Error ? statusError.message : 'Not found'}
        </p>
        <Link to="/replay" className="mt-2 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-800">
          Back to Replay Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Link to="/replay" className="text-sm text-indigo-600 hover:text-indigo-800">
          &larr; Back to Replay Dashboard
        </Link>
        <div className="mt-2 flex items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-900">Replay Execution</h1>
          <StatusBadge status={status.status} />
        </div>
        <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-500">
          <span>
            Execution: <span className="font-mono">{status.execution_id.slice(0, 16)}...</span>
          </span>
          <span>
            Trace: <span className="font-mono">{status.trace_id.slice(0, 16)}...</span>
          </span>
          <span>Started: {new Date(status.started_at).toLocaleString()}</span>
          {status.completed_at && (
            <span>Completed: {new Date(status.completed_at).toLocaleString()}</span>
          )}
        </div>
      </div>

      {/* Parameters */}
      {status.parameters && Object.keys(status.parameters).length > 0 && (
        <div className="mb-6 rounded-lg bg-white p-4 shadow">
          <h3 className="mb-2 text-sm font-medium text-gray-900">Parameters</h3>
          <div className="flex flex-wrap gap-4">
            {Object.entries(status.parameters).map(([key, value]) => (
              value != null && (
                <div key={key} className="text-sm">
                  <span className="font-medium text-gray-600">{key}:</span>{' '}
                  <span className="text-gray-800">
                    {typeof value === 'string' ? (value.length > 50 ? value.slice(0, 50) + '...' : value) : String(value)}
                  </span>
                </div>
              )
            ))}
          </div>
        </div>
      )}

      {/* Running state */}
      {status.status === 'running' && (
        <div className="flex items-center gap-3 rounded-lg bg-yellow-50 p-6">
          <svg className="h-5 w-5 animate-spin text-yellow-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-sm font-medium text-yellow-800">Replay in progress... This may take a few moments.</p>
        </div>
      )}

      {/* Failed state */}
      {status.status === 'failed' && (
        <div className="rounded-lg bg-red-50 p-6">
          <h3 className="text-sm font-medium text-red-800">Replay Failed</h3>
          <p className="mt-1 text-sm text-red-700">{status.error || 'Unknown error occurred'}</p>
        </div>
      )}

      {/* Completed state with comparison */}
      {status.status === 'completed' && comparison && (
        <ComparisonView comparison={comparison} />
      )}

      {/* Completed but comparison still loading */}
      {status.status === 'completed' && !comparison && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 animate-pulse rounded-lg bg-gray-200" />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
