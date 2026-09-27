import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import { getLearnerDashboardApi } from '../services/learner.service';
import { ThemeToggle } from '../components/shared/ThemeToggle';
import { NotificationBell } from '../components/shared/NotificationBell';
import {
  BookOpen,
  Award,
  Flame,
  Zap,
  LogOut,
  ShieldCheck,
  Activity,
  GraduationCap,
} from 'lucide-react';
import clsx from 'clsx';

export const LearnerLayout: React.FC = () => {
  const { user, logout, isStaff } = useAuth();
  const navigate = useNavigate();

  const { data: dashboard } = useQuery({
    queryKey: ['learner-dashboard'],
    queryFn: getLearnerDashboardApi,
    staleTime: 30_000,
  });

  return (
    <div className="flex min-h-screen flex-col bg-surface font-sans text-ink">
      {/* Top Navbar */}
      <header className="sticky top-0 z-20 border-b border-surface-border bg-surface-card px-6">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between">
          <div className="flex items-center gap-8">
            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded bg-accent font-bold text-white shadow-sm">
                H
              </div>
              <div>
                <span className="text-base font-bold tracking-tight text-ink">HOLCIM</span>
                <span className="ml-1 text-xs font-semibold uppercase tracking-wider text-accent">Academy</span>
              </div>
            </div>

            {/* Nav links */}
            <nav className="hidden items-center gap-1 md:flex">
              <NavLink
                to="/learner/dashboard"
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition',
                    isActive ? 'bg-accent/10 font-semibold text-accent' : 'text-ink-muted hover:text-ink',
                  )
                }
              >
                <BookOpen className="h-4 w-4" />
                My Training
              </NavLink>

              <NavLink
                to="/learner/courses"
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition',
                    isActive ? 'bg-accent/10 font-semibold text-accent' : 'text-ink-muted hover:text-ink',
                  )
                }
              >
                <GraduationCap className="h-4 w-4" />
                Courses
              </NavLink>

              <NavLink
                to="/system-status"
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition',
                    isActive ? 'bg-accent/10 font-semibold text-accent' : 'text-ink-muted hover:text-ink',
                  )
                }
              >
                <Activity className="h-4 w-4" />
                System Health
              </NavLink>
            </nav>
          </div>

          {/* User Gamification Bar & Profile */}
          <div className="flex items-center gap-4">
            {/* Streak & XP preview pill */}
            <div className="hidden items-center gap-3 rounded-full border border-surface-border bg-surface px-3 py-1 text-xs sm:flex">
              <div className="flex items-center gap-1 font-semibold text-amber-600">
                <Flame className="h-3.5 w-3.5" />
                <span>{dashboard?.currentStreak ?? 0} Streak</span>
              </div>
              <span className="text-surface-border">|</span>
              <div className="flex items-center gap-1 font-semibold text-accent">
                <Zap className="h-3.5 w-3.5" />
                <span>{dashboard?.totalXp ?? 0} XP</span>
              </div>
              <span className="text-surface-border">|</span>
              <div className="flex items-center gap-1 text-ink-muted">
                <Award className="h-3.5 w-3.5" />
                <span>Lvl {dashboard?.level ?? 1}</span>
              </div>
            </div>

            {/* Switch to staff portal if user is an HR/Admin */}
            {isStaff && (
              <button
                onClick={() => navigate('/staff/dashboard')}
                className="hidden items-center gap-1 rounded border border-accent/30 bg-accent/5 px-2.5 py-1 text-xs font-semibold text-accent hover:bg-accent/10 sm:flex"
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                Staff View
              </button>
            )}

            <NotificationBell notificationsPath="/learner/notifications" />

            <ThemeToggle variant="light-chrome" />

            {/* User pill */}
            <div className="flex items-center gap-2">
              <div className="text-right">
                <p className="text-xs font-semibold text-ink">{user?.fullName}</p>
                <p className="text-[10px] text-ink-muted">{user?.designation || user?.role}</p>
              </div>
              <button
                onClick={() => logout()}
                title="Sign out"
                className="rounded p-1.5 text-ink-muted hover:bg-status-dangerSubtle hover:text-status-danger"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
        <Outlet />
      </main>

      <footer className="border-t border-surface-border bg-surface-card py-4 text-center text-xs text-ink-faint">
        Holcim Academy &copy; {new Date().getFullYear()} — Enterprise Learning & Gamification Platform
      </footer>
    </div>
  );
};
