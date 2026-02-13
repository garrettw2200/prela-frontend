/**
 * Projects API client
 */

import { apiClient } from './client';

export interface Project {
  project_id: string;
  name: string;
  description: string;
  webhook_url: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectSummary extends Project {
  trace_count_24h: number;
  workflow_count: number;
}

export interface ProjectCreate {
  name: string;
  description?: string;
  project_id?: string; // Optional, auto-generated from name if not provided
}

export interface ProjectUpdate {
  name?: string;
  description?: string;
}

export interface WebhookStatus {
  project_id: string;
  status: 'active' | 'inactive';
  last_event: string | null;
  event_count_1h: number;
}

/**
 * List all projects with statistics
 */
export async function fetchProjects(limit = 100, offset = 0): Promise<ProjectSummary[]> {
  const response = await apiClient.get<ProjectSummary[]>(
    `/projects?limit=${limit}&offset=${offset}`
  );
  return response.data;
}

/**
 * Create a new project
 */
export async function createProject(project: ProjectCreate): Promise<Project> {
  const response = await apiClient.post<Project>('/projects', project);
  return response.data;
}

/**
 * Get project details
 */
export async function fetchProject(projectId: string): Promise<Project> {
  const response = await apiClient.get<Project>(`/projects/${projectId}`);
  return response.data;
}

/**
 * Update project
 */
export async function updateProject(
  projectId: string,
  update: ProjectUpdate
): Promise<Project> {
  const response = await apiClient.put<Project>(`/projects/${projectId}`, update);
  return response.data;
}

/**
 * Delete project
 */
export async function deleteProject(projectId: string): Promise<void> {
  await apiClient.delete(`/projects/${projectId}`);
}

/**
 * Get webhook receiver status for project
 */
export async function fetchWebhookStatus(projectId: string): Promise<WebhookStatus> {
  const response = await apiClient.get<WebhookStatus>(
    `/projects/${projectId}/webhook-status`
  );
  return response.data;
}
