import { apiClient } from './client';

export interface Trace {
  trace_id: string;
  project_id: string;
  service_name: string;
  started_at: string;
  completed_at: string | null;
  duration_ms: number;
  status: string;
  root_span_id: string;
  span_count: number;
  attributes: string;
  source: string;
  created_at: string;
}

export interface TracesResponse {
  traces: Trace[];
  count: number;
  limit: number;
}

export async function fetchTraces(
  projectId: string,
  options?: {
    agentName?: string;
    serviceName?: string;
    startTime?: string;
    endTime?: string;
    limit?: number;
  }
): Promise<TracesResponse> {
  const params = new URLSearchParams({ project_id: projectId });
  if (options?.agentName) params.set('agent_name', options.agentName);
  if (options?.serviceName) params.set('service_name', options.serviceName);
  if (options?.startTime) params.set('start_time', options.startTime);
  if (options?.endTime) params.set('end_time', options.endTime);
  if (options?.limit) params.set('limit', options.limit.toString());

  const response = await apiClient.get<TracesResponse>(`/traces?${params}`);
  return response.data;
}
