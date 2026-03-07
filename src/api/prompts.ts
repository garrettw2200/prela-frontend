/**
 * Prompts API Client
 *
 * Interfaces with the backend prompt management endpoints to:
 * - CRUD prompt templates with versioning
 * - View version history
 * - Promote versions to deployment stages
 */

import { apiClient } from './client';

// Type Definitions

export interface PromptTemplate {
  prompt_id: string;
  name: string;
  template: string;
  version: number;
  model: string | null;
  tags: string[];
  metadata: string;
  change_note: string;
  promoted_stages: string[];
  created_at: string;
}

export interface CreatePromptRequest {
  name: string;
  template: string;
  model?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
  change_note?: string;
}

export interface UpdatePromptRequest {
  template: string;
  model?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
  change_note?: string;
}

export interface PromotePromptRequest {
  version: number;
  stage?: string;
}

// API Functions

export async function listPrompts(projectId: string, tag?: string, name?: string) {
  const params: Record<string, string> = {};
  if (tag) params.tag = tag;
  if (name) params.name = name;
  const response = await apiClient.get(`/prompts/projects/${projectId}/prompts`, { params });
  return response.data as { prompts: PromptTemplate[]; count: number };
}

export async function getPrompt(projectId: string, promptName: string, version?: number, stage?: string) {
  const params: Record<string, string | number> = {};
  if (version) params.version = version;
  if (stage) params.stage = stage;
  const response = await apiClient.get(`/prompts/projects/${projectId}/prompts/${promptName}`, { params });
  return response.data as PromptTemplate;
}

export async function getPromptHistory(projectId: string, promptName: string) {
  const response = await apiClient.get(`/prompts/projects/${projectId}/prompts/${promptName}/history`);
  return response.data as { name: string; versions: PromptTemplate[]; count: number };
}

export async function createPrompt(projectId: string, request: CreatePromptRequest) {
  const response = await apiClient.post(`/prompts/projects/${projectId}/prompts`, request);
  return response.data;
}

export async function createPromptVersion(projectId: string, promptName: string, request: UpdatePromptRequest) {
  const response = await apiClient.put(`/prompts/projects/${projectId}/prompts/${promptName}`, request);
  return response.data;
}

export async function promotePrompt(projectId: string, promptName: string, request: PromotePromptRequest) {
  const response = await apiClient.post(`/prompts/projects/${projectId}/prompts/${promptName}/promote`, request);
  return response.data;
}

export async function deletePrompt(projectId: string, promptName: string, version?: number) {
  const params: Record<string, number> = {};
  if (version) params.version = version;
  const response = await apiClient.delete(`/prompts/projects/${projectId}/prompts/${promptName}`, { params });
  return response.data;
}
