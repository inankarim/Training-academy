import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { listMyCoursesApi, getLearnerDashboardApi } from '../../services/learner.service';
import { LearnerCourseSummary } from '../../types/learner.types';
import { BookOpen, Clock, Zap, Award, Target, Sparkles, CheckCircle2, PlayCircle } from 'lucide-react';
import clsx from 'clsx';

type FilterTab = 'all' | 'assigned' | 'in_progress' | 'completed';

const TAB_LABEL: Record<FilterTab, string> = {
  all: 'All',
  assigned: 'Assigned',
  in_progress: 'In Progress',
  completed: 'Completed',
};

export const CoursesPage: React.FC = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<FilterTab>('all');

  const { data: courses = [], isLoading } = useQuery({
    queryKey: ['learner-courses'],
    queryFn: listMyCoursesApi,
  });

  const { data: dashboard } = useQuery({
    queryKey: ['learner-dashboard'],
    queryFn: getLearnerDashboardApi,
  });

  const filtered = useMemo(
    () => (tab === 'all' ? courses : courses.filter((c) => c.assignmentStatus === tab)),
    [courses, tab],
  );

  const levelPct = dashboard
    ? Math.round((dashboard.xpIntoLevel / Math.max(1, dashboard.xpForNextLevel)) * 100)
    : 0;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px]">
      <div className="space-y-5">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint">Dashboard</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink">My Courses</h1>
          <p className="mt-1 text-sm text-ink-muted">Courses your HR team has assigned to you.</p>
        </div>

        {/* Filter pills */}
        <div className="flex flex-wrap items-center gap-2">
          {(['all', 'assigned', 'in_progress', 'completed'] as FilterTab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={clsx(
                'rounded-full px-3.5 py-1.5 text-xs font-semibold transition',
                tab === t ? 'bg-accent text-white' : 'border border-surface-border bg-surface-card text-ink-muted hover:border-ink',
              )}
            >
              {TAB_LABEL[t]}
            </button>
          ))}
        </div>

        {isLoading && <p className="text-xs text-ink-faint">Loading your courses...</p>}

        {!isLoading && courses.length === 0 && (
          <div className="rounded-lg border border-dashed border-surface-border bg-surface-card p-10 text-center">
            <BookOpen className="mx-auto mb-3 h-8 w-8 text-ink-faint" />
            <p className="text-sm font-semibold text-ink">No courses assigned yet</p>
            <p className="mt-1 text-xs text-ink-muted">
              Your HR team hasn&apos;t assigned any training courses to you. Check back soon.
            </p>
          </div>
        )}

        {!isLoading && courses.length > 0 && filtered.length === 0 && (
          <p className="py-6 text-center text-xs text-ink-faint">No courses match this filter.</p>
        )}

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {filtered.map((c: LearnerCourseSummary) => {
            const isCompleted = c.assignmentStatus === 'completed';
            const isInProgress = c.assignmentStatus === 'in_progress';
            return (
              <button
                key={c.courseId}
                onClick={() => navigate(`/learner/courses/${c.courseId}`)}
                className="flex flex-col items-start rounded-lg border border-surface-border bg-surface-card p-5 text-left shadow-card transition hover:border-accent"
              >
                <div className="flex w-full items-center justify-between">
                  <span
                    className={clsx(
                      'flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider',
                      isCompleted && 'bg-status-success/10 text-status-success',
                      isInProgress && 'bg-amber-500/10 text-amber-700',
                      !isCompleted && !isInProgress && 'bg-blue-500/10 text-blue-700',
                    )}
                  >
                    {isCompleted ? <CheckCircle2 className="h-3 w-3" /> : <PlayCircle className="h-3 w-3" />}
                    {isCompleted ? 'Completed' : isInProgress ? 'In Progress' : 'Assigned'}
                  </span>
                  <span className="text-[11px] font-medium text-ink-faint capitalize">{c.difficulty}</span>
                </div>

                <h3 className="mt-3 text-base font-bold text-ink">{c.name}</h3>
                {c.description && <p className="mt-1 line-clamp-2 text-xs text-ink-muted">{c.description}</p>}

                <div className="mt-4 flex items-center gap-4 text-xs text-ink-muted">
                  <span className="flex items-center gap-1.5">
                    <BookOpen className="h-3.5 w-3.5" /> {c.completedLessonCount}/{c.lessonCount} lessons
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" /> {c.estimatedDuration}h
                  </span>
                  <span className="flex items-center gap-1.5 font-semibold text-accent">
                    <Zap className="h-3.5 w-3.5" /> {c.totalXpReward} XP
                  </span>
                </div>

                <div className="mt-3 w-full">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface">
                    <div className="h-full rounded-full bg-accent" style={{ width: `${c.progress}%` }} />
                  </div>
                  <p className="mt-1 text-[10px] text-ink-faint">Due {c.dueDate}</p>
                </div>
              </button>
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

        <div className="rounded-lg border border-surface-border bg-surface-card p-4 shadow-card opacity-70">
          <div className="flex items-center gap-2 text-ink-muted">
            <Target className="h-4 w-4" />
            <h3 className="text-xs font-bold">Weekly Goal Progress</h3>
          </div>
          <p className="mt-2 text-[11px] text-ink-faint">Coming soon.</p>
        </div>

        <div className="rounded-lg border border-surface-border bg-surface-card p-4 shadow-card opacity-70">
          <div className="flex items-center gap-2 text-ink-muted">
            <Award className="h-4 w-4" />
            <h3 className="text-xs font-bold">Recent Badges</h3>
          </div>
          <p className="mt-2 text-[11px] text-ink-faint">Coming soon.</p>
        </div>

        <div className="rounded-lg border border-surface-border bg-surface-card p-4 shadow-card opacity-70">
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
