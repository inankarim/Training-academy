import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { listUsersApi, deactivateUserApi, reactivateUserApi } from '../../services/users.service';
import { UserFilters } from '../../components/users/UserFilters';
import { UserTable } from '../../components/users/UserTable';
import { UserListParams, UserSummary } from '../../types/auth.types';
import { UserPlus, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';

export const UserListPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, hasPermission } = useAuth();
  const queryClient = useQueryClient();

  const [filters, setFilters] = useState<UserListParams>({
    page: 1,
    pageSize: 15,
  });
  const [actionError, setActionError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['users', filters],
    queryFn: () => listUsersApi(filters),
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async (targetUser: UserSummary) => {
      setActionError(null);
      if (targetUser.status === 'active') {
        await deactivateUserApi(targetUser.id);
      } else {
        await reactivateUserApi(targetUser.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['users-summary'] });
    },
    onError: (err: unknown) => {
      setActionError(err instanceof Error ? err.message : 'Action failed');
    },
  });

  const handleToggleStatus = (targetUser: UserSummary) => {
    const actionText = targetUser.status === 'active' ? 'deactivate' : 'reactivate';
    if (window.confirm(`Are you sure you want to ${actionText} ${targetUser.fullName}?`)) {
      toggleStatusMutation.mutate(targetUser);
    }
  };

  const handleResetFilters = () => {
    setFilters({ page: 1, pageSize: 15 });
  };

  const canCreate = hasPermission('users.create') || user?.role === 'super_admin';
  const canDeactivate = hasPermission('users.deactivate') || user?.role === 'super_admin';
  const isSuperAdminOrAdmin = user?.role === 'super_admin' || user?.role === 'admin';

  const totalPages = data?.totalPages || 1;
  const currentPage = filters.page || 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-ink">User & Employee Management</h1>
          <p className="mt-1 text-xs text-ink-muted">
            Directory of employees, sales officers, technical managers, and system staff.
          </p>
        </div>

        {canCreate && (
          <button
            onClick={() => navigate('/staff/users/create')}
            className="flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-accent-hover"
          >
            <UserPlus className="h-4 w-4" />
            Add New User
          </button>
        )}
      </div>

      {actionError && (
        <div className="flex items-center gap-2.5 rounded-lg border border-status-danger/30 bg-status-dangerSubtle p-3.5 text-xs text-status-danger">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Filters */}
      <UserFilters
        filters={filters}
        onChange={setFilters}
        onReset={handleResetFilters}
        showRoleFilter={isSuperAdminOrAdmin}
      />

      {/* User Table */}
      <UserTable
        users={data?.items || []}
        isLoading={isLoading}
        onToggleStatus={handleToggleStatus}
        canDeactivate={canDeactivate}
        currentUserId={user?.id}
      />

      {/* Pagination */}
      {data && data.total > 0 && (
        <div className="flex items-center justify-between px-2 text-xs text-ink-muted">
          <p>
            Showing <span className="font-semibold text-ink">{(currentPage - 1) * 15 + 1}</span> to{' '}
            <span className="font-semibold text-ink">
              {Math.min(currentPage * 15, data.total)}
            </span>{' '}
            of <span className="font-semibold text-ink">{data.total}</span> users
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilters((prev) => ({ ...prev, page: Math.max(1, (prev.page || 1) - 1) }))}
              disabled={currentPage <= 1}
              className="flex items-center gap-1 rounded border border-surface-border bg-white px-2.5 py-1.5 font-medium hover:border-ink disabled:opacity-40"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Previous
            </button>
            <span className="px-2 font-medium text-ink">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setFilters((prev) => ({ ...prev, page: Math.min(totalPages, (prev.page || 1) + 1) }))}
              disabled={currentPage >= totalPages}
              className="flex items-center gap-1 rounded border border-surface-border bg-white px-2.5 py-1.5 font-medium hover:border-ink disabled:opacity-40"
            >
              Next <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
