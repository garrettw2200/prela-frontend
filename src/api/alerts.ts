/**
 * Alerts API Client
 *
 * Interfaces with the backend alerting endpoints to:
 * - CRUD alert rules (metric-based thresholds)
 * - View triggered alert history
 */

import { apiClient } from './client';

// Type Definitions

export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';
export type MetricType = 'error_rate' | 'latency_p95' | 'latency_mean' | 'cost_per_trace' | 'success_rate' | 'token_usage';
export type AlertCondition = 'gt' | 'lt' | 'gte' | 'lte';

export interface AlertRule {
  rule_id: string;
  project_id: string;
  name: string;
  description: string;
  enabled: boolean;
  metric_type: MetricType;
  condition: AlertCondition;
  threshold: number;
  evaluation_window_minutes: number;
  agent_name: string | null;
  notify_email: boolean;
  email_addresses: string[];
  notify_slack: boolean;
  slack_webhook_url: string | null;
  notify_pagerduty: boolean;
  pagerduty_routing_key: string | null;
  cooldown_minutes: number;
  severity: AlertSeverity;
  created_at: string;
}

export interface AlertHistoryEntry {
  alert_id: string;
  rule_id: string;
  project_id: string;
  rule_name: string;
  metric_type: MetricType;
  current_value: number;
  threshold: number;
  condition: AlertCondition;
  severity: AlertSeverity;
  notification_results: string;
  triggered_at: string;
}

export interface CreateAlertRuleRequest {
  name: string;
  description?: string;
  enabled?: boolean;
  metric_type: MetricType;
  condition: AlertCondition;
  threshold: number;
  evaluation_window_minutes?: number;
  agent_name?: string;
  notify_email?: boolean;
  email_addresses?: string[];
  notify_slack?: boolean;
  slack_webhook_url?: string;
  notify_pagerduty?: boolean;
  pagerduty_routing_key?: string;
  cooldown_minutes?: number;
  severity?: AlertSeverity;
}

// API Functions

export async function listAlertRules(projectId: string, enabled?: boolean): Promise<{ rules: AlertRule[]; total: number }> {
  const params: Record<string, string> = {};
  if (enabled !== undefined) params.enabled = String(enabled);
  const response = await apiClient.get(`/alerts/projects/${projectId}/rules`, { params });
  return response.data;
}

export async function createAlertRule(projectId: string, rule: CreateAlertRuleRequest): Promise<AlertRule> {
  const response = await apiClient.post(`/alerts/projects/${projectId}/rules`, rule);
  return response.data;
}

export async function updateAlertRule(projectId: string, ruleId: string, update: Partial<CreateAlertRuleRequest>): Promise<AlertRule> {
  const response = await apiClient.put(`/alerts/projects/${projectId}/rules/${ruleId}`, update);
  return response.data;
}

export async function deleteAlertRule(projectId: string, ruleId: string): Promise<void> {
  await apiClient.delete(`/alerts/projects/${projectId}/rules/${ruleId}`);
}

export async function listAlertHistory(projectId: string, ruleId?: string, limit?: number): Promise<{ alerts: AlertHistoryEntry[]; total: number }> {
  const params: Record<string, string> = {};
  if (ruleId) params.rule_id = ruleId;
  if (limit) params.limit = String(limit);
  const response = await apiClient.get(`/alerts/projects/${projectId}/history`, { params });
  return response.data;
}

// Display helpers

export const METRIC_TYPE_LABELS: Record<MetricType, string> = {
  error_rate: 'Error Rate',
  latency_p95: 'Latency (P95)',
  latency_mean: 'Latency (Mean)',
  cost_per_trace: 'Cost per Trace',
  success_rate: 'Success Rate',
  token_usage: 'Token Usage',
};

export const CONDITION_LABELS: Record<AlertCondition, string> = {
  gt: '>',
  lt: '<',
  gte: '>=',
  lte: '<=',
};

export const SEVERITY_COLORS: Record<AlertSeverity, string> = {
  low: '#3b82f6',
  medium: '#eab308',
  high: '#f97316',
  critical: '#ef4444',
};
