/**
 * Trace comments API client
 */

import { apiClient } from './client';

// --- Types ---

export interface TraceComment {
  id: string;
  trace_id: string;
  project_id: string;
  user_id: string;
  content: string;
  parent_comment_id: string | null;
  email: string | null;
  full_name: string | null;
  profile_image_url: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface CreateCommentRequest {
  content: string;
  parent_comment_id?: string;
}

export interface UpdateCommentRequest {
  content: string;
}

// --- API Functions ---

/**
 * List all comments on a trace
 */
export async function fetchTraceComments(
  traceId: string,
  projectId: string
): Promise<TraceComment[]> {
  const response = await apiClient.get<TraceComment[]>(
    `/traces/${traceId}/comments?project_id=${encodeURIComponent(projectId)}`
  );
  return response.data;
}

/**
 * Create a comment on a trace
 */
export async function createTraceComment(
  traceId: string,
  projectId: string,
  request: CreateCommentRequest
): Promise<TraceComment> {
  const response = await apiClient.post<TraceComment>(
    `/traces/${traceId}/comments?project_id=${encodeURIComponent(projectId)}`,
    request
  );
  return response.data;
}

/**
 * Update a comment
 */
export async function updateTraceComment(
  commentId: string,
  request: UpdateCommentRequest
): Promise<TraceComment> {
  const response = await apiClient.put<TraceComment>(
    `/comments/${commentId}`,
    request
  );
  return response.data;
}

/**
 * Delete a comment
 */
export async function deleteTraceComment(commentId: string): Promise<void> {
  await apiClient.delete(`/comments/${commentId}`);
}
