import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { getLearnerDashboardApi, listMyCoursesApi } from '../../services/learner.service';
import {
  Award,
  Target,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  BookOpen,
} from 'lucide-react';

export const LearnerDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: dashboard } = useQuery({
    queryKey: ['learner-dashboard'],
    queryFn: getLearnerDashboardApi,
  });

  const { data: courses = [], isLoading } = useQuery({
    queryKey: ['learner-courses'],
    queryFn: listMyCoursesApi,
  });

  const completedCount = courses.filter((c) => c.assignmentStatus === 'completed').length;
  const overallProgress = courses.length
    ? Math.round(courses.reduce((sum, c) => sum + c.progress, 0) / courses.length)
    : 0;
  const levelPct = dashboard
    ? Math.round((dashboard.xpIntoLevel / Math.max(1, dashboard.xpForNextLevel)) * 100)
    : 0;

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="rounded-xl border border-surface-border bg-white p-6 shadow-card">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded bg-accent/10 px-2 py-0.5 text-xs font-semibold text-accent">
                Level {dashboard?.level ?? 1} &bull; {dashboard?.levelTitle ?? 'Trainee'}
              </span>
              <span className="text-xs text-ink-muted">
                {dashboard?.xpIntoLevel ?? 0} / {dashboard?.xpForNextLevel ?? 500} XP to next level
              </span>
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-ink">
              Welcome back, {user?.fullName}!
            </h1>
            <p className="mt-1 text-sm text-ink-muted">
              Role: <span className="font-semibold text-ink">{user?.role.toUpperCase()}</span>
              {user?.designation && (
                <> &bull; Designation: <span className="font-semibold text-ink">{user.designation}</span></>
              )}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-lg border border-surface-border bg-surface p-3 text-center">
              <p className="text-xs font-semibold text-ink-muted">Assigned Courses</p>
              <p className="text-xl font-bold text-accent">{courses.length}</p>
            </div>
            <div className="rounded-lg border border-surface-border bg-surface p-3 text-center">
              <p className="text-xs font-semibold text-ink-muted">Completed</p>
              <p className="text-xl font-bold text-status-success">{completedCount}</p>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-6">
          <div className="flex justify-between text-xs font-medium text-ink-muted">
            <span>Current Progress: {overallProgress}%</span>
            <span>Next Level: {levelPct}% there</span>
          </div>
          <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-surface">
            <div
              className="h-full rounded-full bg-accent transition-all duration-500"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Learning Modules */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-ink">Assigned Training Modules</h2>
          <button
            onClick={() => navigate('/learner/courses')}
            className="flex items-center gap-1.5 text-xs font-semibold text-accent hover:text-accent-hover"
          >
            <BookOpen className="h-3.5 w-3.5" /> View All Courses
          </button>
        </div>

        {isLoading && <p className="text-xs text-ink-faint">Loading your assigned courses...</p>}

        {!isLoading && courses.length === 0 && (
          <div className="rounded-lg border border-dashed border-surface-border bg-white p-10 text-center">
            <BookOpen className="mx-auto mb-3 h-8 w-8 text-ink-faint" />
            <p className="text-sm font-semibold text-ink">No courses assigned yet</p>
            <p className="mt-1 text-xs text-ink-muted">
              Your HR team hasn&apos;t assigned any training courses to you. Check back soon.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {courses.map((c) => {
            const isCompleted = c.assignmentStatus === 'completed';
            return (
              <div
                key={`${c.courseId}-${c.dueDate}`}
                className="flex flex-col justify-between rounded-lg border border-surface-border bg-white p-5 shadow-card transition hover:border-accent"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="rounded bg-accent/10 px-2 py-0.5 text-[11px] font-semibold capitalize text-accent">
                      {c.difficulty}
                    </span>
                    <span className="text-xs text-ink-muted">
                      {c.lessonCount} Lessons &bull; {c.totalXpReward} XP
                    </span>
                  </div>
                  <h3 className="mt-3 text-base font-bold text-ink">{c.name}</h3>
                  {c.description && <p className="mt-1 line-clamp-2 text-xs text-ink-muted">{c.description}</p>}

                  <div className="mt-3">
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface">
                      <div className="h-full rounded-full bg-accent" style={{ width: `${c.progress}%` }} />
                    </div>
                  </div>
                </div>
                <div className="mt-5 flex items-center justify-between border-t border-surface-border pt-4">
                  <span className="text-xs font-medium text-ink-faint">
                    {isCompleted
                      ? 'Completed'
                      : c.completedLessonCount > 0
                      ? `${c.completedLessonCount}/${c.lessonCount} lessons done`
                      : 'Not started'}
                  </span>
                  <button
                    onClick={() => navigate(`/learner/courses/${c.courseId}`)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-accent transition hover:text-accent-hover"
                  >
                    Launch Module <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Gamification & Challenges Preview */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <div className="rounded-lg border border-surface-border bg-white p-5 shadow-card">
          <div className="flex items-center gap-2 text-accent">
            <Target className="h-5 w-5" />
            <h3 className="text-sm font-bold text-ink">Daily Challenge</h3>
          </div>
          <p className="mt-2 text-xs text-ink-muted">
            Complete a 5-question quick check on Cement Quality Parameters to earn bonus XP.
          </p>
          <div className="mt-4 flex items-center justify-between text-xs font-medium">
            <span className="text-accent">+50 XP Reward</span>
            <span className="text-ink-faint">Expires in 10h</span>
          </div>
        </div>

        <div className="rounded-lg border border-surface-border bg-white p-5 shadow-card">
          <div className="flex items-center gap-2 text-amber-600">
            <Award className="h-5 w-5" />
            <h3 className="text-sm font-bold text-ink">Next Badge</h3>
          </div>
          <p className="mt-2 text-xs text-ink-muted">
            <strong>First Login</strong>: Earned upon completing your initial onboarding profile.
          </p>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-status-success">
            <CheckCircle2 className="h-4 w-4" />
            <span>Unlocked</span>
          </div>
        </div>

        <div className="rounded-lg border border-surface-border bg-white p-5 shadow-card">
          <div className="flex items-center gap-2 text-blue-600">
            <Sparkles className="h-5 w-5" />
            <h3 className="text-sm font-bold text-ink">Leaderboard Rank</h3>
          </div>
          <p className="mt-2 text-xs text-ink-muted">
            Complete lessons to rise through your territory and department leaderboard.
          </p>
          <div className="mt-4 text-xs font-semibold text-ink">
            Department Rank: <span className="text-accent">#—</span>
          </div>
        </div>
      </div>
    </div>
  );
};
