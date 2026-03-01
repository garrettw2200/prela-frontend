import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useProject } from '../contexts/ProjectContext';
import {
  triggerEvalGeneration,
  getEvalGenerationStatus,
  downloadEvalSuite,
  listEvalGenerations,
  type EvalGenerationConfig,
  type EvalGenerationStatus,
  type EvalGenerationListItem,
} from '../api/evalGeneration';

export function EvalGeneratorPage() {
  return <EvalGeneratorContent />;
}

function EvalGeneratorContent() {
  const { currentProject } = useProject();
  const projectId = currentProject?.project_id || 'default';
  const queryClient = useQueryClient();

  // Form state
  const [suiteName, setSuiteName] = useState('');
  const [timeWindow, setTimeWindow] = useState(168);
  const [maxTraces, setMaxTraces] = useState(500);
  const [maxCases, setMaxCases] = useState(50);
  const [includeFailures, setIncludeFailures] = useState(true);
  const [includeEdgeCases, setIncludeEdgeCases] = useState(true);
  const [includePositive, setIncludePositive] = useState(true);
  const [agentFilter, setAgentFilter] = useState('');
  const [serviceFilter, setServiceFilter] = useState('');

  // Active generation tracking
  const [activeGenerationId, setActiveGenerationId] = useState<string | null>(null);

  // Poll active generation status
  const { data: generationStatus } = useQuery({
    queryKey: ['eval-generation-status', projectId, activeGenerationId],
    queryFn: () => getEvalGenerationStatus(projectId, activeGenerationId!),
    enabled: !!activeGenerationId,
    refetchInterval: (query) => {
      const data = query.state.data as EvalGenerationStatus | undefined;
      if (data?.status === 'running') return 3000;
      return false;
    },
  });

  // Clear active generation when completed/failed
  if (generationStatus && generationStatus.status !== 'running' && activeGenerationId) {
    // Invalidate history after completion
    queryClient.invalidateQueries({ queryKey: ['eval-generation-history', projectId] });
  }

  // Fetch generation history
  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ['eval-generation-history', projectId],
    queryFn: () => listEvalGenerations(projectId),
    staleTime: 30 * 1000,
  });

  // Trigger generation mutation
  const generateMutation = useMutation({
    mutationFn: (config: EvalGenerationConfig) => triggerEvalGeneration(projectId, config),
    onSuccess: (data) => {
      setActiveGenerationId(data.generation_id);
    },
  });

  const handleGenerate = () => {
    const config: EvalGenerationConfig = {
      suite_name: suiteName || undefined,
      time_window_hours: timeWindow,
      max_traces: maxTraces,
      max_cases: maxCases,
      include_failure_modes: includeFailures,
      include_edge_cases: includeEdgeCases,
      include_positive_examples: includePositive,
      agent_name_filter: agentFilter || undefined,
      service_name_filter: serviceFilter || undefined,
    };
    generateMutation.mutate(config);
  };

  const handleDownload = async (generationId: string, suiteName: string) => {
    try {
      const blob = await downloadEvalSuite(projectId, generationId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(suiteName || 'eval_suite').replace(/\s+/g, '_').toLowerCase()}.yaml`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      console.error('Failed to download eval suite');
    }
  };

  const timeWindowOptions = [
    { label: '24 hours', value: 24 },
    { label: '7 days', value: 168 },
    { label: '14 days', value: 336 },
    { label: '30 days', value: 720 },
  ];

  const isGenerating = activeGenerationId && generationStatus?.status === 'running';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Eval Generator</h1>
        <p className="mt-1 text-sm text-gray-500">
          Auto-generate eval test suites from production traces. Download as YAML compatible with <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">prela eval run</code>.
        </p>
      </div>

      {/* Configuration Form */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Configuration</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Suite Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Suite Name</label>
            <input
              type="text"
              value={suiteName}
              onChange={(e) => setSuiteName(e.target.value)}
              placeholder="Auto-generated if empty"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border px-3 py-2"
            />
          </div>

          {/* Time Window */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Time Window</label>
            <select
              value={timeWindow}
              onChange={(e) => setTimeWindow(Number(e.target.value))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border px-3 py-2"
            >
              {timeWindowOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Max Traces */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Max Traces to Analyze: {maxTraces}
            </label>
            <input
              type="range"
              min={50}
              max={2000}
              step={50}
              value={maxTraces}
              onChange={(e) => setMaxTraces(Number(e.target.value))}
              className="mt-1 block w-full"
            />
          </div>

          {/* Max Cases */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Max Eval Cases: {maxCases}
            </label>
            <input
              type="range"
              min={10}
              max={100}
              step={5}
              value={maxCases}
              onChange={(e) => setMaxCases(Number(e.target.value))}
              className="mt-1 block w-full"
            />
          </div>

          {/* Agent Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Agent Name Filter</label>
            <input
              type="text"
              value={agentFilter}
              onChange={(e) => setAgentFilter(e.target.value)}
              placeholder="All agents"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border px-3 py-2"
            />
          </div>

          {/* Service Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Service Name Filter</label>
            <input
              type="text"
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
              placeholder="All services"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border px-3 py-2"
            />
          </div>
        </div>

        {/* Pattern Toggles */}
        <div className="mt-4 flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={includeFailures}
              onChange={(e) => setIncludeFailures(e.target.checked)}
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-gray-700">Failure Modes</span>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={includeEdgeCases}
              onChange={(e) => setIncludeEdgeCases(e.target.checked)}
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-gray-700">Edge Cases</span>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={includePositive}
              onChange={(e) => setIncludePositive(e.target.checked)}
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-gray-700">Positive Examples</span>
          </label>
        </div>

        {/* Generate Button */}
        <div className="mt-6">
          <button
            onClick={handleGenerate}
            disabled={!!isGenerating || generateMutation.isPending}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generateMutation.isPending ? 'Starting...' : isGenerating ? 'Generating...' : 'Generate Eval Suite'}
          </button>
          {generateMutation.isError && (
            <p className="mt-2 text-sm text-red-600">
              Failed to start generation. Please try again.
            </p>
          )}
        </div>
      </div>

      {/* Active Generation Status */}
      {activeGenerationId && generationStatus && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Generation Progress</h2>

          {generationStatus.status === 'running' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600" />
                <span className="text-sm text-gray-600">Generating eval suite...</span>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="bg-gray-50 rounded p-3">
                  <div className="text-gray-500">Traces Analyzed</div>
                  <div className="text-lg font-semibold">{generationStatus.traces_analyzed}</div>
                </div>
                <div className="bg-gray-50 rounded p-3">
                  <div className="text-gray-500">Patterns Found</div>
                  <div className="text-lg font-semibold">{generationStatus.patterns_found}</div>
                </div>
                <div className="bg-gray-50 rounded p-3">
                  <div className="text-gray-500">Cases Generated</div>
                  <div className="text-lg font-semibold">{generationStatus.cases_generated}</div>
                </div>
              </div>
            </div>
          )}

          {generationStatus.status === 'completed' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-green-600">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">Generation complete!</span>
              </div>
              <div className="text-sm text-gray-600">
                Generated {generationStatus.cases_generated} eval cases from {generationStatus.traces_analyzed} traces ({generationStatus.patterns_found} patterns detected).
              </div>

              {/* Pattern Summary */}
              {generationStatus.pattern_summary.length > 0 && (
                <div className="mt-2">
                  <div className="text-sm font-medium text-gray-700 mb-1">Patterns:</div>
                  <div className="flex flex-wrap gap-2">
                    {generationStatus.pattern_summary.map((p, i) => (
                      <span
                        key={i}
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          p.category === 'failure_mode'
                            ? 'bg-red-100 text-red-800'
                            : p.category === 'edge_case'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {p.subcategory} ({p.count})
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={() => handleDownload(activeGenerationId, generationStatus.suite_name)}
                className="mt-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Download YAML
              </button>
            </div>
          )}

          {generationStatus.status === 'failed' && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-red-600">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">Generation failed</span>
              </div>
              {generationStatus.error && (
                <p className="text-sm text-red-600">{generationStatus.error}</p>
              )}
              <button
                onClick={() => setActiveGenerationId(null)}
                className="text-sm text-indigo-600 hover:text-indigo-500"
              >
                Dismiss
              </button>
            </div>
          )}
        </div>
      )}

      {/* Generation History */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Generation History</h2>

        {historyLoading && (
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-gray-100 rounded" />
            ))}
          </div>
        )}

        {!historyLoading && (!historyData || historyData.generations.length === 0) && (
          <p className="text-sm text-gray-500">No eval suites generated yet. Configure the options above and click "Generate Eval Suite" to get started.</p>
        )}

        {!historyLoading && historyData && historyData.generations.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Suite Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cases</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Traces</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {historyData.generations.map((gen: EvalGenerationListItem) => (
                  <tr key={gen.generation_id}>
                    <td className="px-4 py-3 text-sm text-gray-900">{gen.suite_name || 'Unnamed'}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          gen.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : gen.status === 'failed'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {gen.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{gen.cases_generated}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{gen.traces_analyzed}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(gen.started_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      {gen.status === 'completed' && (
                        <button
                          onClick={() => handleDownload(gen.generation_id, gen.suite_name)}
                          className="text-sm text-indigo-600 hover:text-indigo-500 font-medium"
                        >
                          Download
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
