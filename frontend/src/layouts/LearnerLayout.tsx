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
  UserRound,
} from 'lucide-react';
import clsx from 'clsx';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  clsx(
    'flex shrink-0 items-center gap-2 whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition',
    isActive ? 'bg-accent/10 font-semibold text-accent' : 'text-ink-muted hover:text-ink',
  );

export const LearnerLayout: React.FC = () => {
  const { user, logout, isStaff } = useAuth();
  const navigate = useNavigate();
  const isSuperAdmin = user?.role === 'super_admin';

  const { data: dashboard } = useQuery({
    queryKey: ['learner-dashboard'],
    queryFn: getLearnerDashboardApi,
    staleTime: 30_000,
  });

  const navLinks = (
    <>
      <NavLink to="/learner/dashboard" className={navLinkClass}>
        <BookOpen className="h-4 w-4" />
        My Training
      </NavLink>
      <NavLink to="/learner/courses" className={navLinkClass}>
        <GraduationCap className="h-4 w-4" />
        Courses
      </NavLink>
      <NavLink to="/learner/profile" className={navLinkClass}>
        <UserRound className="h-4 w-4" />
        Profile
      </NavLink>
      {isSuperAdmin && (
        <NavLink to="/system-status" className={navLinkClass}>
          <Activity className="h-4 w-4" />
          System Health
        </NavLink>
      )}
    </>
  );

  // compact = icons + numbers only, so it fits the top bar on small screens.
  const statsPill = (compact: boolean) => (
    <div
      className={clsx(
        'flex items-center rounded-full border border-surface-border bg-surface text-xs',
        compact ? 'gap-2 px-2.5 py-1' : 'gap-3 px-3 py-1',
      )}
    >
      <div className="flex items-center gap-1 whitespace-nowrap font-semibold text-amber-600" title="Day streak">
        <Flame className="h-3.5 w-3.5" />
        <span>{dashboard?.currentStreak ?? 0}{!compact && ' Streak'}</span>
      </div>
      <span className="text-surface-border">|</span>
      <div className="flex items-center gap-1 whitespace-nowrap font-semibold text-accent" title="Total XP">
        <Zap className="h-3.5 w-3.5" />
        <span>{dashboard?.totalXp ?? 0}{!compact && ' XP'}</span>
      </div>
      <span className="text-surface-border">|</span>
      <div className="flex items-center gap-1 whitespace-nowrap text-ink-muted" title="Level">
        <Award className="h-3.5 w-3.5" />
        <span>{compact ? dashboard?.level ?? 1 : `Lvl ${dashboard?.level ?? 1}`}</span>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col bg-surface font-sans text-ink">
      {/* Top Navbar */}
      <header className="sticky top-0 z-20 border-b border-surface-border bg-surface-card px-4 sm:px-6">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 sm:h-16">
          <div className="flex min-w-0 items-center gap-8">
            {/* Logo */}
            <div className="flex shrink-0 items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded bg-accent font-bold text-white shadow-sm">
                H
              </div>
              <div className="hidden sm:block">
                <span className="text-base font-bold tracking-tight text-ink">HOLCIM</span>
                <span className="ml-1 text-xs font-semibold uppercase tracking-wider text-accent">Academy</span>
              </div>
            </div>

            <nav className="hidden items-center gap-1 lg:flex">{navLinks}</nav>
          </div>

          {/* User Gamification Bar & Profile */}
          <div className="flex shrink-0 items-center gap-2 sm:gap-4">
            <div className="xl:hidden">{statsPill(true)}</div>
            <div className="hidden xl:block">{statsPill(false)}</div>

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

            <div className="hidden sm:block">
              <ThemeToggle variant="light-chrome" />
            </div>

            {/* User pill */}
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                onClick={() => navigate('/learner/profile')}
                title="My profile"
                className="flex items-center gap-2 rounded-md px-1 py-0.5 text-right hover:bg-surface"
              >
                <div className="hidden md:block">
                  <p className="max-w-[140px] truncate text-xs font-semibold text-ink">{user?.fullName}</p>
                  <p className="max-w-[140px] truncate text-[10px] text-ink-muted">{user?.designation || user?.role}</p>
                </div>
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt="" className="h-8 w-8 rounded-full border border-surface-border object-cover" />
                ) : (
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/10 text-[11px] font-bold text-accent">
                    {user?.fullName
                      .split(' ')
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((p) => p[0]?.toUpperCase())
                      .join('')}
                  </span>
                )}
              </button>
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

        {/* Below lg the nav won't fit in the top bar — it gets its own row. */}
        <nav className="-mx-4 flex items-center justify-around gap-1 overflow-x-auto border-t border-surface-border px-2 py-1.5 sm:-mx-6 sm:justify-start sm:px-6 lg:hidden">
          {navLinks}
        </nav>
      </header>

      {/* Main Content */}
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        <Outlet />
      </main>

      <footer className="border-t border-surface-border bg-surface-card py-4 text-center text-xs text-ink-faint">
        Holcim Academy &copy; {new Date().getFullYear()} — Enterprise Learning & Gamification Platform
      </footer>
    </div>
  );
};
