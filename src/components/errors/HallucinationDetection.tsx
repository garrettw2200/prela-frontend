/**
 * Hallucination Detection Component
 *
 * Displays hallucination analysis for LLM outputs with:
 * - Color-coded claim highlighting (grounded/ungrounded)
 * - Confidence scores
 * - Supporting context references
 * - Collapsible details
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  fetchHallucinationAnalysis,
} from '../../api/errors';

interface HallucinationDetectionProps {
  projectId: string;
  traceId: string;
  similarityThreshold?: number;
}

export default function HallucinationDetection({
  projectId,
  traceId,
  similarityThreshold = 0.7,
}: HallucinationDetectionProps) {
  const [expandedSpans, setExpandedSpans] = useState<Set<string>>(new Set());
  const [, setSelectedClaim] = useState<{
    spanId: string;
    claimIndex: number;
  } | null>(null);

  const { data: analyses, isLoading, error } = useQuery({
    queryKey: ['hallucination-analysis', projectId, traceId, similarityThreshold],
    queryFn: () => fetchHallucinationAnalysis(projectId, traceId, similarityThreshold),
    retry: false,
  });

  const toggleSpan = (spanId: string) => {
    const newExpanded = new Set(expandedSpans);
    if (newExpanded.has(spanId)) {
      newExpanded.delete(spanId);
    } else {
      newExpanded.add(spanId);
    }
    setExpandedSpans(newExpanded);
  };

  if (isLoading) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="flex items-center space-x-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
          <span className="text-sm text-gray-600">Analyzing for hallucinations...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
        <div className="flex items-start space-x-3">
          <svg
            className="h-5 w-5 text-yellow-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div className="flex-1">
            <p className="text-sm font-medium text-yellow-800">
              No hallucination analysis available
            </p>
            <p className="mt-1 text-sm text-yellow-700">
              {error instanceof Error ? error.message : 'LLM spans need retrieval context for hallucination detection'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!analyses || analyses.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Hallucination Detection
        </h3>
        <div className="flex items-center space-x-2 text-xs text-gray-500">
          <span>Threshold: {similarityThreshold.toFixed(2)}</span>
          {analyses[0]?.encoder_available ? (
            <span className="rounded-full bg-green-100 px-2 py-1 text-green-700">
              ✓ AI-powered
            </span>
          ) : (
            <span className="rounded-full bg-gray-100 px-2 py-1 text-gray-600">
              Text-based
            </span>
          )}
        </div>
      </div>

      {analyses.map((analysis) => (
        <div
          key={analysis.span_id}
          className="rounded-lg border border-gray-200 bg-white"
        >
          {/* Span Header */}
          <div
            className="flex cursor-pointer items-center justify-between border-b border-gray-200 p-4 hover:bg-gray-50"
            onClick={() => toggleSpan(analysis.span_id)}
          >
            <div className="flex items-center space-x-3">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full ${
                  analysis.hallucination_detected
                    ? 'bg-red-100 text-red-600'
                    : 'bg-green-100 text-green-600'
                }`}
              >
                {analysis.hallucination_detected ? (
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {analysis.hallucination_detected ? 'Hallucination Detected' : 'All Claims Grounded'}
                </p>
                <p className="text-xs text-gray-500">
                  {analysis.grounded_claim_count} grounded, {analysis.ungrounded_claim_count} ungrounded
                  {' • '}
                  Confidence: {(analysis.overall_confidence * 100).toFixed(0)}%
                </p>
              </div>
            </div>

            <svg
              className={`h-5 w-5 text-gray-400 transition-transform ${
                expandedSpans.has(analysis.span_id) ? 'rotate-180' : ''
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>

          {/* Expanded Content */}
          {expandedSpans.has(analysis.span_id) && (
            <div className="p-4 space-y-4">
              {/* Annotated Output */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">LLM Output (Annotated)</h4>
                <div className="rounded-md bg-gray-50 p-3 text-sm">
                  {analysis.claims.map((claimGrounding, idx) => (
                    <span
                      key={idx}
                      className={`cursor-pointer rounded px-1 ${
                        claimGrounding.is_grounded
                          ? 'bg-green-100 text-green-900 hover:bg-green-200'
                          : 'bg-red-100 text-red-900 hover:bg-red-200'
                      }`}
                      onClick={() => setSelectedClaim({ spanId: analysis.span_id, claimIndex: idx })}
                      title={`${claimGrounding.is_grounded ? 'Grounded' : 'Ungrounded'} (${(claimGrounding.confidence * 100).toFixed(0)}%)`}
                    >
                      {claimGrounding.claim.text}
                    </span>
                  ))}
                </div>
              </div>

              {/* Claim Details */}
              {analysis.claims.map((claimGrounding, idx) => (
                <div
                  key={idx}
                  className={`rounded-lg border p-3 ${
                    claimGrounding.is_grounded
                      ? 'border-green-200 bg-green-50'
                      : 'border-red-200 bg-red-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className={`text-xs font-medium ${
                          claimGrounding.is_grounded ? 'text-green-700' : 'text-red-700'
                        }`}>
                          {claimGrounding.is_grounded ? '✓ Grounded' : '✗ Ungrounded'}
                        </span>
                        <span className="text-xs text-gray-500">
                          Similarity: {(claimGrounding.similarity_score * 100).toFixed(0)}%
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-gray-900">{claimGrounding.claim.text}</p>
                      {claimGrounding.supporting_context && (
                        <div className="mt-2">
                          <p className="text-xs font-medium text-gray-600">Supporting Context:</p>
                          <p className="mt-1 text-xs text-gray-700 bg-white rounded p-2 border border-gray-200">
                            {claimGrounding.supporting_context.length > 200
                              ? claimGrounding.supporting_context.substring(0, 200) + '...'
                              : claimGrounding.supporting_context}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Context Chunks */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Retrieved Context ({analysis.context_chunks.length} chunks)
                </h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {analysis.context_chunks.map((chunk, idx) => (
                    <div key={idx} className="rounded-md bg-gray-50 p-3 text-xs text-gray-700 border border-gray-200">
                      <span className="font-medium text-gray-500">Chunk {idx + 1}:</span> {chunk.substring(0, 150)}
                      {chunk.length > 150 && '...'}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
