/**
 * Eval Generation API Client
 *
 * TypeScript types and API functions for generating eval test suites
 * from production trace data.
 */

import { apiClient } from './client';

// Type Definitions

export interface EvalGenerationConfig {
  suite_name?: string;
  time_window_hours: number;
  max_traces: number;
  max_cases: number;
  include_failure_modes: boolean;
  include_edge_cases: boolean;
  include_positive_examples: boolean;
  agent_name_filter?: string;
  service_name_filter?: string;
}

export interface EvalGenerationResponse {
  generation_id: string;
  status: string;
  started_at: string;
}

export interface PatternSummary {
  category: string;
  subcategory: string;
  count: number;
  description: string;
}

export interface EvalGenerationStatus {
  generation_id: string;
  status: 'running' | 'completed' | 'failed';
  suite_name: string;
  cases_generated: number;
  traces_analyzed: number;
  patterns_found: number;
  pattern_summary: PatternSummary[];
  error: string | null;
  started_at: string;
  completed_at: string | null;
}

export interface EvalGenerationListItem {
  generation_id: string;
  suite_name: string;
  status: string;
  cases_generated: number;
  traces_analyzed: number;
  started_at: string;
  completed_at: string | null;
}

export interface EvalGenerationHistoryResponse {
  generations: EvalGenerationListItem[];
  total: number;
  page: number;
  page_size: number;
}

// API Functions

export async function triggerEvalGeneration(
  projectId: string,
  config: EvalGenerationConfig
): Promise<EvalGenerationResponse> {
  const response = await apiClient.post('/eval-generation/generate', config, {
    params: { project_id: projectId },
  });
  return response.data;
}

export async function getEvalGenerationStatus(
  projectId: string,
  generationId: string
): Promise<EvalGenerationStatus> {
  const response = await apiClient.get(`/eval-generation/${generationId}/status`, {
    params: { project_id: projectId },
  });
  return response.data;
}

export async function downloadEvalSuite(
  projectId: string,
  generationId: string
): Promise<Blob> {
  const response = await apiClient.get(`/eval-generation/${generationId}/download`, {
    params: { project_id: projectId },
    responseType: 'blob',
  });
  return response.data;
}

export async function listEvalGenerations(
  projectId: string,
  page: number = 1,
  pageSize: number = 10
): Promise<EvalGenerationHistoryResponse> {
  const response = await apiClient.get('/eval-generation/history', {
    params: { project_id: projectId, page, page_size: pageSize },
  });
  return response.data;
}
