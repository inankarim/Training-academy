import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { UserRole } from '../../types/auth.types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  requiredPermission?: string;
  redirectToLoginPath?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  requiredPermission,
  redirectToLoginPath = '/login',
}) => {
  const location = useLocation();
  const { isAuthenticated, user, permissions, isInitializing } = useAuthStore();

  if (isInitializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          <p className="text-sm font-medium text-ink-muted">Authenticating Holcim Academy...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to={redirectToLoginPath} state={{ from: location }} replace />;
  }

  // Force password change if required
  if (user.mustChangePassword && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // If not allowed for this route, bounce them to their default dashboard
    if (user.role === 'learner') {
      return <Navigate to="/learner/dashboard" replace />;
    }
    return <Navigate to="/staff/dashboard" replace />;
  }

  if (requiredPermission && !permissions.includes(requiredPermission)) {
    if (user.role === 'learner') {
      return <Navigate to="/learner/dashboard" replace />;
    }
    return <Navigate to="/staff/dashboard" replace />;
  }

  return <>{children}</>;
};
