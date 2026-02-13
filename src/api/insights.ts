import { apiClient } from './client';

export interface HealthTrendPoint {
  date: string;
  score: number;
}

export interface TopIssue {
  category: string;
  severity: string;
  count: number;
  latest_trace_id: string;
  recommendation: string;
}

export interface CostInsights {
  total_cost_usd: number;
  total_calls: number;
  potential_monthly_savings: number;
  top_saving_opportunity: string;
  cost_by_model: Record<string, number>;
}

export interface SecuritySummaryData {
  total_findings: number;
  by_severity: Record<string, number>;
  by_type: Record<string, number>;
}

export interface DriftSummaryData {
  active_alerts: number;
  by_severity: Record<string, number>;
  agents_affected: number;
}

export interface InsightsSummary {
  health_score: number;
  health_trend: HealthTrendPoint[];
  top_issues: TopIssue[];
  cost_insights: CostInsights;
  security_summary: SecuritySummaryData;
  drift_summary: DriftSummaryData;
  trace_count: number;
  error_rate: number;
  time_window: string;
}

export async function fetchInsightsSummary(
  projectId: string,
  timeWindow: string = '7d'
): Promise<InsightsSummary> {
  const response = await apiClient.get('/insights/summary', {
    params: { project_id: projectId, time_window: timeWindow },
  });
  return response.data;
}
