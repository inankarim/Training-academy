import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { loginApi, logoutApi } from '../services/auth.service';
import { UserRole } from '../types/auth.types';

export function useAuth() {
  const navigate = useNavigate();
  const {
    user,
    accessToken,
    permissions,
    isAuthenticated,
    isInitializing,
    setAuth,
    clearAuth,
    updateUser,
  } = useAuthStore();

  const login = useCallback(
    async (email: string, pass: string) => {
      const data = await loginApi(email, pass);
      setAuth(data);
      return data;
    },
    [setAuth],
  );

  const logout = useCallback(async () => {
    try {
      await logoutApi();
    } catch {
      // Ignore logout errors
    } finally {
      clearAuth();
      navigate('/login');
    }
  }, [clearAuth, navigate]);

  const hasRole = useCallback(
    (...roles: UserRole[]) => {
      if (!user) return false;
      return roles.includes(user.role);
    },
    [user],
  );

  const hasPermission = useCallback(
    (permissionKey: string) => {
      if (!permissions) return false;
      return permissions.includes(permissionKey);
    },
    [permissions],
  );

  const isStaff = Boolean(user && ['super_admin', 'admin', 'hr', 'content_creator'].includes(user.role));
  const isLearner = Boolean(user && user.role === 'learner');

  return {
    user,
    accessToken,
    permissions,
    isAuthenticated,
    isInitializing,
    login,
    logout,
    hasRole,
    hasPermission,
    isStaff,
    isLearner,
    updateUser,
  };
}
