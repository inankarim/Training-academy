import { apiClient } from './apiClient';
import { ApiResponse } from '../types/auth.types';
import { PaginatedNotifications, SendCustomMessageInput } from '../types/notifications.types';

const BASE = '/notifications';

function unwrap<T>(data: ApiResponse<T>, fallback: string): T {
  if (!data.success || !data.data) {
    throw new Error(data.error?.message || fallback);
  }
  return data.data;
}

export async function listNotificationsApi(page = 1, pageSize = 20): Promise<PaginatedNotifications> {
  const { data } = await apiClient.get<ApiResponse<PaginatedNotifications>>(BASE, { params: { page, pageSize } });
  return unwrap(data, 'Failed to fetch notifications');
}

export async function getUnreadCountApi(): Promise<number> {
  const { data } = await apiClient.get<ApiResponse<{ count: number }>>(`${BASE}/unread-count`);
  return unwrap(data, 'Failed to fetch unread count').count;
}

export async function markNotificationReadApi(id: string): Promise<void> {
  const { data } = await apiClient.post<ApiResponse<{ message: string }>>(`${BASE}/${id}/read`);
  unwrap(data, 'Failed to mark notification as read');
}

export async function markAllNotificationsReadApi(): Promise<void> {
  const { data } = await apiClient.post<ApiResponse<{ message: string }>>(`${BASE}/read-all`);
  unwrap(data, 'Failed to mark all notifications as read');
}

export async function sendCustomMessageApi(input: SendCustomMessageInput): Promise<{ createdCount: number }> {
  const { data } = await apiClient.post<ApiResponse<{ createdCount: number }>>(`${BASE}/custom`, input);
  return unwrap(data, 'Failed to send message');
}
