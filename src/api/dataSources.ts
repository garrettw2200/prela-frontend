import { apiClient } from './client';

export interface DataSource {
  id: string;
  user_id: string;
  project_id: string;
  type: 'langfuse';
  name: string;
  config: {
    host: string;
    public_key: string;
  };
  status: 'active' | 'error' | 'paused';
  error_message: string | null;
  last_sync_at: string | null;
  created_at: string | null;
}

export interface CreateDataSourceRequest {
  type: 'langfuse';
  name: string;
  project_id: string;
  config: {
    host: string;
    public_key: string;
    secret_key: string;
  };
}

export interface TestConnectionRequest {
  type: 'langfuse';
  config: {
    host: string;
    public_key: string;
    secret_key: string;
  };
}

export interface SyncResult {
  traces_imported: number;
  spans_imported: number;
  success: boolean;
}

/**
 * List all data sources for the current user.
 */
export async function listDataSources(): Promise<DataSource[]> {
  const response = await apiClient.get<DataSource[]>('/data-sources');
  return response.data;
}

/**
 * Create a new data source connection.
 * Validates the connection before saving.
 */
export async function createDataSource(request: CreateDataSourceRequest): Promise<DataSource> {
  const response = await apiClient.post<DataSource>('/data-sources', request);
  return response.data;
}

/**
 * Delete a data source connection.
 */
export async function deleteDataSource(sourceId: string): Promise<void> {
  await apiClient.delete(`/data-sources/${sourceId}`);
}

/**
 * Trigger a manual sync for a data source.
 */
export async function triggerSync(sourceId: string): Promise<SyncResult> {
  const response = await apiClient.post<SyncResult>(`/data-sources/${sourceId}/sync`);
  return response.data;
}

/**
 * Test a data source connection without saving.
 */
export async function testConnection(request: TestConnectionRequest): Promise<{ success: boolean; message: string }> {
  const response = await apiClient.post<{ success: boolean; message: string }>('/data-sources/test-connection', request);
  return response.data;
}
