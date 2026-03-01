/**
 * Cost Optimization Dashboard
 *
 * Main dashboard for displaying cost optimization recommendations.
 * Includes model downgrades (P2.4.1) and caching opportunities (P2.4.3).
 */

import { useQuery } from '@tanstack/react-query';
import { DollarSign, Loader2 } from 'lucide-react';
import { useState } from 'react';
import {
  fetchCacheRecommendations,
  fetchCostAnalytics,
  fetchModelRecommendations,
} from '../api/costOptimization';
import { CacheRecommendationCard } from '../components/cost/CacheRecommendationCard';
import { CostRecommendationBanner } from '../components/cost/CostRecommendationBanner';
import { ModelRecommendationCard } from '../components/cost/ModelRecommendationCard';
import { useProject } from '../contexts/ProjectContext';

export function CostOptimizationDashboard() {
  const { currentProject } = useProject();
  const projectId = currentProject?.project_id || 'default';
  const [timeWindow, setTimeWindow] = useState('30d');

  // Fetch model recommendations
  const {
    data: modelData,
    isLoading: isLoadingModels,
    error: modelError,
  } = useQuery({
    queryKey: ['modelRecommendations', projectId, timeWindow],
    queryFn: () => fetchModelRecommendations(projectId, timeWindow),
  });

  // Fetch cache recommendations
  const {
    data: cacheData,
    isLoading: isLoadingCache,
    error: cacheError,
  } = useQuery({
    queryKey: ['cacheRecommendations', projectId, timeWindow],
    queryFn: () => fetchCacheRecommendations(projectId, timeWindow),
  });

  // Fetch analytics
  const {
    data: analyticsData,
    isLoading: isLoadingAnalytics,
    error: analyticsError,
  } = useQuery({
    queryKey: ['costAnalytics', projectId, timeWindow],
    queryFn: () => fetchCostAnalytics(projectId, timeWindow),
  });

  const isLoading = isLoadingModels || isLoadingCache || isLoadingAnalytics;
  const hasError = modelError || cacheError || analyticsError;

  const totalAnnualSavings =
    (modelData?.total_potential_annual_savings || 0) +
    (cacheData?.total_potential_annual_savings || 0);

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <DollarSign className="h-6 w-6 text-green-600" />
          <h1 className="text-2xl font-bold text-gray-900">Cost Optimization</h1>
        </div>
        <p className="text-sm text-gray-600">
          AI-powered recommendations to reduce your LLM costs without sacrificing quality.
        </p>
      </div>

      {/* Time Window Selector */}
      <div className="mb-6 flex items-center gap-2">
        <span className="text-sm text-gray-600">Time period:</span>
        <select
          value={timeWindow}
          onChange={(e) => setTimeWindow(e.target.value)}
          className="px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
        </select>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
          <span className="ml-2 text-gray-600">Loading recommendations...</span>
        </div>
      )}

      {/* Error State */}
      {hasError && !isLoading && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          Failed to load recommendations. Please try again later.
        </div>
      )}

      {/* Content */}
      {!isLoading && !hasError && (
        <>
          {/* Banner */}
          {(modelData?.recommendations.length || 0) + (cacheData?.recommendations.length || 0) >
            0 && (
            <CostRecommendationBanner
              modelRecommendations={modelData?.recommendations || []}
              cacheRecommendations={cacheData?.recommendations || []}
              totalAnnualSavings={totalAnnualSavings}
            />
          )}

          {/* Analytics Summary */}
          {analyticsData && (
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="text-xs text-gray-500 mb-1">Total Cost ({timeWindow})</div>
                <div className="text-2xl font-bold text-gray-900">
                  ${analyticsData.total_cost_usd.toFixed(2)}
                </div>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="text-xs text-gray-500 mb-1">Total Calls</div>
                <div className="text-2xl font-bold text-gray-900">
                  {analyticsData.total_calls.toLocaleString()}
                </div>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="text-xs text-gray-500 mb-1">Avg Cost/Call</div>
                <div className="text-2xl font-bold text-gray-900">
                  ${analyticsData.avg_cost_per_call.toFixed(4)}
                </div>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="text-xs text-gray-500 mb-1">Total Tokens</div>
                <div className="text-2xl font-bold text-gray-900">
                  {(analyticsData.total_tokens / 1000).toFixed(1)}K
                </div>
              </div>
            </div>
          )}

          {/* Model Recommendations */}
          {modelData && modelData.recommendations.length > 0 && (
            <section className="mb-8">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-1">
                  Model Downgrades ({modelData.recommendations.length})
                </h2>
                <p className="text-sm text-gray-600">
                  Switch to cheaper models with minimal performance impact
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {modelData.recommendations.map((rec, idx) => (
                  <ModelRecommendationCard key={idx} recommendation={rec} />
                ))}
              </div>
            </section>
          )}

          {/* Cache Recommendations */}
          {cacheData && cacheData.recommendations.length > 0 && (
            <section className="mb-8">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-1">
                  Caching Opportunities ({cacheData.recommendations.length})
                </h2>
                <p className="text-sm text-gray-600">
                  Eliminate duplicate prompts with semantic caching
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {cacheData.recommendations.map((rec, idx) => (
                  <CacheRecommendationCard key={idx} recommendation={rec} />
                ))}
              </div>
              {cacheData.storage_estimate && (
                <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                  <div className="font-medium text-blue-900 mb-1">Storage Estimate</div>
                  <div className="text-blue-700">
                    {cacheData.storage_estimate.unique_prompts} unique prompts •{' '}
                    {cacheData.storage_estimate.total_storage_mb.toFixed(1)} MB total •{' '}
                    {cacheData.storage_estimate.semantic_cache
                      ? 'Semantic cache (embeddings)'
                      : 'Exact match cache (hashing)'}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* No Recommendations */}
          {(!modelData || modelData.recommendations.length === 0) &&
            (!cacheData || cacheData.recommendations.length === 0) && (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-2">
                  <DollarSign className="h-12 w-12 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">
                  No Recommendations Available
                </h3>
                <p className="text-sm text-gray-600">
                  We couldn't find any cost optimization opportunities in the selected time period.
                  <br />
                  Try selecting a longer time window or check back later after more usage data is collected.
                </p>
              </div>
            )}
        </>
      )}
    </div>
  );
}
