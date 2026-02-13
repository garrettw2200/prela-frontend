import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import {
  fetchExecutionDetail,
  fetchAgentGraph,
  fetchExecutionTasks,
  getFrameworkName,
  formatDuration,
} from '../api/multi-agent';
import { fetchTraceErrorAnalysis } from '../api/errors';
import AgentGraph from '../components/multi-agent/AgentGraph';
import TaskTimeline from '../components/multi-agent/TaskTimeline';
import { ActionableErrorMessage, HallucinationDetection } from '../components/errors';
import DebugPanel from '../components/debug/DebugPanel';

interface ExecutionDetailProps {
  executionId: string;
  onClose: () => void;
}

export default function ExecutionDetail({ executionId, onClose }: ExecutionDetailProps) {
  const { user } = useAuth();
  const projectId = user?.projectId || 'default';

  // Fetch execution details
  const { data: execution, isLoading: detailLoading } = useQuery({
    queryKey: ['execution-detail', projectId, executionId],
    queryFn: () => fetchExecutionDetail(projectId, executionId),
  });

  // Fetch agent graph
  const { data: graph, isLoading: graphLoading } = useQuery({
    queryKey: ['agent-graph', projectId, executionId],
    queryFn: () => fetchAgentGraph(projectId, executionId),
  });

  // Fetch tasks (CrewAI/AutoGen only)
  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['execution-tasks', projectId, executionId],
    queryFn: () => fetchExecutionTasks(projectId, executionId),
    enabled: execution?.framework === 'crewai' || execution?.framework === 'autogen',
  });

  // Fetch error analysis (only if status is error)
  const { data: errorAnalysis } = useQuery({
    queryKey: ['error-analysis', projectId, executionId],
    queryFn: () => fetchTraceErrorAnalysis(projectId, executionId),
    enabled: !!projectId && !!executionId && execution?.status === 'error',
  });

  if (detailLoading) {
    return (
      <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Loading execution details...</p>
        </div>
      </div>
    );
  }

  if (!execution) {
    return (
      <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <p className="text-red-600">Execution not found</p>
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full mx-4 my-8 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Execution Details</h2>
            <p className="mt-1 text-sm text-gray-500">
              {getFrameworkName(execution.framework)} • {execution.execution_id}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 focus:outline-none"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* Summary Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <dt className="text-sm font-medium text-gray-500">Status</dt>
              <dd className="mt-1">
                <span
                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    execution.status === 'success'
                      ? 'bg-green-100 text-green-800'
                      : execution.status === 'error'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {execution.status.charAt(0).toUpperCase() + execution.status.slice(1)}
                </span>
              </dd>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <dt className="text-sm font-medium text-gray-500">Duration</dt>
              <dd className="mt-1 text-lg font-semibold text-gray-900">
                {formatDuration(execution.duration_ms)}
              </dd>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <dt className="text-sm font-medium text-gray-500">Started At</dt>
              <dd className="mt-1 text-lg font-semibold text-gray-900">
                {new Date(execution.started_at).toLocaleString()}
              </dd>
            </div>
          </div>

          {/* Error Analysis Section (if status === 'error') */}
          {execution.status === 'error' && errorAnalysis && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Error Analysis</h3>
              <div className="space-y-4">
                {errorAnalysis.errors.map((error) => (
                  <ActionableErrorMessage
                    key={error.span_id}
                    spanId={error.span_id}
                    spanName={error.span_name}
                    traceId={errorAnalysis.trace_id}
                    analysis={error.analysis}
                    onReplayTriggered={(executionId) => {
                      console.log('Replay started:', executionId);
                      // TODO: Add toast notification when Toast component is available
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Agents Section */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Agents Involved</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex flex-wrap gap-2">
                {execution.agents_used.map((agent, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800"
                  >
                    {agent}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Handoffs Section */}
          {execution.handoffs && execution.handoffs.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Agent Handoffs</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="space-y-2">
                  {execution.handoffs.map((handoff, idx) => (
                    <div key={idx} className="flex items-center text-sm">
                      <span className="font-medium text-gray-900">{handoff.from_agent}</span>
                      <svg
                        className="mx-2 h-4 w-4 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 7l5 5m0 0l-5 5m5-5H6"
                        />
                      </svg>
                      <span className="font-medium text-gray-900">{handoff.to_agent}</span>
                      {handoff.reason && (
                        <span className="ml-2 text-gray-500">({handoff.reason})</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Agent Graph Section */}
          {graph && !graphLoading && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Agent Communication Graph</h3>
              <div className="bg-gray-50 p-4 rounded-lg" style={{ height: '400px' }}>
                <AgentGraph graph={graph} />
              </div>
            </div>
          )}

          {/* Tasks Section (CrewAI/AutoGen) */}
          {!tasksLoading && tasks.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Tasks</h3>
              <TaskTimeline tasks={tasks} />
            </div>
          )}

          {/* Hallucination Detection Section */}
          <div className="mb-6">
            <HallucinationDetection
              projectId={projectId}
              traceId={execution.trace_id}
              similarityThreshold={0.7}
            />
          </div>

          {/* Debug Analysis Section */}
          <div className="mb-6">
            <DebugPanel
              projectId={projectId}
              traceId={execution.trace_id}
            />
          </div>

          {/* Context Variables Section */}
          {execution.context_variables && execution.context_variables.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Context Variables</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex flex-wrap gap-2">
                  {execution.context_variables.map((variable, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center px-2 py-1 rounded text-xs font-mono bg-gray-200 text-gray-700"
                    >
                      {variable}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
