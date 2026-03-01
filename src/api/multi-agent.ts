/**
 * Multi-Agent API Client
 *
 * Provides TypeScript interfaces and functions for querying multi-agent execution data
 * from the backend API (/api/v1/multi-agent endpoints).
 */

import { apiClient } from './client';

export interface ExecutionSummary {
  execution_id: string;
  framework: 'crewai' | 'autogen' | 'langgraph' | 'swarm';
  trace_id: string;
  service_name: string;
  status: 'success' | 'error' | 'running';
  started_at: string;
  duration_ms: number;
  initial_agent?: string;
  final_agent?: string;
  num_agents?: number;
  num_handoffs?: number;
  num_tasks?: number;
}

export interface ExecutionDetails {
  execution_id: string;
  framework: string;
  trace_id: string;
  service_name: string;
  status: string;
  started_at: string;
  duration_ms: number;
  agents_used: string[];
  handoffs: Array<{
    from_agent: string;
    to_agent: string;
    reason?: string;
  }>;
  tasks?: Array<{
    task_id: string;
    description: string;
    status: string;
  }>;
  context_variables?: string[];
}

export interface AgentGraphNode {
  id: string;
  label: string;
  type: 'agent' | 'task';
  invocations: number;
  avg_duration_ms?: number;
}

export interface AgentGraphEdge {
  source: string;
  target: string;
  type: 'delegation' | 'handoff';
  count: number;
}

export interface AgentGraph {
  nodes: AgentGraphNode[];
  edges: AgentGraphEdge[];
}

export interface TaskInfo {
  task_id: string;
  task_name: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  assigned_agent?: string;
  started_at?: string;
  completed_at?: string;
  duration_ms?: number;
  output?: string;
}

export interface AgentPerformance {
  agent_name: string;
  framework: string;
  total_invocations: number;
  avg_duration_ms: number;
  success_rate: number;
  total_duration_ms: number;
  error_count: number;
}

/**
 * Fetch list of multi-agent executions with optional filtering
 */
export async function fetchMultiAgentExecutions(
  projectId: string,
  framework?: 'crewai' | 'autogen' | 'langgraph' | 'swarm',
  status?: 'success' | 'error' | 'running',
  since?: string,
  limit: number = 50
): Promise<ExecutionSummary[]> {
  const params = new URLSearchParams();
  if (framework) params.append('framework', framework);
  if (status) params.append('status', status);
  if (since) params.append('since', since);
  params.append('limit', limit.toString());

  const response = await apiClient.get<ExecutionSummary[]>(
    `/multi-agent/executions?project_id=${projectId}&${params.toString()}`
  );

  return response.data;
}

/**
 * Fetch detailed execution information including agents and handoffs
 */
export async function fetchExecutionDetail(
  projectId: string,
  executionId: string
): Promise<ExecutionDetails> {
  const response = await apiClient.get<ExecutionDetails>(
    `/multi-agent/executions/${executionId}?project_id=${projectId}`
  );

  return response.data;
}

/**
 * Fetch agent communication graph (nodes and edges)
 */
export async function fetchAgentGraph(
  projectId: string,
  executionId: string
): Promise<AgentGraph> {
  const response = await apiClient.get<AgentGraph>(
    `/multi-agent/executions/${executionId}/graph?project_id=${projectId}`
  );

  return response.data;
}

/**
 * Fetch execution tasks (CrewAI/AutoGen)
 */
export async function fetchExecutionTasks(
  projectId: string,
  executionId: string
): Promise<TaskInfo[]> {
  const response = await apiClient.get<TaskInfo[]>(
    `/multi-agent/executions/${executionId}/tasks?project_id=${projectId}`
  );

  return response.data;
}

/**
 * Fetch agent performance analytics
 */
export async function fetchAgentPerformance(
  projectId: string,
  framework?: string,
  since?: string,
  limit: number = 20
): Promise<AgentPerformance[]> {
  const params = new URLSearchParams();
  if (framework) params.append('framework', framework);
  if (since) params.append('since', since);
  params.append('limit', limit.toString());

  const response = await apiClient.get<AgentPerformance[]>(
    `/multi-agent/analytics/agent-performance?project_id=${projectId}&${params.toString()}`
  );

  return response.data;
}

/**
 * Helper: Format duration in milliseconds to human-readable string
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms.toFixed(0)}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  if (ms < 3600000) return `${(ms / 60000).toFixed(1)}m`;
  return `${(ms / 3600000).toFixed(1)}h`;
}

/**
 * Helper: Get framework display name
 */
export function getFrameworkName(framework: string): string {
  const names: Record<string, string> = {
    crewai: 'CrewAI',
    autogen: 'AutoGen',
    langgraph: 'LangGraph',
    swarm: 'Swarm',
  };
  return names[framework] || framework;
}

/**
 * Helper: Get framework color for UI
 */
export function getFrameworkColor(framework: string): string {
  const colors: Record<string, string> = {
    crewai: 'blue',
    autogen: 'green',
    langgraph: 'purple',
    swarm: 'orange',
  };
  return colors[framework] || 'gray';
}
