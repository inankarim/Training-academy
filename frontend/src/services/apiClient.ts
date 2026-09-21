import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { config } from '@config/env';
import { useAuthStore } from '../stores/authStore';

export const apiClient = axios.create({
  baseURL: config.apiBaseUrl,
  timeout: 10000,
  withCredentials: true,
});

// Attach JWT access token to every outgoing request
apiClient.interceptors.request.use((req: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().accessToken;
  if (token && req.headers) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: Error | null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

// Handle 401 errors by silently refreshing the session once
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ error?: { message?: string } }>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // If it's a 401 and not already retried and not the login/refresh endpoint itself
    const isAuthEndpoint =
      originalRequest?.url?.includes('/auth/login') ||
      originalRequest?.url?.includes('/auth/refresh') ||
      originalRequest?.url?.includes('/auth/logout');

    if (error.response?.status === 401 && !originalRequest?._retry && !isAuthEndpoint) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => apiClient(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post(
          `${config.apiBaseUrl}/auth/refresh`,
          {},
          { withCredentials: true },
        );

        if (data.success && data.data?.accessToken) {
          useAuthStore.getState().setAuth({
            user: data.data.user,
            accessToken: data.data.accessToken,
            permissions: data.data.permissions,
          });

          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${data.data.accessToken}`;
          }

          processQueue(null);
          return apiClient(originalRequest);
        }
      } catch (refreshErr) {
        processQueue(refreshErr as Error);
        useAuthStore.getState().clearAuth();
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    const message =
      error.response?.data?.error?.message || error.message || 'An unexpected error occurred';
    return Promise.reject(new Error(message));
  },
);
