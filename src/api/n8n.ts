import apiClient from './client';

export interface N8nWorkflow {
  workflow_id: string;
  workflow_name: string;
  last_execution: string;
  execution_count_24h: number;
  success_rate_24h: number;
  avg_duration_ms: number;
  total_ai_calls_24h: number;
  total_tokens_24h: number;
  total_cost_24h: number;
}

export interface N8nWorkflowDetail extends N8nWorkflow {
  executions: N8nExecution[];
  ai_nodes: N8nAINode[];
}

export interface N8nExecution {
  execution_id: string;
  started_at: string;
  ended_at: string;
  status: 'success' | 'error' | 'running';
  duration_ms: number;
  total_tokens: number;
  cost_usd: number;
}

export interface N8nAINode {
  node_name: string;
  model: string;
  vendor: string;
  call_count: number;
  prompt_tokens: number;
  completion_tokens: number;
  avg_latency_ms: number;
}

export interface TimelineNode {
  node_id: string;
  node_name: string;
  node_type: string;
  start_offset_ms: number;
  duration_ms: number;
  status: 'success' | 'error';
  is_ai_node: boolean;
}

export interface ExecutionTimeline {
  execution_id: string;
  total_duration_ms: number;
  nodes: TimelineNode[];
}

/**
 * Fetch all n8n workflows for a project
 */
export async function fetchN8nWorkflows(projectId: string): Promise<N8nWorkflow[]> {
  const response = await apiClient.get('/n8n/workflows', {
    params: { project_id: projectId },
  });
  return response.data.workflows;
}

/**
 * Fetch detailed information for a specific workflow
 */
export async function fetchN8nWorkflowDetail(
  projectId: string,
  workflowId: string
): Promise<N8nWorkflowDetail> {
  const response = await apiClient.get(`/n8n/workflows/${workflowId}`, {
    params: { project_id: projectId },
  });
  return response.data;
}

/**
 * Fetch execution history for a workflow
 */
export async function fetchN8nExecutions(
  projectId: string,
  workflowId: string,
  limit: number = 50
): Promise<N8nExecution[]> {
  const response = await apiClient.get(`/n8n/workflows/${workflowId}/executions`, {
    params: { project_id: projectId, limit },
  });
  return response.data.executions;
}

/**
 * Fetch AI node metrics for a workflow
 */
export async function fetchN8nAINodeMetrics(
  projectId: string,
  workflowId: string
): Promise<N8nAINode[]> {
  const response = await apiClient.get(`/n8n/workflows/${workflowId}/ai-nodes`, {
    params: { project_id: projectId },
  });
  return response.data.nodes;
}

/**
 * Fetch execution timeline showing node execution order and timing
 */
export async function fetchExecutionTimeline(
  projectId: string,
  executionId: string
): Promise<ExecutionTimeline> {
  const response = await apiClient.get(`/n8n/executions/${executionId}/timeline`, {
    params: { project_id: projectId },
  });
  return response.data;
}
