/**
 * Debug Agent API Client
 *
 * Provides TypeScript types and API functions for triggering
 * LLM-powered trace debug analysis.
 */

import { apiClient } from './client';

// Type Definitions

export interface TimelineEntry {
  span_id: string;
  name: string;
  span_type: string;
  started_at: string;
  duration_ms: number;
  status: string;
  error_message: string | null;
  parent_span_id: string | null;
}

export interface FailureChainEntry {
  span_id: string;
  name: string;
  span_type: string;
  error_message: string;
  is_root_cause: boolean;
}

export interface DebugAnalysis {
  trace_id: string;
  root_cause: string;
  explanation: string;
  fix_suggestions: string[];
  execution_timeline: TimelineEntry[];
  failure_chain: FailureChainEntry[];
  confidence_score: number;
  analyzed_at: string;
  cached: boolean;
}

// API Functions

/**
 * Trigger debug analysis for a trace.
 *
 * @param projectId - The project identifier
 * @param traceId - The trace identifier
 * @param force - Skip cache and force re-analysis
 * @returns Promise resolving to debug analysis results
 */
export async function triggerDebugAnalysis(
  projectId: string,
  traceId: string,
  force: boolean = false
): Promise<DebugAnalysis> {
  const params = new URLSearchParams({ project_id: projectId });
  if (force) {
    params.set('force', 'true');
  }

  const response = await apiClient.post<DebugAnalysis>(
    `/debug/traces/${traceId}?${params.toString()}`
  );

  return response.data;
}
