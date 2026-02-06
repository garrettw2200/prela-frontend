/**
 * Actionable Error Message Component
 *
 * Displays intelligent error analysis with actionable recommendations,
 * one-click replay buttons, and code snippets.
 */

import React, { useState, useEffect } from 'react';
import {
  ExclamationCircleIcon,
  LightBulbIcon,
  SparklesIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { ErrorAnalysis, ErrorRecommendation, ErrorExplanation, fetchErrorExplanation } from '@/api/errors';
import { executeReplay } from '@/api/replay';
import { useToast } from '@/components/Toast';

interface ActionableErrorMessageProps {
  spanId: string;
  spanName: string;
  traceId: string;
  projectId: string;
  analysis: ErrorAnalysis;
  onReplayTriggered?: (executionId: string) => void;
  showAiExplanation?: boolean; // Whether to fetch and show AI explanation
}

export function ActionableErrorMessage({
  spanId,
  spanName,
  traceId,
  projectId,
  analysis,
  onReplayTriggered,
  showAiExplanation = true,
}: ActionableErrorMessageProps) {
  const [isExecutingReplay, setIsExecutingReplay] = useState(false);
  const [aiExplanation, setAiExplanation] = useState<ErrorExplanation | null>(null);
  const [isLoadingExplanation, setIsLoadingExplanation] = useState(false);
  const toast = useToast();

  // Fetch AI explanation on mount if enabled
  useEffect(() => {
    if (!showAiExplanation) return;

    const loadExplanation = async () => {
      setIsLoadingExplanation(true);
      try {
        const result = await fetchErrorExplanation(projectId, traceId, spanId);
        setAiExplanation(result.explanation);
      } catch (error) {
        console.error('Failed to fetch AI explanation:', error);
        // Silently fail - explanation is nice-to-have, not critical
      } finally {
        setIsLoadingExplanation(false);
      }
    };

    loadExplanation();
  }, [spanId, traceId, projectId, showAiExplanation]);

  // Severity colors mapping
  const severityColors = {
    CRITICAL: 'bg-red-100 border-red-400 text-red-800',
    HIGH: 'bg-orange-100 border-orange-400 text-orange-800',
    MEDIUM: 'bg-yellow-100 border-yellow-400 text-yellow-800',
    LOW: 'bg-blue-100 border-blue-400 text-blue-800',
  };

  const handleQuickFix = async (recommendation: ErrorRecommendation) => {
    if (!recommendation.replay_params) return;

    setIsExecutingReplay(true);
    try {
      const result = await executeReplay({
        trace_id: traceId,
        parameters: recommendation.replay_params,
      });

      if (onReplayTriggered) {
        onReplayTriggered(result.execution_id);
      }

      toast.success('Replay started with suggested fix');
    } catch (error) {
      console.error('Failed to execute replay:', error);
      toast.error('Failed to start replay');
    } finally {
      setIsExecutingReplay(false);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Code copied to clipboard');
  };

  return (
    <div className={`border-l-4 p-4 rounded-lg ${severityColors[analysis.severity]}`}>
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <ExclamationCircleIcon className="h-6 w-6 flex-shrink-0" />
        <div className="flex-1">
          <h4 className="font-semibold text-base mb-1">
            {getCategoryTitle(analysis.category)}
          </h4>
          <p className="text-sm opacity-90">{spanName}</p>
        </div>
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-white bg-opacity-50">
          {analysis.severity}
        </span>
      </div>

      {/* Error Message */}
      <div className="mb-4 text-sm">
        <p className="font-mono bg-white bg-opacity-30 p-2 rounded break-words">
          {analysis.error_message}
        </p>
      </div>

      {/* AI Explanation */}
      {showAiExplanation && (
        <div className="mb-4">
          {isLoadingExplanation ? (
            <div className="bg-white bg-opacity-40 p-3 rounded-lg animate-pulse">
              <div className="flex items-center gap-2 mb-2">
                <SparklesIcon className="h-5 w-5" />
                <span className="text-sm font-medium">Analyzing error with AI...</span>
              </div>
              <div className="h-4 bg-white bg-opacity-50 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-white bg-opacity-50 rounded w-1/2"></div>
            </div>
          ) : aiExplanation ? (
            <div className="bg-white bg-opacity-40 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <SparklesIcon className="h-5 w-5 text-purple-600" />
                <h5 className="font-medium text-sm">AI Analysis</h5>
                <div className="flex-1"></div>
                <div className="flex items-center gap-1 text-xs text-gray-600">
                  <ClockIcon className="h-3 w-3" />
                  <span>{aiExplanation.estimated_fix_time}</span>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                {/* Why Section */}
                <div>
                  <p className="font-semibold text-xs uppercase text-gray-700 mb-1">
                    Why this happened:
                  </p>
                  <p className="text-gray-800 leading-relaxed">
                    {aiExplanation.why_it_happened}
                  </p>
                </div>

                {/* What to Do Section */}
                <div>
                  <p className="font-semibold text-xs uppercase text-gray-700 mb-1">
                    How to fix it:
                  </p>
                  <div className="text-gray-800 leading-relaxed whitespace-pre-line">
                    {aiExplanation.what_to_do}
                  </div>
                </div>

                {/* Related Patterns */}
                {aiExplanation.related_patterns.length > 0 && (
                  <details className="text-xs">
                    <summary className="cursor-pointer text-purple-600 hover:text-purple-800 font-medium">
                      Similar patterns ({aiExplanation.related_patterns.length})
                    </summary>
                    <ul className="mt-2 ml-4 space-y-1 list-disc text-gray-700">
                      {aiExplanation.related_patterns.map((pattern, idx) => (
                        <li key={idx}>{pattern}</li>
                      ))}
                    </ul>
                  </details>
                )}
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* Recommendations */}
      {analysis.recommendations.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <LightBulbIcon className="h-5 w-5" />
            <h5 className="font-medium">Recommended Fixes:</h5>
          </div>

          <div className="space-y-3">
            {analysis.recommendations.map((rec, idx) => (
              <div key={idx} className="bg-white bg-opacity-50 p-3 rounded">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <p className="font-medium text-sm mb-1">{rec.title}</p>
                    <p className="text-xs opacity-80">{rec.description}</p>
                    {rec.estimated_cost_impact && (
                      <p className="text-xs mt-1 font-mono opacity-70">
                        Impact: {rec.estimated_cost_impact}
                      </p>
                    )}
                  </div>
                  <span className="text-xs px-2 py-1 bg-white rounded ml-2 flex-shrink-0">
                    {Math.round(rec.confidence * 100)}% confidence
                  </span>
                </div>

                {/* Code Snippet */}
                {rec.code_snippet && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium">Code Example:</span>
                      <button
                        onClick={() => handleCopyCode(rec.code_snippet!)}
                        className="text-xs text-indigo-600 hover:text-indigo-800 transition-colors"
                      >
                        Copy
                      </button>
                    </div>
                    <pre className="text-xs font-mono bg-gray-900 text-gray-100 p-2 rounded overflow-x-auto">
                      {rec.code_snippet}
                    </pre>
                  </div>
                )}

                {/* Action Button */}
                {rec.action_type === 'replay' && rec.replay_params && (
                  <button
                    onClick={() => handleQuickFix(rec)}
                    disabled={isExecutingReplay}
                    className="mt-2 px-3 py-1 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isExecutingReplay ? 'Starting replay...' : 'Try This Fix'}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Additional Details (Collapsible) */}
      <details className="text-sm">
        <summary className="cursor-pointer text-indigo-600 hover:text-indigo-800 font-medium">
          View Error Details
        </summary>
        <div className="mt-2 p-3 bg-white bg-opacity-30 rounded">
          <dl className="space-y-1">
            {analysis.error_type && (
              <>
                <dt className="font-medium">Error Type:</dt>
                <dd className="font-mono text-xs ml-4">{analysis.error_type}</dd>
              </>
            )}
            {analysis.error_code && (
              <>
                <dt className="font-medium">Status Code:</dt>
                <dd className="font-mono text-xs ml-4">{analysis.error_code}</dd>
              </>
            )}
            {Object.keys(analysis.context).length > 0 && (
              <>
                <dt className="font-medium">Context:</dt>
                <dd className="ml-4">
                  <pre className="text-xs font-mono overflow-x-auto whitespace-pre-wrap">
                    {JSON.stringify(analysis.context, null, 2)}
                  </pre>
                </dd>
              </>
            )}
          </dl>
        </div>
      </details>
    </div>
  );
}

/**
 * Maps error category to human-readable title
 */
function getCategoryTitle(category: string): string {
  const titles: Record<string, string> = {
    rate_limit: 'Rate Limit Exceeded',
    auth_failure: 'Authentication Failed',
    token_limit: 'Token Limit Exceeded',
    model_not_found: 'Model Not Available',
    network_error: 'Network Connection Error',
    invalid_request: 'Invalid Request',
    service_error: 'Service Error',
    tool_error: 'Tool Execution Failed',
    retrieval_error: 'Retrieval Failed',
    unknown: 'Execution Error',
  };
  return titles[category] || 'Error';
}
