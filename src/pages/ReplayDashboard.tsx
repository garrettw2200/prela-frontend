import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { useProject } from '../contexts/ProjectContext';
import { useAuth } from '../contexts/AuthContext';
import {
  fetchReplayTraces,
  fetchReplayHistory,
  fetchBatchList,
  executeReplay,
  executeBatchReplay,
  ReplayCapableTrace,
  ReplayHistoryItem,
  ReplayParameters,
  BatchListItem,
} from '../api/replay';

type Tab = 'traces' | 'history' | 'batches';

const MAX_BATCH_SIZE = 50;

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

function ReplayConfigModal({
  trace,
  onClose,
  onSubmit,
  isSubmitting,
}: {
  trace: ReplayCapableTrace;
  onClose: () => void;
  onSubmit: (params: ReplayParameters) => void;
  isSubmitting: boolean;
}) {
  const [model, setModel] = useState('');
  const [temperature, setTemperature] = useState(1.0);
  const [systemPrompt, setSystemPrompt] = useState('');
  const [maxTokens, setMaxTokens] = useState<number | ''>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params: ReplayParameters = {};
    if (model) params.model = model;
    if (temperature !== 1.0) params.temperature = temperature;
    if (systemPrompt) params.system_prompt = systemPrompt;
    if (maxTokens !== '') params.max_tokens = maxTokens;
    onSubmit(params);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Configure Replay</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            &times;
          </button>
        </div>

        <p className="mb-4 text-sm text-gray-500">
          Trace: <span className="font-mono">{trace.trace_id.slice(0, 12)}...</span>
          {' '}&middot; {trace.span_count} spans &middot; {trace.llm_span_count} LLM spans
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Model override</label>
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="e.g. gpt-4o, claude-sonnet-4-5-20250929 (leave blank for original)"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Temperature: {temperature.toFixed(1)}
            </label>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="mt-1 w-full"
            />
            <div className="flex justify-between text-xs text-gray-400">
              <span>0.0</span>
              <span>1.0</span>
              <span>2.0</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">System prompt override</label>
            <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="Leave blank to use original"
              rows={3}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Max tokens</label>
            <input
              type="number"
              value={maxTokens}
              onChange={(e) => setMaxTokens(e.target.value ? parseInt(e.target.value) : '')}
              placeholder="Leave blank for original"
              min={1}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Starting...' : 'Run Replay'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function BatchReplayConfigModal({
  traceCount,
  onClose,
  onSubmit,
  isSubmitting,
}: {
  traceCount: number;
  onClose: () => void;
  onSubmit: (params: ReplayParameters) => void;
  isSubmitting: boolean;
}) {
  const [model, setModel] = useState('');
  const [temperature, setTemperature] = useState(1.0);
  const [systemPrompt, setSystemPrompt] = useState('');
  const [maxTokens, setMaxTokens] = useState<number | ''>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params: ReplayParameters = {};
    if (model) params.model = model;
    if (temperature !== 1.0) params.temperature = temperature;
    if (systemPrompt) params.system_prompt = systemPrompt;
    if (maxTokens !== '') params.max_tokens = maxTokens;
    onSubmit(params);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Configure Batch Replay</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            &times;
          </button>
        </div>

        <p className="mb-4 text-sm text-gray-500">
          {traceCount} trace{traceCount !== 1 ? 's' : ''} selected &middot; Parameters apply to all traces
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Model override</label>
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="e.g. gpt-4o, claude-sonnet-4-5-20250929 (leave blank for original)"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Temperature: {temperature.toFixed(1)}
            </label>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="mt-1 w-full"
            />
            <div className="flex justify-between text-xs text-gray-400">
              <span>0.0</span>
              <span>1.0</span>
              <span>2.0</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">System prompt override</label>
            <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="Leave blank to use original"
              rows={3}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Max tokens</label>
            <input
              type="number"
              value={maxTokens}
              onChange={(e) => setMaxTokens(e.target.value ? parseInt(e.target.value) : '')}
              placeholder="Leave blank for original"
              min={1}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Starting...' : `Run Batch Replay (${traceCount} traces)`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function TracesTab({ projectId }: { projectId: string }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [selectedTrace, setSelectedTrace] = useState<ReplayCapableTrace | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTraces, setSelectedTraces] = useState<Set<string>>(new Set());
  const [showBatchConfig, setShowBatchConfig] = useState(false);
  const [isBatchSubmitting, setIsBatchSubmitting] = useState(false);

  const isPro = user?.tier === 'pro' || user?.tier === 'enterprise';

  const { data, isLoading, error } = useQuery({
    queryKey: ['replay-traces', projectId, page],
    queryFn: () => fetchReplayTraces(projectId, page),
    staleTime: 60 * 1000,
  });

  const toggleTrace = (traceId: string) => {
    setSelectedTraces((prev) => {
      const next = new Set(prev);
      if (next.has(traceId)) {
        next.delete(traceId);
      } else if (next.size < MAX_BATCH_SIZE) {
        next.add(traceId);
      }
      return next;
    });
  };

  const toggleAllOnPage = () => {
    if (!data) return;
    const pageTraceIds = data.traces.map((t) => t.trace_id);
    const allSelected = pageTraceIds.every((id) => selectedTraces.has(id));
    setSelectedTraces((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        pageTraceIds.forEach((id) => next.delete(id));
      } else {
        pageTraceIds.forEach((id) => {
          if (next.size < MAX_BATCH_SIZE) next.add(id);
        });
      }
      return next;
    });
  };

  const handleReplay = async (params: ReplayParameters) => {
    if (!selectedTrace) return;
    setIsSubmitting(true);
    try {
      const result = await executeReplay({
        trace_id: selectedTrace.trace_id,
        parameters: params,
      });
      setSelectedTrace(null);
      navigate(`/replay/${result.execution_id}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to start replay');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBatchReplay = async (params: ReplayParameters) => {
    setIsBatchSubmitting(true);
    try {
      const result = await executeBatchReplay(
        { trace_ids: Array.from(selectedTraces), parameters: params },
        projectId
      );
      setShowBatchConfig(false);
      setSelectedTraces(new Set());
      navigate(`/replay/batch/${result.batch_id}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to start batch replay');
    } finally {
      setIsBatchSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-12 animate-pulse rounded bg-gray-200" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-4">
        <p className="text-sm text-red-800">
          Failed to load traces: {error instanceof Error ? error.message : 'Unknown error'}
        </p>
      </div>
    );
  }

  if (!data || data.traces.length === 0) {
    return (
      <div className="rounded-lg bg-white p-12 text-center shadow">
        <h3 className="text-lg font-medium text-gray-900">No replay-capable traces</h3>
        <p className="mt-2 text-sm text-gray-500">
          Traces with LLM spans and replay snapshots will appear here.
        </p>
      </div>
    );
  }

  const pageTraceIds = data.traces.map((t) => t.trace_id);
  const allOnPageSelected = pageTraceIds.length > 0 && pageTraceIds.every((id) => selectedTraces.has(id));

  return (
    <>
      <div className="overflow-hidden rounded-lg bg-white shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="w-10 px-4 py-3">
                <input
                  type="checkbox"
                  checked={allOnPageSelected}
                  onChange={toggleAllOnPage}
                  disabled={!isPro}
                  title={isPro ? 'Select all on page' : 'Batch replay requires Pro tier'}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Trace ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Service</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Duration</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Spans</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">LLM Spans</th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {data.traces.map((trace: ReplayCapableTrace) => (
              <tr key={trace.trace_id} className={`hover:bg-gray-50 ${selectedTraces.has(trace.trace_id) ? 'bg-indigo-50' : ''}`}>
                <td className="w-10 px-4 py-4">
                  <input
                    type="checkbox"
                    checked={selectedTraces.has(trace.trace_id)}
                    onChange={() => toggleTrace(trace.trace_id)}
                    disabled={!isPro || (!selectedTraces.has(trace.trace_id) && selectedTraces.size >= MAX_BATCH_SIZE)}
                    title={
                      !isPro
                        ? 'Batch replay requires Pro tier'
                        : selectedTraces.size >= MAX_BATCH_SIZE && !selectedTraces.has(trace.trace_id)
                          ? `Maximum ${MAX_BATCH_SIZE} traces per batch`
                          : ''
                    }
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </td>
                <td className="whitespace-nowrap px-6 py-4 font-mono text-sm text-gray-900">
                  {trace.trace_id.slice(0, 12)}...
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {trace.service_name}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {trace.duration_ms.toFixed(0)}ms
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {trace.span_count}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {trace.llm_span_count}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-right">
                  <button
                    onClick={() => setSelectedTrace(trace)}
                    className="rounded bg-indigo-600 px-3 py-1 text-sm font-medium text-white hover:bg-indigo-700"
                  >
                    Replay
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data.total > data.page_size && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Page {data.page} of {Math.ceil(data.total / data.page_size)} ({data.total} traces)
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded border border-gray-300 px-3 py-1 text-sm disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= Math.ceil(data.total / data.page_size)}
              className="rounded border border-gray-300 px-3 py-1 text-sm disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Floating action bar for batch selection */}
      {selectedTraces.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white px-6 py-3 shadow-lg">
          <div className="mx-auto flex max-w-7xl items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              {selectedTraces.size} trace{selectedTraces.size !== 1 ? 's' : ''} selected
              {selectedTraces.size >= MAX_BATCH_SIZE && (
                <span className="ml-2 text-yellow-600">(max {MAX_BATCH_SIZE})</span>
              )}
            </span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedTraces(new Set())}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Clear selection
              </button>
              <button
                onClick={() => setShowBatchConfig(true)}
                className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              >
                Batch Replay ({selectedTraces.size})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Single replay config modal */}
      {selectedTrace && (
        <ReplayConfigModal
          trace={selectedTrace}
          onClose={() => setSelectedTrace(null)}
          onSubmit={handleReplay}
          isSubmitting={isSubmitting}
        />
      )}

      {/* Batch replay config modal */}
      {showBatchConfig && (
        <BatchReplayConfigModal
          traceCount={selectedTraces.size}
          onClose={() => setShowBatchConfig(false)}
          onSubmit={handleBatchReplay}
          isSubmitting={isBatchSubmitting}
        />
      )}
    </>
  );
}

