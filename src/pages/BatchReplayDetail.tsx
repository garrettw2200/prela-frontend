import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchBatchStatus, ReplayHistoryItem } from '../api/replay';

function StatusBadge({ status }: { status: string }) {
  const color =
    status === 'completed'
      ? 'bg-green-100 text-green-800'
      : status === 'running' || status === 'pending'
        ? 'bg-yellow-100 text-yellow-800'
        : status === 'partial'
          ? 'bg-orange-100 text-orange-800'
          : 'bg-red-100 text-red-800';

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${color}`}>
      {status}
    </span>
  );
}

function DeltaValue({ value, unit }: { value: number; unit: string }) {
  const isGood = value < 0;
  const color = value === 0 ? 'text-gray-500' : isGood ? 'text-green-600' : 'text-red-600';

  return (
    <span className={`text-lg font-semibold ${color}`}>
      {value > 0 ? '+' : ''}{unit === '$' ? `$${Math.abs(value).toFixed(4)}` : `${value.toFixed(unit === 'ms' ? 0 : 0)}${unit}`}
    </span>
  );
}

export function BatchReplayDetail() {
  const { batchId } = useParams<{ batchId: string }>();
  const navigate = useNavigate();

  const { data: batch, isLoading, error } = useQuery({
    queryKey: ['replay-batch', batchId],
    queryFn: () => fetchBatchStatus(batchId!, true),
    enabled: !!batchId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === 'running' || status === 'pending') return 3000;
      return false;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
        <div className="h-32 animate-pulse rounded-lg bg-gray-200" />
      </div>
    );
  }

  if (error || !batch) {
    return (
      <div className="rounded-lg bg-red-50 p-4">
        <p className="text-sm text-red-800">
          Failed to load batch: {error instanceof Error ? error.message : 'Not found'}
        </p>
        <Link to="/replay" className="mt-2 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-800">
          Back to Replay Dashboard
        </Link>
      </div>
    );
  }

  const progressPct = batch.total_traces > 0
    ? ((batch.completed_traces + batch.failed_traces) / batch.total_traces) * 100
    : 0;
  const isRunning = batch.status === 'running' || batch.status === 'pending';

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Link to="/replay" className="text-sm text-indigo-600 hover:text-indigo-800">
          &larr; Back to Replay Dashboard
        </Link>
        <div className="mt-2 flex items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-900">Batch Replay</h1>
          <StatusBadge status={batch.status} />
        </div>
        <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-500">
          <span>
            Batch: <span className="font-mono">{batch.batch_id.slice(0, 16)}...</span>
          </span>
          <span>Created: {new Date(batch.created_at).toLocaleString()}</span>
          {batch.started_at && <span>Started: {new Date(batch.started_at).toLocaleString()}</span>}
          {batch.completed_at && <span>Completed: {new Date(batch.completed_at).toLocaleString()}</span>}
        </div>
      </div>

      {/* Parameters */}
      {batch.parameters && Object.keys(batch.parameters).length > 0 && (
        <div className="mb-6 rounded-lg bg-white p-4 shadow">
          <h3 className="mb-2 text-sm font-medium text-gray-900">Parameters</h3>
          <div className="flex flex-wrap gap-4">
            {Object.entries(batch.parameters).map(([key, value]) => (
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

      {/* Progress bar */}
      <div className="mb-6 rounded-lg bg-white p-4 shadow">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-900">Progress</h3>
          <span className="text-sm text-gray-500">
            {batch.completed_traces + batch.failed_traces} / {batch.total_traces} traces
          </span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isRunning
                ? 'animate-pulse bg-indigo-500'
                : batch.failed_traces > 0
                  ? 'bg-orange-500'
                  : 'bg-green-500'
            }`}
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <div className="mt-2 flex gap-4 text-xs text-gray-500">
          <span className="text-green-600">{batch.completed_traces} completed</span>
          {batch.failed_traces > 0 && (
            <span className="text-red-600">{batch.failed_traces} failed</span>
          )}
          {isRunning && (
            <span className="text-yellow-600">
              {batch.total_traces - batch.completed_traces - batch.failed_traces} remaining
            </span>
          )}
        </div>
      </div>

      {/* Running state */}
      {isRunning && (
        <div className="mb-6 flex items-center gap-3 rounded-lg bg-yellow-50 p-4">
          <svg className="h-5 w-5 animate-spin text-yellow-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-sm font-medium text-yellow-800">Batch replay in progress... Replaying up to 3 traces concurrently.</p>
        </div>
      )}

      {/* Summary cards (when complete) */}
      {batch.summary && (batch.status === 'completed' || batch.status === 'partial') && (
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          {batch.summary.cost_delta_usd != null && (
            <div className="rounded-lg bg-white p-4 shadow">
              <p className="text-sm font-medium text-gray-500">Total Cost Delta</p>
              <div className="mt-2">
                <DeltaValue value={batch.summary.cost_delta_usd} unit="$" />
              </div>
              {batch.summary.total_original_cost_usd != null && batch.summary.total_modified_cost_usd != null && (
                <p className="mt-1 text-xs text-gray-400">
                  ${batch.summary.total_original_cost_usd.toFixed(4)} &rarr; ${batch.summary.total_modified_cost_usd.toFixed(4)}
                </p>
              )}
            </div>
          )}
          {batch.summary.token_delta != null && (
            <div className="rounded-lg bg-white p-4 shadow">
              <p className="text-sm font-medium text-gray-500">Total Token Delta</p>
              <div className="mt-2">
                <DeltaValue value={batch.summary.token_delta} unit="" />
                <span className="ml-1 text-sm text-gray-500">tokens</span>
              </div>
            </div>
          )}
          {batch.summary.avg_duration_delta_ms != null && (
            <div className="rounded-lg bg-white p-4 shadow">
              <p className="text-sm font-medium text-gray-500">Avg Duration Delta</p>
              <div className="mt-2">
                <DeltaValue value={batch.summary.avg_duration_delta_ms} unit="ms" />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error state */}
      {batch.status === 'failed' && batch.error && (
        <div className="mb-6 rounded-lg bg-red-50 p-4">
          <h3 className="text-sm font-medium text-red-800">Batch Failed</h3>
          <p className="mt-1 text-sm text-red-700">{batch.error}</p>
        </div>
      )}

      {/* Individual executions table */}
      {batch.executions && batch.executions.length > 0 && (
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="border-b border-gray-200 px-6 py-4">
            <h3 className="text-sm font-medium text-gray-900">Individual Executions</h3>
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Execution ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Trace</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Duration</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Cost Delta</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {batch.executions.map((exec: ReplayHistoryItem) => (
                <tr key={exec.execution_id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4 font-mono text-sm text-gray-900">
                    {exec.execution_id.slice(0, 12)}...
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 font-mono text-sm text-gray-500">
                    {exec.trace_id.slice(0, 12)}...
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <StatusBadge status={exec.status} />
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {exec.duration_ms != null ? `${exec.duration_ms.toFixed(0)}ms` : '—'}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {exec.cost_delta != null
                      ? `${exec.cost_delta > 0 ? '+' : ''}$${Math.abs(exec.cost_delta).toFixed(4)}`
                      : '—'}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right">
                    <button
                      onClick={() => navigate(`/replay/${exec.execution_id}`)}
                      className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
