/**
 * Error Analysis API Client
 *
 * Provides TypeScript types and API functions for fetching
 * actionable error analysis from traces.
 */

// Type Definitions

export type ErrorCategory =
  | 'rate_limit'
  | 'auth_failure'
  | 'token_limit'
  | 'model_not_found'
  | 'network_error'
  | 'invalid_request'
  | 'service_error'
  | 'tool_error'
  | 'retrieval_error'
  | 'unknown';

export type ErrorSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface ErrorRecommendation {
  title: string;
  description: string;
  action_type: 'replay' | 'code_change' | 'config_change';
  replay_params: Record<string, any> | null;
  code_snippet: string | null;
  confidence: number;
  estimated_cost_impact: string | null;
}

export interface ErrorAnalysis {
  category: ErrorCategory;
  severity: ErrorSeverity;
  error_type: string | null;
  error_message: string;
  error_code: number | null;
  recommendations: ErrorRecommendation[];
  context: Record<string, any>;
}

export interface SpanError {
  span_id: string;
  span_name: string;
  analysis: ErrorAnalysis;
}

export interface TraceErrorAnalysis {
  trace_id: string;
  error_count: number;
  errors: SpanError[];
  has_critical_errors: boolean;
}

export interface ErrorExplanation {
  why_it_happened: string;
  what_to_do: string;
  related_patterns: string[];
  estimated_fix_time: string;
}

export interface ErrorExplanationFull {
  trace_id: string;
  span_id: string;
  analysis: ErrorAnalysis;
  explanation: ErrorExplanation;
}

// Hallucination Detection Types

export interface Claim {
  text: string;
  sentence_index: number;
  start_char: number;
  end_char: number;
}

export interface ClaimGrounding {
  claim: Claim;
  is_grounded: boolean;
  confidence: number;
  similarity_score: number;
  supporting_context: string | null;
  context_index: number | null;
}

export interface HallucinationAnalysis {
  trace_id: string;
  span_id: string;
  output_text: string;
  context_chunks: string[];
  claims: ClaimGrounding[];
  hallucination_detected: boolean;
  overall_confidence: number;
  ungrounded_claim_count: number;
  grounded_claim_count: number;
  similarity_threshold: number;
  encoder_available: boolean;
}

// API Functions

/**
 * Fetches error analysis for a specific trace.
 *
 * @param projectId - The project identifier
 * @param traceId - The trace identifier
 * @returns Promise resolving to trace error analysis with recommendations
 * @throws Error if the request fails or no errors are found
 */
export async function fetchTraceErrorAnalysis(
  projectId: string,
  traceId: string
): Promise<TraceErrorAnalysis> {
  const response = await fetch(
    `/api/v1/traces/${traceId}/error-analysis?project_id=${projectId}`
  );

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('No errors found in this trace');
    }
    throw new Error(`Failed to fetch error analysis: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetches AI-powered error explanation for a specific span.
 *
 * @param projectId - The project identifier
 * @param traceId - The trace identifier
 * @param spanId - The span identifier with error
 * @returns Promise resolving to error analysis with AI explanation
 * @throws Error if the request fails or span not found
 */
export async function fetchErrorExplanation(
  projectId: string,
  traceId: string,
  spanId: string
): Promise<ErrorExplanationFull> {
  const response = await fetch(
    `/api/v1/traces/${traceId}/error-explanation?span_id=${spanId}&project_id=${projectId}`
  );

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Error span not found');
    }
    throw new Error(`Failed to fetch error explanation: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetches hallucination analysis for a trace.
 *
 * Analyzes LLM outputs against retrieved context to detect unsupported claims.
 *
 * @param projectId - The project identifier
 * @param traceId - The trace identifier
 * @param similarityThreshold - Minimum similarity to consider grounded (0.0-1.0, default: 0.7)
 * @returns Promise resolving to list of hallucination analyses for each LLM span
 * @throws Error if the request fails or no LLM spans with context found
 */
export async function fetchHallucinationAnalysis(
  projectId: string,
  traceId: string,
  similarityThreshold: number = 0.7
): Promise<HallucinationAnalysis[]> {
  const response = await fetch(
    `/api/v1/traces/${traceId}/hallucination-analysis?project_id=${projectId}&similarity_threshold=${similarityThreshold}`
  );

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('No LLM spans with retrieval context found in this trace');
    }
    throw new Error(`Failed to fetch hallucination analysis: ${response.statusText}`);
  }

  return response.json();
}
