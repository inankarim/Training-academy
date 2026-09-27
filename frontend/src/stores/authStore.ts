import { create } from 'zustand';
import { AuthenticatedUser } from '../types/auth.types';

interface AuthState {
  user: AuthenticatedUser | null;
  accessToken: string | null;
  permissions: string[];
  isAuthenticated: boolean;
  isInitializing: boolean;
  isFirstLogin: boolean;
  setAuth: (payload: { user: AuthenticatedUser; accessToken: string; permissions: string[]; isFirstLogin?: boolean }) => void;
  setAccessToken: (token: string) => void;
  updateUser: (patch: Partial<AuthenticatedUser>) => void;
  clearAuth: () => void;
  setInitializing: (val: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  permissions: [],
  isAuthenticated: false,
  isInitializing: true,
  isFirstLogin: false,

  setAuth: ({ user, accessToken, permissions, isFirstLogin }) =>
    set({
      user,
      accessToken,
      permissions,
      isAuthenticated: true,
      isInitializing: false,
      isFirstLogin: isFirstLogin ?? false,
    }),

  setAccessToken: (accessToken) => set({ accessToken }),

  updateUser: (patch) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...patch } : null,
    })),

  clearAuth: () =>
    set({
      user: null,
      accessToken: null,
      permissions: [],
      isAuthenticated: false,
      isInitializing: false,
      isFirstLogin: false,
    }),

  setInitializing: (val) => set({ isInitializing: val }),
}));
