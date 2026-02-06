/**
 * Model Recommendation Card Component
 *
 * Displays a single model downgrade recommendation with details.
 */

import { ArrowRight, CheckCircle, Clock, DollarSign } from 'lucide-react';
import type { ModelRecommendation } from '../../api/costOptimization';

interface ModelRecommendationCardProps {
  recommendation: ModelRecommendation;
  onApply?: (recommendation: ModelRecommendation) => void;
}

export function ModelRecommendationCard({
  recommendation,
  onApply,
}: ModelRecommendationCardProps) {
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

  // Performance impact styling
  const getImpactStyle = () => {
    switch (recommendation.performance_impact) {
      case 'negligible':
        return { color: 'text-green-600', label: 'Negligible' };
      case 'minor':
        return { color: 'text-blue-600', label: 'Minor' };
      case 'moderate':
        return { color: 'text-yellow-600', label: 'Moderate' };
      case 'significant':
        return { color: 'text-orange-600', label: 'Significant' };
      default:
        return { color: 'text-gray-600', label: 'Unknown' };
    }
  };

  const confidenceStyle = getConfidenceStyle();
  const impactStyle = getImpactStyle();

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      {/* Header: Model Transition */}
      <div className="flex items-center gap-3 mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-medium text-gray-900">
              {recommendation.current_model}
            </span>
            <ArrowRight className="h-4 w-4 text-gray-400" />
            <span className="font-mono text-sm font-medium text-green-600">
              {recommendation.recommended_model}
            </span>
          </div>
        </div>

        {/* Confidence Badge */}
        <div className={`${confidenceStyle.bg} px-2 py-1 rounded text-xs font-medium ${confidenceStyle.color}`}>
          {confidenceStyle.label} Confidence
        </div>
      </div>

      {/* Savings */}
      <div className="grid grid-cols-2 gap-4 mb-3 p-3 bg-gray-50 rounded">
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

      {/* Performance Impact */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-sm mb-1">
          <span className="text-gray-600">Performance Impact:</span>
          <span className={`font-medium ${impactStyle.color}`}>
            {impactStyle.label}
          </span>
        </div>
        {recommendation.latency_change_pct !== 0 && (
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Clock className="h-3 w-3" />
            {recommendation.latency_change_pct > 0 ? '+' : ''}
            {recommendation.latency_change_pct.toFixed(1)}% latency change
          </div>
        )}
      </div>

      {/* Current Usage Stats */}
      <div className="mb-3 text-xs text-gray-600 border-t border-gray-100 pt-3">
        <div className="flex justify-between mb-1">
          <span>Current Calls:</span>
          <span className="font-medium">{recommendation.current_call_count.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span>Avg Latency:</span>
          <span className="font-medium">{recommendation.current_avg_latency_ms.toFixed(0)}ms</span>
        </div>
      </div>

      {/* Reasoning */}
      <div className="mb-3 text-xs text-gray-700 bg-blue-50 p-2 rounded">
        {recommendation.reasoning}
      </div>

      {/* Actions */}
      {onApply && (
        <button
          onClick={() => onApply(recommendation)}
          className="w-full flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-green-700 transition-colors"
        >
          <CheckCircle className="h-4 w-4" />
          Apply Recommendation
        </button>
      )}
    </div>
  );
}
