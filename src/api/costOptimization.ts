/**
 * Cost Optimization API client
 *
 * Fetches model downgrade and caching recommendations from backend.
 */

import { apiClient } from './client';

export interface ModelRecommendation {
  current_model: string;
  recommended_model: string;
  confidence: number;
  estimated_monthly_savings: number;
  estimated_annual_savings: number;
  performance_impact: string;
  latency_change_pct: number;
  reasoning: string;
  current_call_count: number;
  current_avg_latency_ms: number;
}

export interface CacheRecommendation {
  cluster_id: string;
  representative_prompt: string;
  duplicate_count: number;
  frequency_per_day: number;
  avg_tokens_per_call: number;
  current_monthly_cost: number;
  estimated_monthly_savings: number;
  estimated_annual_savings: number;
  cache_hit_rate: number;
  reasoning: string;
  confidence: number;
}

export interface ModelRecommendationsResponse {
  recommendations: ModelRecommendation[];
  count: number;
  total_potential_annual_savings: number;
  time_window: string;
  project_id: string;
}

export interface CacheRecommendationsResponse {
  recommendations: CacheRecommendation[];
  count: number;
  total_potential_annual_savings: number;
  storage_estimate: {
    unique_prompts: number;
    avg_tokens_per_entry: number;
    bytes_per_entry: number;
    total_storage_mb: number;
    semantic_cache: boolean;
  };
  time_window: string;
  project_id: string;
  prompts_analyzed: number;
}

export interface CostAnalytics {
  total_cost_usd: number;
  total_tokens: number;
  total_calls: number;
  avg_cost_per_call: number;
  avg_tokens_per_call: number;
  cost_by_model: Record<string, number>;
  cost_by_vendor: Record<string, number>;
  date_range_days: number;
}

/**
 * Fetch model downgrade recommendations
 */
export async function fetchModelRecommendations(
  projectId: string,
  timeWindow: string = '30d',
  vendor: string = 'all'
): Promise<ModelRecommendationsResponse> {
  const response = await apiClient.get('/cost-optimization/model-recommendations', {
    params: { project_id: projectId, time_window: timeWindow, vendor },
  });
  return response.data;
}

/**
 * Fetch caching recommendations
 */
export async function fetchCacheRecommendations(
  projectId: string,
  timeWindow: string = '30d',
  minClusterSize: number = 5
): Promise<CacheRecommendationsResponse> {
  const response = await apiClient.get('/cost-optimization/cache-recommendations', {
    params: {
      project_id: projectId,
      time_window: timeWindow,
      min_cluster_size: minClusterSize,
    },
  });
  return response.data;
}

/**
 * Fetch cost analytics
 */
export async function fetchCostAnalytics(
  projectId: string,
  timeWindow: string = '30d'
): Promise<CostAnalytics> {
  const response = await apiClient.get('/cost-optimization/analytics', {
    params: { project_id: projectId, time_window: timeWindow },
  });
  return response.data;
}
