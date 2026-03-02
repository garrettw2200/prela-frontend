import { apiClient } from './client';

export interface ApiKey {
  id: string;
  key_prefix: string;
  name: string;
  last_used_at: string | null;
  created_at: string;
  team_id: string | null;
  scope: 'personal' | 'team';
}

export interface CreateApiKeyRequest {
  name: string;
  team_id?: string;
}

export interface CreateApiKeyResponse {
  id: string;
  key: string; // Full key, only returned once
  key_prefix: string;
  name: string;
  team_id: string | null;
  scope: 'personal' | 'team';
  created_at: string;
}

/**
 * List API keys. Without teamId returns personal keys; with teamId returns team keys.
 */
export async function listApiKeys(teamId?: string): Promise<ApiKey[]> {
  const params = teamId ? { team_id: teamId } : undefined;
  const response = await apiClient.get<ApiKey[]>('/api-keys', { params });
  return response.data;
}

/**
 * Create a new API key.
 * Pass team_id to create a team-scoped key (requires admin/owner role).
 * IMPORTANT: The full key is only returned once. Store it securely.
 */
export async function createApiKey(request: CreateApiKeyRequest): Promise<CreateApiKeyResponse> {
  const response = await apiClient.post<CreateApiKeyResponse>('/api-keys', request);
  return response.data;
}

/**
 * Revoke (delete) an API key.
 * Pass teamId to revoke a team key (requires admin/owner role).
 */
export async function revokeApiKey(apiKeyId: string, teamId?: string): Promise<void> {
  const params = teamId ? { team_id: teamId } : undefined;
  await apiClient.delete(`/api-keys/${apiKeyId}`, { params });
}
