/**
 * Debug Panel Component
 *
 * Inline component that provides "Debug This Trace" functionality.
 * Triggers LLM-powered analysis on click, displays root cause,
 * explanation, fix suggestions, and execution timeline.
 */

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import {
  triggerDebugAnalysis,
  type DebugAnalysis,
} from '../../api/debug';

const PRO_TIERS = ['pro', 'enterprise'];

interface DebugPanelProps {
  projectId: string;
  traceId: string;
}

export default function DebugPanel({ projectId, traceId }: DebugPanelProps) {
  const { user } = useAuth();
  const userTier = user?.tier || 'free';

  if (!PRO_TIERS.includes(userTier)) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 text-center">
        <p className="text-sm text-gray-500 mb-2">Debug Agent requires the Pro plan ($79/month)</p>
        <a href="/billing" className="text-sm font-medium text-blue-600 hover:text-blue-700">
          Upgrade to Pro
        </a>
      </div>
    );
  }
  const [showTimeline, setShowTimeline] = useState(false);
  const [analysis, setAnalysis] = useState<DebugAnalysis | null>(null);

  const mutation = useMutation({
    mutationFn: (force: boolean) => triggerDebugAnalysis(projectId, traceId, force),
    onSuccess: (data) => setAnalysis(data),
  });

  const handleDebug = (force: boolean = false) => {
    mutation.mutate(force);
  };

  // Not yet triggered — show button
  if (!analysis && !mutation.isPending && !mutation.isError) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100">
              <svg className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Debug This Trace</h3>
              <p className="text-sm text-gray-500">AI-powered analysis of what happened</p>
            </div>
          </div>
          <button
            onClick={() => handleDebug(false)}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Analyze
          </button>
        </div>
      </div>
    );
  }

  // Loading
  if (mutation.isPending) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="flex items-center space-x-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
          <span className="text-sm text-gray-600">Running debug analysis...</span>
        </div>
      </div>
    );
  }

  // Error
  if (mutation.isError && !analysis) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <svg className="mt-0.5 h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-red-800">Debug analysis failed</p>
              <p className="mt-1 text-sm text-red-700">
                {mutation.error instanceof Error ? mutation.error.message : 'An unexpected error occurred'}
              </p>
            </div>
          </div>
          <button
            onClick={() => handleDebug(false)}
            className="text-sm font-medium text-red-700 hover:text-red-800 underline"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Results
  if (!analysis) return null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <h3 className="text-lg font-semibold text-gray-900">Debug Analysis</h3>
          <span className="text-xs text-gray-500">
            Confidence: {(analysis.confidence_score * 100).toFixed(0)}%
          </span>
          {analysis.cached && (
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
              cached
            </span>
          )}
        </div>
        <button
          onClick={() => handleDebug(true)}
          disabled={mutation.isPending}
          className="text-sm font-medium text-indigo-600 hover:text-indigo-700 disabled:opacity-50"
        >
          {mutation.isPending ? 'Analyzing...' : 'Re-analyze'}
        </button>
      </div>

      {/* Root Cause */}
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <h4 className="text-sm font-medium text-red-800">Root Cause</h4>
        <p className="mt-1 text-sm text-red-700">{analysis.root_cause}</p>
      </div>

      {/* Explanation */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <h4 className="text-sm font-medium text-gray-800">What Happened</h4>
        <p className="mt-1 text-sm text-gray-700">{analysis.explanation}</p>
      </div>

      {/* Fix Suggestions */}
      {analysis.fix_suggestions.length > 0 && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <h4 className="text-sm font-medium text-green-800">Suggested Fixes</h4>
          <ol className="mt-2 list-decimal space-y-1 pl-5">
            {analysis.fix_suggestions.map((suggestion, idx) => (
              <li key={idx} className="text-sm text-green-700">{suggestion}</li>
            ))}
          </ol>
        </div>
      )}

      {/* Failure Chain */}
      {analysis.failure_chain.length > 0 && (
        <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
          <h4 className="text-sm font-medium text-orange-800">Failure Chain</h4>
          <div className="mt-2 space-y-2">
            {analysis.failure_chain.map((entry, idx) => (
              <div key={idx} className="flex items-start space-x-2">
                <span className={`mt-0.5 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full text-xs font-bold ${
                  entry.is_root_cause
                    ? 'bg-red-200 text-red-800'
                    : 'bg-orange-200 text-orange-800'
                }`}>
                  {entry.is_root_cause ? '!' : idx + 1}
                </span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {entry.name}
                    <span className="ml-1 text-xs text-gray-500">({entry.span_type})</span>
                  </p>
                  <p className="text-xs text-gray-600">{entry.error_message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Execution Timeline (collapsible) */}
      {analysis.execution_timeline.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white">
          <button
            className="flex w-full items-center justify-between p-4 hover:bg-gray-50"
            onClick={() => setShowTimeline(!showTimeline)}
          >
            <h4 className="text-sm font-medium text-gray-800">
              Execution Timeline ({analysis.execution_timeline.length} spans)
            </h4>
            <svg
              className={`h-5 w-5 text-gray-400 transition-transform ${showTimeline ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {showTimeline && (
            <div className="border-t border-gray-200 p-4">
              <div className="max-h-60 space-y-1 overflow-y-auto">
                {analysis.execution_timeline.map((entry, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center justify-between rounded px-3 py-1.5 text-xs ${
                      entry.status === 'error' ? 'bg-red-50' : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <span className={`h-2 w-2 rounded-full ${
                        entry.status === 'error' ? 'bg-red-500' : 'bg-green-500'
                      }`} />
                      <span className="font-medium text-gray-900">{entry.name}</span>
                      <span className="text-gray-500">({entry.span_type})</span>
                    </div>
                    <span className="text-gray-500">{entry.duration_ms.toFixed(0)}ms</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
