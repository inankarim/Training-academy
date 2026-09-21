import React from 'react';
import { Search, RotateCcw } from 'lucide-react';
import { UserListParams } from '../../types/auth.types';

interface UserFiltersProps {
  filters: UserListParams;
  onChange: (filters: UserListParams) => void;
  onReset: () => void;
  showRoleFilter?: boolean;
}

export const UserFilters: React.FC<UserFiltersProps> = ({
  filters,
  onChange,
  onReset,
  showRoleFilter = true,
}) => {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-surface-border bg-white p-4 shadow-card">
      {/* Search Input */}
      <div className="relative min-w-[240px] flex-1">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-ink-faint" />
        <input
          type="text"
          value={filters.search || ''}
          onChange={(e) => onChange({ ...filters, search: e.target.value, page: 1 })}
          placeholder="Search by name, email, or employee ID..."
          className="w-full rounded-md border border-surface-border bg-surface py-2 pl-9 pr-3 text-xs text-ink placeholder-ink-faint transition focus:border-accent focus:bg-white focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </div>

      {/* Role Filter */}
      {showRoleFilter && (
        <select
          value={filters.role || ''}
          onChange={(e) => onChange({ ...filters, role: e.target.value || undefined, page: 1 })}
          className="rounded-md border border-surface-border bg-surface px-3 py-2 text-xs font-medium text-ink transition focus:border-accent focus:bg-white focus:outline-none"
        >
          <option value="">All Roles</option>
          <option value="learner">Learner</option>
          <option value="content_creator">Content Creator</option>
          <option value="hr">HR</option>
          <option value="admin">Admin</option>
          <option value="super_admin">Super Admin</option>
        </select>
      )}

      {/* Status Filter */}
      <select
        value={filters.status || ''}
        onChange={(e) =>
          onChange({
            ...filters,
            status: (e.target.value as 'active' | 'deactivated') || undefined,
            page: 1,
          })
        }
        className="rounded-md border border-surface-border bg-surface px-3 py-2 text-xs font-medium text-ink transition focus:border-accent focus:bg-white focus:outline-none"
      >
        <option value="">All Statuses</option>
        <option value="active">Active</option>
        <option value="deactivated">Deactivated</option>
      </select>

      {/* Reset */}
      <button
        onClick={onReset}
        title="Reset Filters"
        className="flex items-center gap-1.5 rounded-md border border-surface-border px-3 py-2 text-xs font-medium text-ink-muted hover:border-ink hover:text-ink"
      >
        <RotateCcw className="h-3.5 w-3.5" />
        Reset
      </button>
    </div>
  );
};
