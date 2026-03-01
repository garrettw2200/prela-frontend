/**
 * Drift Detection API Client
 *
 * Interfaces with the backend drift detection endpoints to:
 * - Fetch baselines for agents
 * - Check for drift/anomalies
 * - Calculate new baselines
 */

import { apiClient } from './client';

// Type Definitions

export type AnomalySeverity = 'low' | 'medium' | 'high' | 'critical';

export interface BaselineMetrics {
  baseline_id: string;
  agent_name: string;
  service_name: string;
  window_start: string;
  window_end: string;
  sample_size: number;

  // Duration metrics
  duration_mean: number;
  duration_stddev: number;
  duration_p50: number;
  duration_p95: number;

  // Token usage
  token_usage_mean: number;
  token_usage_stddev: number;

  // Success rate
  success_rate: number;
  error_count: number;

  // Cost
  cost_mean: number;
  cost_total: number;
}

export interface Anomaly {
  metric_name: string;
  current_value: number;
  baseline_mean: number;
  change_percent: number;
  severity: AnomalySeverity;
  direction: 'increased' | 'decreased';
  unit: string;
  sample_size: number;
}

export interface RootCause {
  type: string;
  description: string;
  confidence: number; // 0.0 - 1.0
}

export interface DriftAlert {
  agent_name: string;
  service_name: string;
  anomalies: Anomaly[];
  root_causes: RootCause[];
  baseline: BaselineMetrics;
  detected_at: string;
}

export interface StoredAlert {
  alert_id: string;
  project_id: string;
  agent_name: string;
  service_name: string;
  baseline_id: string;
  detected_at: string;
  severity: AnomalySeverity;
  status: 'active' | 'acknowledged' | 'dismissed' | 'muted';
  anomalies: Anomaly[];
  root_causes: RootCause[];
  acknowledged_by?: string;
  acknowledged_at?: string;
  dismissed_by?: string;
  dismissed_at?: string;
  mute_until?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface DriftCheckResponse {
  alerts: DriftAlert[];
  checked_at: string;
}

export interface AlertsResponse {
  alerts: StoredAlert[];
  count: number;
}

export interface BaselineListResponse {
  baselines: BaselineMetrics[];
  total: number;
}

// API Functions

/**
 * Fetch baselines for a project
 */
export async function fetchBaselines(
  projectId: string,
  agentName?: string,
  limit: number = 10
): Promise<BaselineListResponse> {
  const params = new URLSearchParams({
    limit: limit.toString(),
  });

  if (agentName) {
    params.append('agent_name', agentName);
  }

  const response = await apiClient.get<BaselineListResponse>(
    `/drift/projects/${projectId}/baselines?${params}`
  );

  return response.data;
}

/**
 * Calculate new baselines for a project
 */
export async function calculateBaselines(
  projectId: string,
  agentName?: string,
  windowDays: number = 7
): Promise<{ message: string; baselines_calculated: number }> {
  const params = new URLSearchParams({
    window_days: windowDays.toString(),
  });

  if (agentName) {
    params.append('agent_name', agentName);
  }

  const response = await apiClient.post<{ message: string; baselines_calculated: number }>(
    `/drift/projects/${projectId}/baselines/calculate?${params}`
  );

  return response.data;
}

/**
 * Check for drift/anomalies in agent behavior
 */
export async function checkDrift(
  projectId: string,
  agentName?: string,
  sensitivity: number = 2.0,
  since?: string
): Promise<DriftCheckResponse> {
  const params = new URLSearchParams({
    sensitivity: sensitivity.toString(),
  });

  if (agentName) {
    params.append('agent_name', agentName);
  }

  if (since) {
    params.append('since', since);
  }

  const response = await apiClient.get<DriftCheckResponse>(
    `/drift/projects/${projectId}/drift/check?${params}`
  );

  return response.data;
}

// Utility Functions

/**
 * Get color for anomaly severity
 */
export function getSeverityColor(severity: AnomalySeverity): string {
  const colors = {
    low: 'blue',
    medium: 'yellow',
    high: 'orange',
    critical: 'red',
  };
  return colors[severity];
}

/**
 * Get icon for anomaly severity
 */
export function getSeverityIcon(severity: AnomalySeverity): string {
  const icons = {
    low: '🔵',
    medium: '⚠️',
    high: '🟠',
    critical: '🔴',
  };
  return icons[severity];
}

/**
 * Format metric value with unit
 */
export function formatMetricValue(value: number, unit: string): string {
  if (unit === 'ms') {
    return value < 1000 ? `${value.toFixed(0)}ms` : `${(value / 1000).toFixed(1)}s`;
  }
  if (unit === 'tokens' || unit === 'count') {
    return value.toFixed(0);
  }
  if (unit === 'usd' || unit === '$') {
    return `$${value.toFixed(2)}`;
  }
  if (unit === 'rate' || unit === '%') {
    return `${(value * 100).toFixed(1)}%`;
  }
  return value.toFixed(2);
}

/**
 * Format change percentage with direction
 */
export function formatChangePercent(
  percent: number,
  direction: 'increased' | 'decreased'
): string {
  const sign = direction === 'increased' ? '+' : '-';
  return `${sign}${Math.abs(percent).toFixed(1)}%`;
}

/**
 * Fetch drift alerts for a project
 */
export async function fetchAlerts(
  projectId: string,
  options?: {
    agentName?: string;
    status?: string;
    severity?: string;
    limit?: number;
  }
): Promise<AlertsResponse> {
  const params = new URLSearchParams();
  if (options?.agentName) params.set('agent_name', options.agentName);
  if (options?.status) params.set('status', options.status);
  if (options?.severity) params.set('severity', options.severity);
  if (options?.limit) params.set('limit', options.limit.toString());

  const response = await apiClient.get<AlertsResponse>(
    `/drift/projects/${projectId}/alerts?${params}`
  );

  return response.data;
}

/**
 * Get a specific alert by ID
 */
export async function fetchAlert(
  projectId: string,
  alertId: string
): Promise<StoredAlert> {
  const response = await apiClient.get<StoredAlert>(
    `/drift/projects/${projectId}/alerts/${alertId}`
  );

  return response.data;
}

/**
 * Update alert status
 */
export async function updateAlertStatus(
  projectId: string,
  alertId: string,
  data: {
    status: 'acknowledged' | 'dismissed' | 'muted' | 'active';
    user_id?: string;
    notes?: string;
    mute_hours?: number;
  }
): Promise<{ alert_id: string; status: string; updated: boolean }> {
  const response = await apiClient.patch<{ alert_id: string; status: string; updated: boolean }>(
    `/drift/projects/${projectId}/alerts/${alertId}`,
    data
  );

  return response.data;
}

// Alert Rules API

export interface AlertRule {
  rule_id: string;
  project_id: string;
  name: string;
  description?: string;
  enabled: boolean;

