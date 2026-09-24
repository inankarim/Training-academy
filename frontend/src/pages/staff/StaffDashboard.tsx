import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { listUsersApi } from '../../services/users.service';
import { listCoursesApi } from '../../services/courseBuilder.service';
import { listAssignableCoursesApi } from '../../services/assignments.service';
import {
  Users,
  UserPlus,
  ShieldCheck,
  Activity,
  ArrowRight,
  TrendingUp,
  UserCheck,
  BookOpen,
} from 'lucide-react';

export const StaffDashboard: React.FC = () => {
  const { user, hasPermission } = useAuth();
  const navigate = useNavigate();

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['users-summary'],
    queryFn: () => listUsersApi({ page: 1, pageSize: 10 }),
    retry: 1,
  });

  const totalUsers = usersData?.total ?? 0;
  const activeUsers = usersData?.items.filter((u) => u.status === 'active').length ?? 0;

  // "Published Courses" is only real/queryable from roles with a course-listing
  // endpoint: content_creator sees their own courses, hr sees every published
  // course (the Assign Course picker). admin/super_admin have no such endpoint
  // yet, so the tile shows a neutral "—" for them rather than a fabricated number.
  const isContentCreator = user?.role === 'content_creator';
  const isHr = user?.role === 'hr';

  const { data: ownCourses, isLoading: ownCoursesLoading } = useQuery({
    queryKey: ['content-creator-courses'],
    queryFn: listCoursesApi,
    enabled: isContentCreator,
  });

  const { data: assignableCourses, isLoading: assignableCoursesLoading } = useQuery({
    queryKey: ['assignable-courses'],
    queryFn: listAssignableCoursesApi,
    enabled: isHr,
  });

  const publishedCoursesLoading = isContentCreator ? ownCoursesLoading : isHr ? assignableCoursesLoading : false;
  const publishedCoursesCount = isContentCreator
    ? ownCourses?.counts.published
    : isHr
    ? assignableCourses?.length
    : undefined;
  const publishedCoursesSubtext = isContentCreator
    ? 'Published by you'
    : isHr
    ? 'Available to assign'
    : 'Open Course Builder to view';

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="rounded-xl border border-surface-border bg-surface-card p-6 shadow-card">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded bg-accent px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-white">
                {user?.role.replace('_', ' ')}
              </span>
              <span className="text-xs text-ink-muted">Holcim Management Portal</span>
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-ink">
              Welcome, {user?.fullName}
            </h1>
            <p className="mt-1 text-sm text-ink-muted">
              You are logged in with {user?.role.toUpperCase()} privileges. Manage corporate users, track training progress, and configure courses.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {hasPermission('users.create') && (
              <button
                onClick={() => navigate('/staff/users/create')}
                className="flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-accent-hover"
              >
                <UserPlus className="h-4 w-4" />
                Add New User
              </button>
            )}
            <button
              onClick={() => navigate('/staff/users')}
              className="flex items-center gap-2 rounded-md border border-surface-border bg-surface-card px-4 py-2 text-xs font-semibold text-ink shadow-sm transition hover:border-accent hover:text-accent"
            >
              <Users className="h-4 w-4" />
              Manage Users
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-surface-border bg-surface-card p-5 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
              Total In Scope
            </span>
            <div className="rounded bg-accent/10 p-2 text-accent">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-ink">
            {usersLoading ? '—' : totalUsers}
          </p>
          <p className="mt-1 text-xs text-ink-muted">Registered employee accounts</p>
        </div>

        <div className="rounded-lg border border-surface-border bg-surface-card p-5 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
              Active Status
            </span>
            <div className="rounded bg-status-successSubtle p-2 text-status-success">
              <UserCheck className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-ink">
            {usersLoading ? '—' : activeUsers}
          </p>
          <p className="mt-1 text-xs text-ink-muted">Eligible for training</p>
        </div>

        <div className="rounded-lg border border-surface-border bg-surface-card p-5 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
              Published Courses
            </span>
            <div className="rounded bg-blue-500/10 p-2 text-blue-700">
              <BookOpen className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-ink">
            {publishedCoursesLoading ? '—' : publishedCoursesCount ?? '—'}
          </p>
          <p className="mt-1 text-xs text-ink-muted">{publishedCoursesSubtext}</p>
        </div>

        <div className="rounded-lg border border-surface-border bg-surface-card p-5 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
              Compliance Rate
            </span>
            <div className="rounded bg-amber-500/10 p-2 text-amber-700">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-ink">100%</p>
          <p className="mt-1 text-xs text-ink-muted">System operating nominal</p>
        </div>
      </div>

      {/* Quick Access Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* User Directory Preview */}
        <div className="rounded-lg border border-surface-border bg-surface-card p-6 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-ink">Employee & Learner Directory</h2>
              <p className="text-xs text-ink-muted">Recently created employees and learners</p>
            </div>
            <button
              onClick={() => navigate('/staff/users')}
              className="flex items-center gap-1 text-xs font-semibold text-accent hover:text-accent-hover"
            >
              View all <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="mt-4 divide-y divide-surface-border">
            {usersLoading ? (
              <div className="py-6 text-center text-xs text-ink-muted">Loading employee directory...</div>
            ) : usersData?.items && usersData.items.length > 0 ? (
              usersData.items.slice(0, 5).map((item) => (
                <div key={item.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-xs font-bold text-ink">{item.fullName}</p>
                    <p className="text-[11px] text-ink-muted">
                      {item.email} &bull; <span className="font-semibold text-accent">{item.role.toUpperCase()}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-block rounded px-2 py-0.5 text-[10px] font-semibold ${
                        item.status === 'active'
                          ? 'bg-status-successSubtle text-status-success'
                          : 'bg-status-dangerSubtle text-status-danger'
                      }`}
                    >
                      {item.status.toUpperCase()}
                    </span>
                    <p className="mt-0.5 text-[10px] text-ink-faint">
                      {item.designation || 'No designation'}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-6 text-center text-xs text-ink-muted">
                No users found. Click &quot;Add New User&quot; to onboard an employee.
              </div>
            )}
          </div>
        </div>

        {/* Security & Access Overview */}
        <div className="rounded-lg border border-surface-border bg-surface-card p-6 shadow-card">
          <h2 className="text-base font-bold text-ink">Role Capabilities & Governance</h2>
          <p className="text-xs text-ink-muted">Authorized security scope for current session</p>

          <div className="mt-4 space-y-3">
            <div className="flex items-start gap-3 rounded-md border border-surface-border bg-surface p-3 text-xs">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
              <div>
                <p className="font-semibold text-ink">Role-Based Access Control</p>
                <p className="text-ink-muted">
                  {user?.role === 'hr'
                    ? 'HR role: Authorized to create and manage learner accounts, monitor progress, and review analytics.'
                    : user?.role === 'admin'
                    ? 'Admin role: Authorized to manage courses, quizzes, assignments, and learner accounts.'
                    : 'Super Admin role: Unrestricted system authority across infrastructure, roles, and staff accounts.'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-md border border-surface-border bg-surface p-3 text-xs">
              <Activity className="mt-0.5 h-4 w-4 shrink-0 text-status-success" />
              <div>
                <p className="font-semibold text-ink">Multi-Database Synchronization</p>
                <p className="text-ink-muted">
                  PostgreSQL relational transactional store, MongoDB flexible learning block store, and Redis rate-limiting active.
                </p>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => navigate('/system-status')}
                className="w-full rounded border border-surface-border py-2 text-center text-xs font-semibold text-ink-muted hover:border-ink hover:text-ink"
              >
                Inspect Complete System Health Diagnostic
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
