/**
 * Cost Recommendation Banner Component
 *
 * Displays cost optimization recommendations in a prominent banner.
 * Shows total potential savings and allows drilling down into details.
 */

import { AlertCircle, ChevronRight, DollarSign, TrendingDown, X } from 'lucide-react';
import { useState } from 'react';
import type { CacheRecommendation, ModelRecommendation } from '../../api/costOptimization';

interface CostRecommendationBannerProps {
  modelRecommendations: ModelRecommendation[];
  cacheRecommendations: CacheRecommendation[];
  totalAnnualSavings: number;
  onViewDetails?: () => void;
  onDismiss?: () => void;
}

export function CostRecommendationBanner({
  modelRecommendations,
  cacheRecommendations,
  totalAnnualSavings,
  onViewDetails,
  onDismiss,
}: CostRecommendationBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) {
    return null;
  }

  const totalRecommendations =
    modelRecommendations.length + cacheRecommendations.length;

  if (totalRecommendations === 0) {
    return null;
  }

  // Determine severity based on savings potential
  const getSeverityInfo = () => {
    if (totalAnnualSavings >= 1000) {
      return {
        color: 'bg-orange-50 border-orange-200',
        iconColor: 'text-orange-600',
        textColor: 'text-orange-900',
        Icon: AlertCircle,
        label: 'High Savings Potential',
      };
    } else if (totalAnnualSavings >= 500) {
      return {
        color: 'bg-yellow-50 border-yellow-200',
        iconColor: 'text-yellow-600',
        textColor: 'text-yellow-900',
        Icon: TrendingDown,
        label: 'Moderate Savings Available',
      };
    } else {
      return {
        color: 'bg-blue-50 border-blue-200',
        iconColor: 'text-blue-600',
        textColor: 'text-blue-900',
        Icon: DollarSign,
        label: 'Savings Opportunities',
      };
    }
  };

  const severity = getSeverityInfo();
  const Icon = severity.Icon;

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  return (
    <div className={`${severity.color} border rounded-lg p-4 shadow-sm mb-4`}>
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`${severity.iconColor} mt-0.5`}>
          <Icon className="h-5 w-5" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <h3 className={`text-sm font-semibold ${severity.textColor}`}>
                {severity.label}
              </h3>
              <p className="text-xs text-gray-600 mt-0.5">
                {totalRecommendations} optimization{' '}
                {totalRecommendations === 1 ? 'opportunity' : 'opportunities'}{' '}
                identified
              </p>
            </div>

            {/* Dismiss button */}
            <button
              onClick={handleDismiss}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Savings Summary */}
          <div className="flex items-center gap-4 mb-3">
            <div>
              <div className="text-2xl font-bold text-gray-900">
                ${totalAnnualSavings.toFixed(0)}
                <span className="text-sm font-normal text-gray-500">/year</span>
              </div>
              <div className="text-xs text-gray-500">
                ${(totalAnnualSavings / 12).toFixed(0)}/month potential savings
              </div>
            </div>

            {modelRecommendations.length > 0 && (
              <div className="border-l border-gray-300 pl-4">
                <div className="text-sm font-medium text-gray-700">
                  {modelRecommendations.length} Model{' '}
                  {modelRecommendations.length === 1 ? 'Downgrade' : 'Downgrades'}
                </div>
                <div className="text-xs text-gray-500">
                  Switch to cheaper models
                </div>
              </div>
            )}

            {cacheRecommendations.length > 0 && (
              <div className="border-l border-gray-300 pl-4">
                <div className="text-sm font-medium text-gray-700">
                  {cacheRecommendations.length} Caching{' '}
                  {cacheRecommendations.length === 1 ? 'Opportunity' : 'Opportunities'}
                </div>
                <div className="text-xs text-gray-500">
                  Eliminate duplicate prompts
                </div>
              </div>
            )}
          </div>

          {/* Top Recommendation Preview */}
          {(modelRecommendations.length > 0 || cacheRecommendations.length > 0) && (
            <div className="bg-white bg-opacity-60 rounded p-2 mb-3 text-xs">
              <div className="font-medium text-gray-700 mb-1">Top Recommendation:</div>
              {modelRecommendations.length > 0 ? (
                <div className="text-gray-600">
                  Switch{' '}
                  <span className="font-mono text-gray-800">
                    {modelRecommendations[0].current_model}
                  </span>{' '}
                  →{' '}
                  <span className="font-mono text-gray-800">
                    {modelRecommendations[0].recommended_model}
                  </span>{' '}
                  for ${modelRecommendations[0].estimated_annual_savings.toFixed(0)}/year
                  savings
                </div>
              ) : (
                <div className="text-gray-600">
                  Cache {cacheRecommendations[0].duplicate_count} duplicate prompts for $
                  {cacheRecommendations[0].estimated_annual_savings.toFixed(0)}/year savings
                </div>
              )}
            </div>
          )}

          {/* Action Button */}
          {onViewDetails && (
            <button
              onClick={onViewDetails}
              className={`flex items-center gap-1 text-sm font-medium ${severity.textColor} hover:underline`}
            >
              View All Recommendations
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
