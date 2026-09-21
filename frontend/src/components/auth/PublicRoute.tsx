import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

interface PublicRouteProps {
  children: React.ReactNode;
}

export const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const { isAuthenticated, user, isInitializing } = useAuthStore();

  if (isInitializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          <p className="text-sm font-medium text-ink-muted">Loading...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated && user) {
    if (user.mustChangePassword) {
      return <Navigate to="/change-password" replace />;
    }
    if (user.role === 'learner') {
      return <Navigate to="/learner/dashboard" replace />;
    }
    return <Navigate to="/staff/dashboard" replace />;
  }

  return <>{children}</>;
};
