/**
 * Projects API client
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

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
  const response = await fetch(
    `${API_BASE_URL}/api/v1/projects?limit=${limit}&offset=${offset}`,
    {
      headers: {
        'X-API-Key': 'dev-key', // TODO: Implement proper auth
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch projects: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Create a new project
 */
export async function createProject(project: ProjectCreate): Promise<Project> {
  const response = await fetch(`${API_BASE_URL}/api/v1/projects`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': 'dev-key', // TODO: Implement proper auth
    },
    body: JSON.stringify(project),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || `Failed to create project: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get project details
 */
export async function fetchProject(projectId: string): Promise<Project> {
  const response = await fetch(`${API_BASE_URL}/api/v1/projects/${projectId}`, {
    headers: {
      'X-API-Key': 'dev-key', // TODO: Implement proper auth
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch project: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Update project
 */
export async function updateProject(
  projectId: string,
  update: ProjectUpdate
): Promise<Project> {
  const response = await fetch(`${API_BASE_URL}/api/v1/projects/${projectId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': 'dev-key', // TODO: Implement proper auth
    },
    body: JSON.stringify(update),
  });

  if (!response.ok) {
    throw new Error(`Failed to update project: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Delete project
 */
export async function deleteProject(projectId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/v1/projects/${projectId}`, {
    method: 'DELETE',
    headers: {
      'X-API-Key': 'dev-key', // TODO: Implement proper auth
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to delete project: ${response.statusText}`);
  }
}

/**
 * Get webhook receiver status for project
 */
export async function fetchWebhookStatus(projectId: string): Promise<WebhookStatus> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/projects/${projectId}/webhook-status`,
    {
      headers: {
        'X-API-Key': 'dev-key', // TODO: Implement proper auth
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch webhook status: ${response.statusText}`);
  }

  return response.json();
}
