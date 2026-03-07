/**
 * Guardrails API Client
 *
 * Interfaces with the backend guardrails endpoints to:
 * - CRUD guardrail configurations
 * - View violation logs and summaries
 */

import { apiClient } from './client';

// Type Definitions

export interface GuardrailConfig {
  config_id: string;
  name: string;
  guard_type: string;
  enabled: boolean;
  action: string;
  config: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface GuardrailConfigRequest {
  name: string;
  guard_type: string;
  enabled?: boolean;
  action?: string;
  config?: Record<string, unknown>;
  description?: string;
}

export interface GuardrailViolation {
  violation_id: string;
  guard_name: string;
  phase: string;
  action_taken: string;
  message: string;
  trace_id: string | null;
  span_id: string | null;
  agent_name: string | null;
  model: string | null;
  details: string;
  created_at: string;
}

export interface ViolationSummaryEntry {
  guard_name: string;
  phase: string;
  action_taken: string;
  count: number;
}

// API Functions

export async function listGuardrailConfigs(projectId: string) {
  const response = await apiClient.get(`/guardrails/projects/${projectId}/configs`);
  return response.data as { configs: GuardrailConfig[]; count: number };
}

export async function createGuardrailConfig(projectId: string, request: GuardrailConfigRequest) {
  const response = await apiClient.post(`/guardrails/projects/${projectId}/configs`, request);
  return response.data;
}

export async function updateGuardrailConfig(projectId: string, configId: string, request: GuardrailConfigRequest) {
  const response = await apiClient.put(`/guardrails/projects/${projectId}/configs/${configId}`, request);
  return response.data;
}

export async function deleteGuardrailConfig(projectId: string, configId: string) {
  const response = await apiClient.delete(`/guardrails/projects/${projectId}/configs/${configId}`);
  return response.data;
}

export async function listViolations(
  projectId: string,
  params?: { guard_name?: string; phase?: string; action_taken?: string; hours?: number; limit?: number }
) {
  const response = await apiClient.get(`/guardrails/projects/${projectId}/violations`, { params });
  return response.data as { violations: GuardrailViolation[]; count: number };
}

export async function getViolationSummary(projectId: string, hours?: number) {
  const params: Record<string, number> = {};
  if (hours) params.hours = hours;
  const response = await apiClient.get(`/guardrails/projects/${projectId}/violations/summary`, { params });
  return response.data as { summary: ViolationSummaryEntry[]; total_violations: number; hours: number };
}
