import React from 'react';
import { UserSummary } from '../../types/auth.types';
import { Shield, UserX, UserCheck, Clock } from 'lucide-react';
import clsx from 'clsx';

interface UserTableProps {
  users: UserSummary[];
  isLoading: boolean;
  onToggleStatus: (user: UserSummary) => void;
  canDeactivate: boolean;
  currentUserId?: string;
}

export const UserTable: React.FC<UserTableProps> = ({
  users,
  isLoading,
  onToggleStatus,
  canDeactivate,
  currentUserId,
}) => {
  if (isLoading) {
    return (
      <div className="overflow-hidden rounded-lg border border-surface-border bg-white shadow-card">
        <div className="p-8 text-center text-xs text-ink-muted">
          <div className="mx-auto mb-2 h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          Loading users from database...
        </div>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="overflow-hidden rounded-lg border border-surface-border bg-white p-12 text-center shadow-card">
        <Shield className="mx-auto h-8 w-8 text-ink-faint" />
        <h3 className="mt-3 text-sm font-bold text-ink">No users found</h3>
        <p className="mt-1 text-xs text-ink-muted">
          Try adjusting your search criteria or filters, or onboard a new employee.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-surface-border bg-white shadow-card">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-ink">
          <thead className="border-b border-surface-border bg-surface font-semibold uppercase tracking-wider text-ink-muted">
            <tr>
              <th className="px-5 py-3.5">Employee Name & Email</th>
              <th className="px-5 py-3.5">Role</th>
              <th className="px-5 py-3.5">Designation</th>
              <th className="px-5 py-3.5">Status</th>
              <th className="px-5 py-3.5">Last Login</th>
              {canDeactivate && <th className="px-5 py-3.5 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border">
            {users.map((user) => {
              const isSelf = user.id === currentUserId;
              const isSuperAdmin = user.role === 'super_admin';

              return (
                <tr key={user.id} className="transition hover:bg-surface/50">
                  <td className="px-5 py-4">
                    <div className="font-semibold text-ink">{user.fullName}</div>
                    <div className="text-[11px] text-ink-muted">{user.email}</div>
                    {user.employeeId && (
                      <div className="font-mono text-[10px] text-ink-faint">ID: {user.employeeId}</div>
                    )}
                  </td>

                  <td className="px-5 py-4">
                    <span className="inline-flex items-center rounded bg-accent/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-accent">
                      {user.role.replace('_', ' ')}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-ink-muted">
                    {user.designation || '—'}
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={clsx(
                        'inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-[11px] font-semibold',
                        user.status === 'active'
                          ? 'bg-status-successSubtle text-status-success'
                          : 'bg-status-dangerSubtle text-status-danger',
                      )}
                    >
                      <span
                        className={clsx(
                          'h-1.5 w-1.5 rounded-full',
                          user.status === 'active' ? 'bg-status-success' : 'bg-status-danger',
                        )}
                      />
                      {user.status.toUpperCase()}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-[11px] text-ink-muted">
                    {user.lastLoginAt ? (
                      new Date(user.lastLoginAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })
                    ) : (
                      <span className="flex items-center gap-1 text-amber-600">
                        <Clock className="h-3 w-3" /> Never logged in
                      </span>
                    )}
                  </td>

                  {canDeactivate && (
                    <td className="px-5 py-4 text-right">
                      {!isSelf && !isSuperAdmin && (
                        <button
                          onClick={() => onToggleStatus(user)}
                          title={user.status === 'active' ? 'Deactivate user account' : 'Reactivate user account'}
                          className={clsx(
                            'inline-flex items-center gap-1 rounded border px-2.5 py-1 text-[11px] font-semibold transition',
                            user.status === 'active'
                              ? 'border-status-danger/30 text-status-danger hover:bg-status-dangerSubtle'
                              : 'border-status-success/30 text-status-success hover:bg-status-successSubtle',
                          )}
                        >
                          {user.status === 'active' ? (
                            <>
                              <UserX className="h-3.5 w-3.5" /> Deactivate
                            </>
                          ) : (
                            <>
                              <UserCheck className="h-3.5 w-3.5" /> Reactivate
                            </>
                          )}
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
