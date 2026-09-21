import { apiClient } from './apiClient';
import { ApiResponse, AuthResponseData, AuthenticatedUser } from '../types/auth.types';

export async function loginApi(email: string, password: string): Promise<AuthResponseData> {
  const { data } = await apiClient.post<ApiResponse<AuthResponseData>>('/auth/login', {
    email,
    password,
  });
  if (!data.success || !data.data) {
    throw new Error(data.error?.message || 'Login failed');
  }
  return data.data;
}

export async function refreshApi(): Promise<AuthResponseData> {
  const { data } = await apiClient.post<ApiResponse<AuthResponseData>>('/auth/refresh');
  if (!data.success || !data.data) {
    throw new Error(data.error?.message || 'Failed to refresh session');
  }
  return data.data;
}

export async function logoutApi(): Promise<void> {
  await apiClient.post<ApiResponse<{ message: string }>>('/auth/logout');
}

export async function getMeApi(): Promise<{ user: AuthenticatedUser; permissions: string[] }> {
  const { data } = await apiClient.get<ApiResponse<{ user: AuthenticatedUser; permissions: string[] }>>('/auth/me');
  if (!data.success || !data.data) {
    throw new Error(data.error?.message || 'Failed to load user profile');
  }
  return data.data;
}

export async function changePasswordApi(currentPassword: string, newPassword: string): Promise<void> {
  const { data } = await apiClient.post<ApiResponse<{ message: string }>>('/auth/change-password', {
    currentPassword,
    newPassword,
  });
  if (!data.success) {
    throw new Error(data.error?.message || 'Failed to update password');
  }
}