function HistoryTab({ projectId }: { projectId: string }) {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useQuery({
    queryKey: ['replay-history', projectId, page],
    queryFn: () => fetchReplayHistory(projectId, page),
    staleTime: 30 * 1000,
    refetchInterval: (query) => {
      const executions = query.state.data?.executions;
      if (executions?.some((e: ReplayHistoryItem) => e.status === 'running')) {
        return 5000;
      }
      return false;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-12 animate-pulse rounded bg-gray-200" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-4">
        <p className="text-sm text-red-800">
          Failed to load history: {error instanceof Error ? error.message : 'Unknown error'}
        </p>
      </div>
    );
  }

  if (!data || data.executions.length === 0) {
    return (
      <div className="rounded-lg bg-white p-12 text-center shadow">
        <h3 className="text-lg font-medium text-gray-900">No replay history</h3>
        <p className="mt-2 text-sm text-gray-500">
          Run a replay from the Traces tab to see results here.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-lg bg-white shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Execution ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Trace</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Started</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Duration Delta</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Cost Delta</th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {data.executions.map((exec: ReplayHistoryItem) => (
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
                  {new Date(exec.triggered_at).toLocaleString()}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {exec.duration_ms != null ? `${exec.duration_ms > 0 ? '+' : ''}${exec.duration_ms.toFixed(0)}ms` : '—'}
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

      {data.total > data.page_size && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Page {data.page} of {Math.ceil(data.total / data.page_size)} ({data.total} executions)
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded border border-gray-300 px-3 py-1 text-sm disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= Math.ceil(data.total / data.page_size)}
              className="rounded border border-gray-300 px-3 py-1 text-sm disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function BatchesTab({ projectId }: { projectId: string }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [page, setPage] = useState(1);

  const isPro = user?.tier === 'pro' || user?.tier === 'enterprise';

  const { data, isLoading, error } = useQuery({
    queryKey: ['replay-batches', projectId, page],
    queryFn: () => fetchBatchList(projectId, page),
    staleTime: 30 * 1000,
    enabled: isPro,
    refetchInterval: (query) => {
      const batches = query.state.data?.batches;
      if (batches?.some((b: BatchListItem) => b.status === 'running' || b.status === 'pending')) {
        return 5000;
      }
      return false;
    },
  });

  if (!isPro) {
    return (
      <div className="rounded-lg bg-white p-12 text-center shadow">
        <h3 className="text-lg font-medium text-gray-900">Batch Replay</h3>
        <p className="mt-2 text-sm text-gray-500">
          Batch replay is available on the Pro plan. Upgrade to replay up to 50 traces at once.
        </p>
        <a
          href="/billing"
          className="mt-4 inline-block rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Upgrade to Pro
        </a>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-12 animate-pulse rounded bg-gray-200" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-4">
        <p className="text-sm text-red-800">
          Failed to load batches: {error instanceof Error ? error.message : 'Unknown error'}
        </p>
      </div>
    );
  }

  if (!data || data.batches.length === 0) {
    return (
      <div className="rounded-lg bg-white p-12 text-center shadow">
        <h3 className="text-lg font-medium text-gray-900">No batch replays</h3>
        <p className="mt-2 text-sm text-gray-500">
          Select multiple traces from the Traces tab and run a batch replay to see results here.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-lg bg-white shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Batch ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Progress</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Created</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Completed</th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {data.batches.map((batch: BatchListItem) => {
              const progress = batch.completed_traces + batch.failed_traces;
              const progressPct = batch.total_traces > 0 ? (progress / batch.total_traces) * 100 : 0;
              return (
                <tr key={batch.batch_id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4 font-mono text-sm text-gray-900">
                    {batch.batch_id.slice(0, 12)}...
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <StatusBadge status={batch.status} />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-24 overflow-hidden rounded-full bg-gray-200">
                        <div
                          className={`h-full rounded-full transition-all ${
                            batch.failed_traces > 0 ? 'bg-orange-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500">
                        {batch.completed_traces}/{batch.total_traces}
                        {batch.failed_traces > 0 && (
                          <span className="text-red-500"> ({batch.failed_traces} failed)</span>
                        )}
                      </span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {new Date(batch.created_at).toLocaleString()}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {batch.completed_at ? new Date(batch.completed_at).toLocaleString() : '—'}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right">
                    <button
                      onClick={() => navigate(`/replay/batch/${batch.batch_id}`)}
                      className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
                    >
                      View
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {data.total > data.page_size && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Page {data.page} of {Math.ceil(data.total / data.page_size)} ({data.total} batches)
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded border border-gray-300 px-3 py-1 text-sm disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= Math.ceil(data.total / data.page_size)}
              className="rounded border border-gray-300 px-3 py-1 text-sm disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export function ReplayDashboard() {
  const { projectId: routeProjectId } = useParams<{ projectId: string }>();
  const { currentProject } = useProject();
  const projectId = routeProjectId ?? currentProject?.project_id ?? 'default';
  const [activeTab, setActiveTab] = useState<Tab>('traces');

  const tabs: { key: Tab; label: string }[] = [
    { key: 'traces', label: 'Traces' },
    { key: 'history', label: 'History' },
    { key: 'batches', label: 'Batches' },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Trace Replay</h1>
        <p className="mt-1 text-sm text-gray-500">
          Re-execute LLM traces with modified parameters to compare behavior and costs
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`whitespace-nowrap border-b-2 px-1 pb-4 text-sm font-medium ${
                activeTab === tab.key
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      {activeTab === 'traces' && <TracesTab projectId={projectId} />}
      {activeTab === 'history' && <HistoryTab projectId={projectId} />}
      {activeTab === 'batches' && <BatchesTab projectId={projectId} />}
    </div>
  );
}