  // Rule conditions
  agent_name?: string;
  metric_name?: string;
  severity_threshold: AnomalySeverity;
  change_percent_min?: number;

  // Notification configuration
  notify_email: boolean;
  email_addresses: string[];
  notify_slack: boolean;
  slack_webhook_url?: string;
  slack_channel?: string;

  // Metadata
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CreateAlertRuleRequest {
  name: string;
  description?: string;
  enabled?: boolean;

  // Rule conditions
  agent_name?: string;
  metric_name?: string;
  severity_threshold?: AnomalySeverity;
  change_percent_min?: number;

  // Notification configuration
  notify_email?: boolean;
  email_addresses?: string[];
  notify_slack?: boolean;
  slack_webhook_url?: string;
  slack_channel?: string;

  // User ID
  user_id: string;
}

export interface AlertRulesResponse {
  rules: AlertRule[];
  count: number;
}

/**
 * Create alert rule
 */
export async function createAlertRule(
  projectId: string,
  data: CreateAlertRuleRequest
): Promise<{ rule_id: string; project_id: string; name: string }> {
  const response = await apiClient.post<{ rule_id: string; project_id: string; name: string }>(
    `/drift/projects/${projectId}/alert-rules`,
    data
  );

  return response.data;
}

/**
 * Fetch alert rules
 */
export async function fetchAlertRules(
  projectId: string,
  options?: {
    enabled?: boolean;
    limit?: number;
  }
): Promise<AlertRulesResponse> {
  const params = new URLSearchParams();
  if (options?.enabled !== undefined) params.set('enabled', options.enabled.toString());
  if (options?.limit) params.set('limit', options.limit.toString());

  const response = await apiClient.get<AlertRulesResponse>(
    `/drift/projects/${projectId}/alert-rules?${params}`
  );

  return response.data;
}

/**
 * Get specific alert rule
 */
export async function fetchAlertRule(
  projectId: string,
  ruleId: string
): Promise<AlertRule> {
  const response = await apiClient.get<AlertRule>(
    `/drift/projects/${projectId}/alert-rules/${ruleId}`
  );

  return response.data;
}

/**
 * Update alert rule
 */
export async function updateAlertRule(
  projectId: string,
  ruleId: string,
  data: Partial<CreateAlertRuleRequest>
): Promise<{ rule_id: string; updated: boolean }> {
  const response = await apiClient.patch<{ rule_id: string; updated: boolean }>(
    `/drift/projects/${projectId}/alert-rules/${ruleId}`,
    data
  );

  return response.data;
}

/**
 * Delete alert rule
 */
export async function deleteAlertRule(
  projectId: string,
  ruleId: string
): Promise<{ rule_id: string; deleted: boolean }> {
  const response = await apiClient.delete<{ rule_id: string; deleted: boolean }>(
    `/drift/projects/${projectId}/alert-rules/${ruleId}`
  );

  return response.data;
}
