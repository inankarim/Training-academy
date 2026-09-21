import { apiClient } from './apiClient';

export type DependencyStatus = 'up' | 'down' | 'not_configured_yet';

export interface HealthResponse {
  success: boolean;
  service: string;
  env: string;
  timestamp: string;
  dependencies: {
    postgres: DependencyStatus;
    mongodb: DependencyStatus;
    redis: DependencyStatus;
  };
}

export async function fetchHealth(): Promise<HealthResponse> {
  const { data } = await apiClient.get<HealthResponse>('/health');
  return data;
}
