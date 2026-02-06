import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  Position,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { fetchN8nWorkflowDetail, fetchExecutionTimeline } from '@/api/n8n';
import { formatDuration, formatTokens, formatCurrency } from '@/lib/utils';
import { ExecutionTimeline } from './ExecutionTimeline';

// Unused for now - will be needed in Phase 3
// interface AINodeData {
//   node_id: string;
//   node_name: string;
//   model: string;
//   vendor: string;
//   call_count_24h: number;
//   avg_tokens: number;
//   cost_24h: number;
//   avg_latency_ms: number;
// }

/**
 * Detailed view for a single n8n workflow
 *
 * Features:
 * - Interactive workflow graph visualization
 * - 24-hour metrics summary
 * - AI node breakdown with costs
 * - Recent execution history
 * - Execution detail drill-down
 */
export function WorkflowDetail() {
  const { workflowId } = useParams<{ workflowId: string }>();
  const [selectedExecution, setSelectedExecution] = useState<string | null>(null);

  const {
    data: workflowData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['n8n-workflow-detail', workflowId],
    queryFn: () => fetchN8nWorkflowDetail('default', workflowId!),
    enabled: !!workflowId,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Convert workflow data to ReactFlow graph
  const { nodes, edges } = useMemo(() => {
    if (!workflowData?.ai_nodes) return { nodes: [], edges: [] };
    return convertToFlowGraph(workflowData.ai_nodes);
  }, [workflowData?.ai_nodes]);

  if (isLoading) {
    return <LoadingState />;
  }

  if (error || !workflowData) {
    return (
      <div className="p-8">
        <div className="rounded-lg bg-red-50 p-4">
          <p className="text-sm text-red-800">Failed to load workflow details.</p>
        </div>
      </div>
    );
  }

  const workflow = workflowData;
  const { executions, ai_nodes } = workflowData;

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <div className="border-b bg-white p-4">
        <div className="mx-auto max-w-7xl">
          <div className="mb-2">
            <Link
              to="/n8n"
              className="text-sm text-indigo-600 hover:text-indigo-900"
            >
              ← Back to Workflows
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            {workflow.workflow_name}
          </h1>
          <div className="mt-2 flex gap-4 text-sm text-gray-500">
            <span>ID: {workflowId}</span>
            <span>•</span>
            <span>{ai_nodes.length} AI nodes</span>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Workflow Graph */}
        <div className="relative flex-1">
          <div className="absolute inset-0">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              fitView
              nodeTypes={customNodeTypes}
              defaultEdgeOptions={{
                animated: true,
                style: { stroke: '#6366f1', strokeWidth: 2 },
              }}
            >
              <Background color="#e5e7eb" gap={16} />
              <Controls />
              <MiniMap
                nodeColor={(node) => {
                  if (node.type === 'aiNode') return '#a855f7';
                  return '#6b7280';
                }}
              />
            </ReactFlow>
          </div>
        </div>

        {/* Right Panel - Metrics and Executions */}
        <div className="w-96 overflow-y-auto border-l bg-gray-50">
          {/* Metrics Summary */}
          <div className="border-b bg-white p-4">
            <h3 className="mb-3 font-semibold text-gray-900">Last 24 Hours</h3>
            <div className="grid grid-cols-2 gap-3">
              <MetricCard
                label="Executions"
                value={workflow.execution_count_24h.toLocaleString()}
              />
              <MetricCard
                label="Success Rate"
                value={`${workflow.success_rate_24h.toFixed(1)}%`}
                color={
                  workflow.success_rate_24h >= 95
                    ? 'green'
                    : workflow.success_rate_24h >= 80
                      ? 'yellow'
                      : 'red'
                }
              />
              <MetricCard
                label="Avg Duration"
                value={formatDuration(workflow.avg_duration_ms)}
              />
              <MetricCard
                label="Total Cost"
                value={formatCurrency(workflow.total_cost_24h)}
              />
              <MetricCard
                label="AI Calls"
                value={workflow.total_ai_calls_24h.toLocaleString()}
              />
              <MetricCard
                label="Tokens"
                value={formatTokens(workflow.total_tokens_24h)}
              />
            </div>
          </div>

          {/* AI Node Breakdown */}
          <div className="border-b bg-white p-4">
            <h3 className="mb-3 font-semibold text-gray-900">AI Nodes</h3>
            {ai_nodes.length === 0 ? (
              <p className="text-sm text-gray-500">No AI nodes in this workflow</p>
            ) : (
              <div className="space-y-2">
                {ai_nodes.map((node) => (
                  <AINodeCard key={`${node.node_name}-${node.model}`} node={node} />
                ))}
              </div>
            )}
          </div>

          {/* Recent Executions */}
          <div className="p-4">
            <h3 className="mb-3 font-semibold text-gray-900">Recent Executions</h3>
            {executions.length === 0 ? (
              <p className="text-sm text-gray-500">No recent executions</p>
            ) : (
              <div className="space-y-2">
                {executions.slice(0, 20).map((exec) => (
                  <button
                    key={exec.execution_id}
                    onClick={() => setSelectedExecution(exec.execution_id)}
                    className={`w-full rounded p-3 text-left text-sm transition-colors ${
                      selectedExecution === exec.execution_id
                        ? 'border border-indigo-300 bg-indigo-50'
                        : 'border border-gray-200 bg-white hover:bg-gray-50'
                    }`}
                  >
                    <div className="mb-1 flex items-center justify-between">
                      <span
                        className={`font-medium ${
                          exec.status === 'error'
                            ? 'text-red-600'
                            : exec.status === 'running'
                            ? 'text-yellow-600'
                            : 'text-green-600'
                        }`}
                      >
                        {exec.status === 'error'
                          ? '✗ Failed'
                          : exec.status === 'running'
                          ? '○ Running'
                          : '✓ Success'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(exec.started_at), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>{formatDuration(exec.duration_ms)}</span>
                      <span>{formatTokens(exec.total_tokens)} tokens</span>
                    </div>
                    {exec.cost_usd > 0 && (
                      <div className="mt-1 text-xs text-gray-500">
                        Cost: {formatCurrency(exec.cost_usd)}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Execution Detail Modal */}
      {selectedExecution && (
        <ExecutionDetailModal
          executionId={selectedExecution}
          workflowName={workflow.workflow_name}
          onClose={() => setSelectedExecution(null)}
        />
      )}
    </div>
  );
}

// Metric Card Component
interface MetricCardProps {
  label: string;
  value: string;
  color?: 'green' | 'yellow' | 'red';
}

function MetricCard({ label, value, color }: MetricCardProps) {
  const colorClasses = {
    green: 'bg-green-50 text-green-700 border-green-200',
    yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    red: 'bg-red-50 text-red-700 border-red-200',
  };

  return (
    <div
      className={`rounded-lg border p-3 ${
        color ? colorClasses[color] : 'border-gray-200 bg-gray-50'
      }`}
    >
      <div className="text-xs text-gray-600">{label}</div>
      <div className="mt-1 text-lg font-semibold">{value}</div>
    </div>
  );
}

// AI Node Card Component
interface AINodeCardProps {
  node: {
    node_name: string;
    model: string;
    vendor: string;
    call_count: number;
    prompt_tokens: number;
    completion_tokens: number;
    avg_latency_ms: number;
  };
}

function AINodeCard({ node }: AINodeCardProps) {
  const totalTokens = node.prompt_tokens + node.completion_tokens;
  const avgTokensPerCall = node.call_count > 0 ? totalTokens / node.call_count : 0;
  const estimatedCost = estimateCost(node.vendor, node.model, totalTokens);

  return (
    <div className="rounded-lg border border-purple-200 bg-purple-50 p-3">
      <div className="mb-1 flex items-start justify-between">
        <div className="font-medium text-sm text-gray-900">{node.node_name}</div>
        <span className="rounded bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
          {node.vendor}
        </span>
      </div>
      <div className="text-xs text-gray-600">{node.model}</div>
      <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
        <div>
          <div className="text-gray-500">Calls</div>
          <div className="font-medium">{node.call_count.toLocaleString()}</div>
        </div>
        <div>
          <div className="text-gray-500">Avg Tokens</div>
          <div className="font-medium">{formatTokens(Math.round(avgTokensPerCall))}</div>
        </div>
        <div>
          <div className="text-gray-500">Latency</div>
          <div className="font-medium">{Math.round(node.avg_latency_ms)}ms</div>
        </div>
        <div>
          <div className="text-gray-500">Est. Cost</div>
          <div className="font-medium">{formatCurrency(estimatedCost)}</div>
        </div>
      </div>
    </div>
  );
}

// Execution Detail Modal
interface ExecutionDetailModalProps {
  executionId: string;
  workflowName: string;
  onClose: () => void;
}

function ExecutionDetailModal({
  executionId,
  workflowName,
  onClose,
}: ExecutionDetailModalProps) {
  // Fetch execution timeline data
  const {
    data: timelineData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['execution-timeline', executionId],
    queryFn: () => fetchExecutionTimeline('default', executionId),
    enabled: !!executionId,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-white shadow-xl">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between border-b bg-white p-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Execution Details</h2>
            <p className="text-sm text-gray-500">{workflowName}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-gray-100"
            aria-label="Close"
          >
            <svg
              className="h-5 w-5 text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
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
        <div className="p-4">
          {/* Execution ID */}
          <div className="mb-4 rounded-lg bg-gray-50 p-3">
            <div className="text-xs text-gray-500">Execution ID</div>
            <div className="font-mono text-sm">{executionId}</div>
          </div>

          {/* Timeline */}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent"></div>
              <span className="ml-2 text-sm text-gray-500">Loading timeline...</span>
            </div>
          ) : error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="text-sm text-red-800">Failed to load execution timeline</p>
            </div>
          ) : timelineData ? (
            <>
              <ExecutionTimeline
                nodes={timelineData.nodes}
                totalDuration={timelineData.total_duration_ms}
              />

              {/* Additional execution details placeholder */}
              <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
                <h3 className="mb-2 text-sm font-medium text-gray-900">
                  Additional Details
                </h3>
                <p className="text-sm text-gray-600">
                  Future enhancements will include:
                </p>
                <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-gray-600">
                  <li>Input/output data for each node</li>
                  <li>LLM prompts and responses</li>
                  <li>Error messages and stack traces</li>
                  <li>Token usage breakdown per node</li>
                </ul>
              </div>
            </>
          ) : null}

          {/* Close button */}
          <div className="mt-6">
            <button
              onClick={onClose}
              className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Loading State
function LoadingState() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
        <p className="text-sm text-gray-500">Loading workflow details...</p>
      </div>
    </div>
  );
}

// Convert AI nodes to ReactFlow graph
function convertToFlowGraph(
  aiNodes: Array<{
    node_name: string;
    model: string;
    vendor: string;
    call_count: number;
  }>
): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  // Create a start node
  nodes.push({
    id: 'start',
    type: 'input',
    data: { label: 'Start' },
    position: { x: 250, y: 0 },
    sourcePosition: Position.Bottom,
  });

  // Create nodes for each AI node
  aiNodes.forEach((aiNode, index) => {
    const nodeId = `ai-${index}`;
    nodes.push({
      id: nodeId,
      type: 'aiNode',
      data: {
        label: aiNode.node_name,
        model: aiNode.model,
        vendor: aiNode.vendor,
        calls: aiNode.call_count,
      },
      position: { x: 150 + (index % 2) * 200, y: 100 + Math.floor(index / 2) * 120 },
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top,
    });

    // Connect from start or previous node
    if (index === 0) {
      edges.push({
        id: `e-start-${nodeId}`,
        source: 'start',
        target: nodeId,
      });
    } else {
      edges.push({
        id: `e-ai-${index - 1}-${nodeId}`,
        source: `ai-${index - 1}`,
        target: nodeId,
      });
    }
  });

  // Create an end node
  if (aiNodes.length > 0) {
    nodes.push({
      id: 'end',
      type: 'output',
      data: { label: 'End' },
      position: { x: 250, y: 100 + Math.floor((aiNodes.length - 1) / 2) * 120 + 120 },
      targetPosition: Position.Top,
    });

    edges.push({
      id: `e-ai-${aiNodes.length - 1}-end`,
      source: `ai-${aiNodes.length - 1}`,
      target: 'end',
    });
  }

  return { nodes, edges };
}

// Custom AI Node Component
function AINodeComponent({ data }: { data: any }) {
  return (
    <div className="rounded-lg border-2 border-purple-500 bg-purple-50 px-4 py-3 shadow-md">
      <div className="flex items-center">
        <div className="mr-2">
          <svg
            className="h-5 w-5 text-purple-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
        </div>
        <div className="flex-1">
          <div className="text-sm font-bold text-gray-900">{data.label}</div>
          <div className="text-xs text-gray-600">{data.model}</div>
          <div className="text-xs text-purple-600">{data.calls} calls</div>
        </div>
      </div>
    </div>
  );
}

const customNodeTypes = {
  aiNode: AINodeComponent,
};

// Simple cost estimation (replace with actual pricing)
function estimateCost(vendor: string, model: string, totalTokens: number): number {
  // Simplified cost estimation - replace with actual pricing API
  const costPer1kTokens: Record<string, number> = {
    'openai-gpt-4': 0.03,
    'openai-gpt-3.5-turbo': 0.002,
    'anthropic-claude-3': 0.015,
    'anthropic-claude-2': 0.008,
  };

  const key = `${vendor}-${model.split('-')[0]}`;
  const rate = costPer1kTokens[key] || 0.01;

  return (totalTokens / 1000) * rate;
}
