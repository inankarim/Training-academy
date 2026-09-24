import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ThemeToggle } from '../components/shared/ThemeToggle';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  Activity,
  LogOut,
  Shield,
  BookOpen,
  ClipboardList,
} from 'lucide-react';
import clsx from 'clsx';

export const StaffLayout: React.FC = () => {
  const { user, logout, hasPermission } = useAuth();
  const navigate = useNavigate();

  const canViewUsers = hasPermission('users.view') || user?.role === 'super_admin';
  const canCreateUsers = hasPermission('users.create') || user?.role === 'super_admin';
  // Course Builder is exclusively for content_creator on the backend (see
  // courses.routes.ts's requireContentCreatorRole) — the nav link mirrors that.
  const isContentCreator = user?.role === 'content_creator';
  // Assignments is exclusively for hr on the backend (see assignments.routes.ts's requireHrRole).
  const isHr = user?.role === 'hr';

  return (
    <div className="flex min-h-screen bg-surface font-sans text-ink">
      {/* Dark Sidebar */}
      <aside className="flex w-64 flex-col border-r border-charcoal-border bg-charcoal text-white">
        {/* Logo & Header */}
        <div className="flex h-16 items-center gap-3 border-b border-charcoal-border px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-accent font-bold text-white shadow-sm">
            H
          </div>
          <div>
            <span className="text-sm font-bold tracking-tight text-white">HOLCIM</span>
            <span className="ml-1 text-[11px] font-semibold uppercase tracking-wider text-accent">Staff</span>
          </div>
        </div>

        {/* User Role Tag */}
        <div className="border-b border-charcoal-border/70 px-6 py-4">
          <p className="truncate text-xs font-semibold text-white">{user?.fullName}</p>
          <div className="mt-1.5 flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 rounded bg-accent/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent">
              <Shield className="h-3 w-3" />
              {user?.role.replace('_', ' ')}
            </span>
            {user?.designation && (
              <span className="truncate text-[11px] text-white/50">{user.designation}</span>
            )}
          </div>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          <NavLink
            to="/staff/dashboard"
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 rounded-md px-3 py-2 text-xs font-medium transition',
                isActive
                  ? 'bg-charcoal-soft font-semibold text-white shadow-sm'
                  : 'text-white/70 hover:bg-charcoal-soft/50 hover:text-white',
              )
            }
          >
            <LayoutDashboard className="h-4 w-4 text-accent" />
            Dashboard
          </NavLink>

          {isContentCreator && (
            <NavLink
              to="/staff/courses"
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-xs font-medium transition',
                  isActive
                    ? 'bg-charcoal-soft font-semibold text-white shadow-sm'
                    : 'text-white/70 hover:bg-charcoal-soft/50 hover:text-white',
                )
              }
            >
              <BookOpen className="h-4 w-4 text-accent" />
              Courses
            </NavLink>
          )}

          {isHr && (
            <NavLink
              to="/staff/assignments"
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-xs font-medium transition',
                  isActive
                    ? 'bg-charcoal-soft font-semibold text-white shadow-sm'
                    : 'text-white/70 hover:bg-charcoal-soft/50 hover:text-white',
                )
              }
            >
              <ClipboardList className="h-4 w-4 text-accent" />
              Assignments
            </NavLink>
          )}

          {canViewUsers && (
            <NavLink
              to="/staff/users"
              end
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-xs font-medium transition',
                  isActive
                    ? 'bg-charcoal-soft font-semibold text-white shadow-sm'
                    : 'text-white/70 hover:bg-charcoal-soft/50 hover:text-white',
                )
              }
            >
              <Users className="h-4 w-4 text-accent" />
              User Management
            </NavLink>
          )}

          {canCreateUsers && (
            <NavLink
              to="/staff/users/create"
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-xs font-medium transition',
                  isActive
                    ? 'bg-charcoal-soft font-semibold text-white shadow-sm'
                    : 'text-white/70 hover:bg-charcoal-soft/50 hover:text-white',
                )
              }
            >
              <UserPlus className="h-4 w-4 text-accent" />
              Add New User
            </NavLink>
          )}

          <NavLink
            to="/system-status"
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 rounded-md px-3 py-2 text-xs font-medium transition',
                isActive
                  ? 'bg-charcoal-soft font-semibold text-white shadow-sm'
                  : 'text-white/70 hover:bg-charcoal-soft/50 hover:text-white',
              )
            }
          >
            <Activity className="h-4 w-4 text-white/40" />
            System Status
          </NavLink>
        </nav>

        {/* Bottom logout area */}
        <div className="border-t border-charcoal-border p-3">
          <button
            onClick={() => logout()}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-xs font-medium text-white/60 transition hover:bg-status-danger/20 hover:text-status-danger"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center justify-between border-b border-surface-border bg-surface-card px-8">
          <div>
            <h1 className="text-sm font-semibold uppercase tracking-wider text-ink-muted">
              Holcim Management Portal
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle variant="light-chrome" />
            <button
              onClick={() => navigate('/learner/dashboard')}
              className="rounded border border-surface-border px-3 py-1.5 text-xs font-medium text-ink-muted hover:border-ink hover:text-ink"
            >
              Switch to Learner View
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-surface p-8">
          <div className="mx-auto max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
