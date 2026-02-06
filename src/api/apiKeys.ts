import { apiClient } from './client';

export interface ApiKey {
  id: string;
  key_prefix: string;
  name: string;
  last_used_at: string | null;
  created_at: string;
}

export interface CreateApiKeyRequest {
  name: string;
}

export interface CreateApiKeyResponse {
  id: string;
  key: string; // Full key, only returned once
  key_prefix: string;
  name: string;
  created_at: string;
}

/**
 * List all API keys for the current user.
 * Returns keys with prefix only (not full key).
 */
export async function listApiKeys(): Promise<ApiKey[]> {
  const response = await apiClient.get<ApiKey[]>('/api-keys');
  return response.data;
}

/**
 * Create a new API key.
 * IMPORTANT: The full key is only returned once. Store it securely.
 */
export async function createApiKey(request: CreateApiKeyRequest): Promise<CreateApiKeyResponse> {
  const response = await apiClient.post<CreateApiKeyResponse>('/api-keys', request);
  return response.data;
}

/**
 * Revoke (delete) an API key.
 */
export async function revokeApiKey(apiKeyId: string): Promise<void> {
  await apiClient.delete(`/api-keys/${apiKeyId}`);
}
