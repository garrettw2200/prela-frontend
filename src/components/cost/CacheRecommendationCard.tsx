/**
 * Cache Recommendation Card Component
 *
 * Displays a single caching opportunity with duplicate prompt details.
 */

import { CheckCircle, Copy, Database, DollarSign, TrendingUp } from 'lucide-react';
import type { CacheRecommendation } from '../../api/costOptimization';

interface CacheRecommendationCardProps {
  recommendation: CacheRecommendation;
  onImplement?: (recommendation: CacheRecommendation) => void;
}

export function CacheRecommendationCard({
  recommendation,
  onImplement,
}: CacheRecommendationCardProps) {
  // Confidence level styling
  const getConfidenceStyle = () => {
    if (recommendation.confidence >= 0.8) {
      return { color: 'text-green-600', bg: 'bg-green-50', label: 'High' };
    } else if (recommendation.confidence >= 0.6) {
      return { color: 'text-yellow-600', bg: 'bg-yellow-50', label: 'Medium' };
    } else {
      return { color: 'text-gray-600', bg: 'bg-gray-50', label: 'Low' };
    }
  };

  const confidenceStyle = getConfidenceStyle();

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      {/* Header: Cluster Info */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Database className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-gray-900">
              Cache Cluster {recommendation.cluster_id.replace('cluster_', '')}
            </span>
          </div>
          <div className="text-xs text-gray-500">
            {recommendation.duplicate_count} duplicate prompts •{' '}
            {recommendation.frequency_per_day.toFixed(1)} calls/day
          </div>
        </div>

        {/* Confidence Badge */}
        <div className={`${confidenceStyle.bg} px-2 py-1 rounded text-xs font-medium ${confidenceStyle.color}`}>
          {confidenceStyle.label} Confidence
        </div>
      </div>

      {/* Representative Prompt */}
      <div className="mb-3 p-2 bg-gray-50 rounded border border-gray-200">
        <div className="text-xs font-medium text-gray-700 mb-1 flex items-center gap-1">
          <Copy className="h-3 w-3" />
          Representative Prompt:
        </div>
        <div className="text-xs text-gray-600 font-mono break-words line-clamp-3">
          {recommendation.representative_prompt}
        </div>
      </div>

      {/* Savings */}
      <div className="grid grid-cols-2 gap-4 mb-3 p-3 bg-green-50 rounded">
        <div>
          <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
            <DollarSign className="h-3 w-3" />
            Monthly Savings
          </div>
          <div className="text-lg font-bold text-green-600">
            ${recommendation.estimated_monthly_savings.toFixed(2)}
          </div>
        </div>
        <div>
          <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
            <DollarSign className="h-3 w-3" />
            Annual Savings
          </div>
          <div className="text-lg font-bold text-green-600">
            ${recommendation.estimated_annual_savings.toFixed(0)}
          </div>
        </div>
      </div>

      {/* Cache Metrics */}
      <div className="mb-3 grid grid-cols-3 gap-2 text-xs">
        <div>
          <div className="text-gray-500 mb-1">Cache Hit Rate</div>
          <div className="font-medium text-gray-900 flex items-center gap-1">
            <TrendingUp className="h-3 w-3 text-green-600" />
            {recommendation.cache_hit_rate.toFixed(0)}%
          </div>
        </div>
        <div>
          <div className="text-gray-500 mb-1">Avg Tokens</div>
          <div className="font-medium text-gray-900">
            {recommendation.avg_tokens_per_call.toFixed(0)}
          </div>
        </div>
        <div>
          <div className="text-gray-500 mb-1">Current Cost</div>
          <div className="font-medium text-gray-900">
            ${recommendation.current_monthly_cost.toFixed(2)}/mo
          </div>
        </div>
      </div>

      {/* Reasoning */}
      <div className="mb-3 text-xs text-gray-700 bg-blue-50 p-2 rounded">
        {recommendation.reasoning}
      </div>

      {/* Action */}
      {onImplement && (
        <button
          onClick={() => onImplement(recommendation)}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <CheckCircle className="h-4 w-4" />
          Implement Caching
        </button>
      )}
    </div>
  );
}
