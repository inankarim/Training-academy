import { apiClient } from './apiClient';
import {
  ApiResponse,
  CreateUserInput,
  CreateUserResponse,
  PaginatedUsersResponse,
  UserListParams,
  UserSummary,
  OrgMetadata,
} from '../types/auth.types';

export async function listUsersApi(params: UserListParams = {}): Promise<PaginatedUsersResponse> {
  const { data } = await apiClient.get<ApiResponse<PaginatedUsersResponse>>('/users', {
    params,
  });
  if (!data.success || !data.data) {
    throw new Error(data.error?.message || 'Failed to fetch users');
  }
  return data.data;
}

export async function createUserApi(input: CreateUserInput): Promise<CreateUserResponse> {
  const { data } = await apiClient.post<ApiResponse<CreateUserResponse>>('/users', input);
  if (!data.success || !data.data) {
    throw new Error(data.error?.message || 'Failed to create user');
  }
  return data.data;
}

export async function getUserApi(id: string): Promise<UserSummary> {
  const { data } = await apiClient.get<ApiResponse<{ user: UserSummary }>>(`/users/${id}`);
  if (!data.success || !data.data?.user) {
    throw new Error(data.error?.message || 'Failed to get user details');
  }
  return data.data.user;
}

export async function updateUserApi(id: string, input: Partial<CreateUserInput>): Promise<UserSummary> {
  const { data } = await apiClient.put<ApiResponse<{ user: UserSummary }>>(`/users/${id}`, input);
  if (!data.success || !data.data?.user) {
    throw new Error(data.error?.message || 'Failed to update user');
  }
  return data.data.user;
}

export async function deactivateUserApi(id: string): Promise<void> {
  const { data } = await apiClient.post<ApiResponse<{ message: string }>>(`/users/${id}/deactivate`);
  if (!data.success) {
    throw new Error(data.error?.message || 'Failed to deactivate user');
  }
}

export async function reactivateUserApi(id: string): Promise<void> {
  const { data } = await apiClient.post<ApiResponse<{ message: string }>>(`/users/${id}/reactivate`);
  if (!data.success) {
    throw new Error(data.error?.message || 'Failed to reactivate user');
  }
}

export async function getOrgMetadataApi(): Promise<OrgMetadata> {
  const { data } = await apiClient.get<ApiResponse<OrgMetadata>>('/users/meta/organizational');
  if (!data.success || !data.data) {
    throw new Error(data.error?.message || 'Failed to fetch organizational metadata');
  }
  return data.data;
}
