import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { listLearningPathsApi } from '../../services/learner.service';
import { getLearnerDashboardApi } from '../../services/learner.service';
import { LearningPathSummary } from '../../types/learner.types';
import { Route as RouteIcon, Clock, Zap, Award, Target, Sparkles } from 'lucide-react';
import clsx from 'clsx';

type FilterTab = 'all' | 'assigned' | 'in_progress' | 'completed';

function pathStatus(p: LearningPathSummary): FilterTab {
  if (p.pathProgress >= 100) return 'completed';
  if (p.pathProgress > 0) return 'in_progress';
  return 'assigned';
}

const TAB_LABEL: Record<FilterTab, string> = {
  all: 'All',
  assigned: 'Assigned',
  in_progress: 'In Progress',
  completed: 'Completed',
};

export const LearningPathsPage: React.FC = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<FilterTab>('all');

  const { data: paths = [], isLoading } = useQuery({
    queryKey: ['learning-paths'],
    queryFn: listLearningPathsApi,
  });

  const { data: dashboard } = useQuery({
    queryKey: ['learner-dashboard'],
    queryFn: getLearnerDashboardApi,
  });

  const filtered = useMemo(
    () => (tab === 'all' ? paths : paths.filter((p) => pathStatus(p) === tab)),
    [paths, tab],
  );

  const levelPct = dashboard
    ? Math.round((dashboard.xpIntoLevel / Math.max(1, dashboard.xpForNextLevel)) * 100)
    : 0;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px]">
      <div className="space-y-5">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint">
            Dashboard &bull; Learning Categories
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink">Choose Your Learning Path</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Select a category to start building your technical expertise and career growth.
          </p>
        </div>

        {/* Filter pills */}
        <div className="flex flex-wrap items-center gap-2">
          {(['all', 'assigned', 'in_progress', 'completed'] as FilterTab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={clsx(
                'rounded-full px-3.5 py-1.5 text-xs font-semibold transition',
                tab === t ? 'bg-accent text-white' : 'border border-surface-border bg-white text-ink-muted hover:border-ink',
              )}
            >
              {TAB_LABEL[t]}
            </button>
          ))}
          <button
            disabled
            title="Coming soon"
            className="rounded-full border border-surface-border bg-white px-3.5 py-1.5 text-xs font-semibold text-ink-faint opacity-60"
          >
            Recommended
          </button>
        </div>

        {isLoading && <p className="text-xs text-ink-faint">Loading your learning paths...</p>}

        {!isLoading && paths.length === 0 && (
          <div className="rounded-lg border border-dashed border-surface-border bg-white p-10 text-center">
            <RouteIcon className="mx-auto mb-3 h-8 w-8 text-ink-faint" />
            <p className="text-sm font-semibold text-ink">No courses assigned yet</p>
            <p className="mt-1 text-xs text-ink-muted">
              Your HR team hasn&apos;t assigned any training courses to you. Check back soon.
            </p>
          </div>
        )}

        {!isLoading && paths.length > 0 && filtered.length === 0 && (
          <p className="py-6 text-center text-xs text-ink-faint">No paths match this filter.</p>
        )}

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {filtered.map((p) => {
            const status = pathStatus(p);
            return (
              <div
                key={p.learningPath}
                className="flex flex-col justify-between rounded-lg border border-surface-border bg-white p-5 shadow-card transition hover:border-accent"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10 text-accent">
                      <RouteIcon className="h-4.5 w-4.5" />
                    </div>
                    <span
                      className={clsx(
                        'rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider',
                        status === 'completed' && 'bg-status-success/10 text-status-success',
                        status === 'in_progress' && 'bg-amber-500/10 text-amber-700',
                        status === 'assigned' && 'bg-blue-500/10 text-blue-700',
                      )}
                    >
                      {TAB_LABEL[status]}
                    </span>
                  </div>
                  <h3 className="mt-3 text-base font-bold text-ink">{p.learningPath}</h3>
                  <p className="mt-1 text-xs text-ink-muted">
                    {p.courseCount} course{p.courseCount === 1 ? '' : 's'} assigned to you in this learning path.
                  </p>

                  <div className="mt-4 flex items-center gap-4 text-xs text-ink-muted">
                    <span className="flex items-center gap-1.5">
                      <RouteIcon className="h-3.5 w-3.5" /> {p.courseCount} Courses
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" /> {p.totalDurationHours}h
                    </span>
                    <span className="flex items-center gap-1.5 font-semibold text-accent">
                      <Zap className="h-3.5 w-3.5" /> {p.totalXpReward} XP
                    </span>
                  </div>

                  <div className="mt-3">
                    <div className="flex justify-between text-[11px] font-medium text-ink-muted">
                      <span>Path Progress</span>
                      <span>{p.pathProgress}%</span>
                    </div>
                    <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-surface">
                      <div
                        className="h-full rounded-full bg-accent transition-all duration-500"
                        style={{ width: `${p.pathProgress}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-end border-t border-surface-border pt-4">
                  <button
                    onClick={() => navigate(`/learner/paths/${encodeURIComponent(p.learningPath)}`)}
                    className="rounded-md bg-charcoal px-4 py-2 text-xs font-semibold text-white transition hover:bg-charcoal-soft"
                  >
                    Explore Path
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right sidebar */}
      <div className="space-y-4">
        <div className="rounded-lg bg-charcoal p-5 text-white shadow-card">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-white/50">Current Standing</p>
          <p className="mt-1 text-2xl font-bold">Lvl {dashboard?.level ?? 1}</p>
          <p className="text-xs font-medium text-accent">{dashboard?.levelTitle ?? 'Rookie'}</p>
          <div className="mt-4">
            <div className="flex justify-between text-[11px] text-white/60">
              <span>
                {dashboard?.xpIntoLevel ?? 0} / {dashboard?.xpForNextLevel ?? 300} XP
              </span>
              <span>Next Level</span>
            </div>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-accent" style={{ width: `${Math.min(100, levelPct)}%` }} />
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 border-t border-white/10 pt-4 text-center">
            <div>
              <p className="text-sm font-bold">{dashboard?.lessonsCompletedCount ?? 0}</p>
              <p className="text-[10px] text-white/50">Lessons Done</p>
            </div>
            <div>
              <p className="text-sm font-bold">{dashboard?.coursesCompletedCount ?? 0}</p>
              <p className="text-[10px] text-white/50">Courses Done</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-surface-border bg-white p-4 shadow-card opacity-70">
          <div className="flex items-center gap-2 text-ink-muted">
            <Target className="h-4 w-4" />
            <h3 className="text-xs font-bold">Weekly Goal Progress</h3>
          </div>
          <p className="mt-2 text-[11px] text-ink-faint">Coming soon.</p>
        </div>

        <div className="rounded-lg border border-surface-border bg-white p-4 shadow-card opacity-70">
          <div className="flex items-center gap-2 text-ink-muted">
            <Award className="h-4 w-4" />
            <h3 className="text-xs font-bold">Recent Badges</h3>
          </div>
          <p className="mt-2 text-[11px] text-ink-faint">Coming soon.</p>
        </div>

        <div className="rounded-lg border border-surface-border bg-white p-4 shadow-card opacity-70">
          <div className="flex items-center gap-2 text-ink-muted">
            <Sparkles className="h-4 w-4" />
            <h3 className="text-xs font-bold">Leaderboard</h3>
          </div>
          <p className="mt-2 text-[11px] text-ink-faint">Coming soon.</p>
        </div>
      </div>
    </div>
  );
};
