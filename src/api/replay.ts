/**
 * Replay API Client
 *
 * Functions for interacting with replay endpoints.
 */

import { apiClient } from "./client";

// ============================================================================
// TypeScript Interfaces
// ============================================================================

export interface ReplayCapableTrace {
  trace_id: string;
  service_name: string;
  started_at: string;
  duration_ms: number;
  total_tokens?: number;
  total_cost_usd?: number;
  has_replay_snapshot: boolean;
  span_count: number;
  llm_span_count: number;
}

export interface ReplayTracesResponse {
  traces: ReplayCapableTrace[];
  total: number;
  page: number;
  page_size: number;
}

export interface ReplayTraceDetail {
  trace_id: string;
  service_name: string;
  started_at: string;
  duration_ms: number;
  status: string;
  attributes: Record<string, any>;
  spans: any[];
  replay_snapshot_summary: {
    available: boolean;
    snapshot_count: number;
    models: string[];
  };
}

export interface ReplayParameters {
  model?: string;
  temperature?: number;
  system_prompt?: string;
  max_tokens?: number;
  stream?: boolean;
}

export interface ReplayExecutionRequest {
  trace_id: string;
  parameters?: ReplayParameters;
}

export interface ReplayExecutionResponse {
  execution_id: string;
  status: string;
  started_at: string;
}

export interface ReplayExecutionStatus {
  execution_id: string;
  trace_id: string;
  status: "running" | "completed" | "failed";
  started_at: string;
  completed_at?: string;
  parameters: Record<string, any>;
  result?: {
    total_duration_ms: number;
    total_tokens: number;
    total_cost_usd: number;
  };
  error?: string;
}

export interface SpanDifference {
  span_name: string;
  field: string;
  original_value: any;
  modified_value: any;
  semantic_similarity?: number;
}

export interface ReplayComparisonResponse {
  execution_id: string;
  original: {
    total_duration_ms: number;
    total_tokens: number;
    total_cost_usd: number;
  };
  modified: {
    total_duration_ms: number;
    total_tokens: number;
    total_cost_usd: number;
  };
  differences: SpanDifference[];
  summary: string;
  semantic_similarity_available: boolean;
}

export interface ReplayHistoryItem {
  execution_id: string;
  trace_id: string;
  triggered_at: string;
  completed_at?: string;
  status: string;
  parameters: Record<string, any>;
  duration_ms?: number;
  cost_delta?: number;
}

export interface ReplayHistoryResponse {
  executions: ReplayHistoryItem[];
  total: number;
  page: number;
  page_size: number;
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * List traces with replay capability
 */
export async function fetchReplayTraces(
  projectId: string,
  page: number = 1,
  pageSize: number = 20,
  since?: string
): Promise<ReplayTracesResponse> {
  const params = new URLSearchParams({
    project_id: projectId,
    page: page.toString(),
    page_size: pageSize.toString(),
  });

  if (since) {
    params.append("since", since);
  }

  const response = await apiClient.get<ReplayTracesResponse>(
    `/replay/traces?${params}`
  );
  return response.data;
}

/**
 * Get detailed trace with replay snapshot
 */
export async function fetchReplayTraceDetail(
  traceId: string
): Promise<ReplayTraceDetail> {
  const response = await apiClient.get<ReplayTraceDetail>(
    `/replay/traces/${traceId}`
  );
  return response.data;
}

/**
 * Trigger replay execution
 */
export async function executeReplay(
  request: ReplayExecutionRequest
): Promise<ReplayExecutionResponse> {
  const response = await apiClient.post<ReplayExecutionResponse>(
    "/replay/execute",
    request
  );
  return response.data;
}

/**
 * Get replay execution status
 */
export async function fetchReplayExecutionStatus(
  executionId: string
): Promise<ReplayExecutionStatus> {
  const response = await apiClient.get<ReplayExecutionStatus>(
    `/replay/executions/${executionId}`
  );
  return response.data;
}

/**
 * Get replay comparison results
 */
export async function fetchReplayComparison(
  executionId: string
): Promise<ReplayComparisonResponse> {
  const response = await apiClient.get<ReplayComparisonResponse>(
    `/replay/executions/${executionId}/comparison`
  );
  return response.data;
}

/**
 * List replay execution history
 */
export async function fetchReplayHistory(
  projectId: string,
  page: number = 1,
  pageSize: number = 20
): Promise<ReplayHistoryResponse> {
  const params = new URLSearchParams({
    project_id: projectId,
    page: page.toString(),
    page_size: pageSize.toString(),
  });

  const response = await apiClient.get<ReplayHistoryResponse>(
    `/replay/history?${params}`
  );
  return response.data;
}
