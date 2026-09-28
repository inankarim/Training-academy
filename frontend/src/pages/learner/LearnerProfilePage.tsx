import React, { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getLearnerProfileApi, uploadProfilePhotoApi } from '../../services/learner.service';
import { useAuth } from '../../hooks/useAuth';
import { LearnerProfile } from '../../types/learner.types';
import {
  Camera,
  BookOpen,
  CheckCircle2,
  Flame,
  GraduationCap,
  Zap,
  Trophy,
  Play,
  BadgeCheck,
  Image as ImageIcon,
  IdCard,
} from 'lucide-react';
import clsx from 'clsx';

const HEATMAP_WEEKS = 26;
const DAY_MS = 86_400_000;

function toUtc(date: string): number {
  return Date.parse(`${date}T00:00:00Z`);
}

function fromUtc(t: number): string {
  return new Date(t).toISOString().slice(0, 10);
}

function intensityClass(count: number): string {
  if (count === 0) return 'bg-surface-border/60';
  if (count === 1) return 'bg-accent/25';
  if (count <= 3) return 'bg-accent/45';
  if (count <= 5) return 'bg-accent/70';
  return 'bg-accent';
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

/** 26 weeks ending today, one column per week (Sun→Sat), like a contribution graph. */
function ActivityHeatmap({ activity }: { activity: LearnerProfile['activity'] }) {
  const columns = useMemo(() => {
    const counts = new Map(activity.days.map((d) => [d.date, d.count]));
    const today = toUtc(activity.today);
    const todayWeekday = new Date(today).getUTCDay();
    const start = today - (todayWeekday + (HEATMAP_WEEKS - 1) * 7) * DAY_MS;
    return Array.from({ length: HEATMAP_WEEKS }, (_, week) =>
      Array.from({ length: 7 }, (_, weekday) => {
        const t = start + (week * 7 + weekday) * DAY_MS;
        const date = fromUtc(t);
        return { date, count: counts.get(date) ?? 0, future: t > today };
      }),
    );
  }, [activity]);

  return (
    <div className="rounded-xl border border-surface-border bg-surface-card p-5 shadow-card">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-ink">Learning Activity</h2>
        <div className="flex items-center gap-1 text-[10px] text-ink-faint">
          Less
          {[0, 1, 2, 4, 6].map((c) => (
            <span key={c} className={clsx('h-2.5 w-2.5 rounded-sm', intensityClass(c))} />
          ))}
          More
        </div>
      </div>
      <div className="mt-4 flex gap-1 overflow-x-auto pb-1">
        {columns.map((week, i) => (
          <div key={i} className="flex flex-col gap-1">
            {week.map((cell) => (
              <span
                key={cell.date}
                title={cell.future ? '' : `${cell.date}: ${cell.count} activit${cell.count === 1 ? 'y' : 'ies'}`}
                className={clsx('h-3 w-3 rounded-sm', cell.future ? 'bg-transparent' : intensityClass(cell.count))}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="mt-3 flex justify-between border-t border-surface-border pt-3 text-[11px] text-ink-muted">
        <span>
          Total Active Days: <span className="font-semibold text-ink">{activity.totalActiveDays}</span>
        </span>
        <span>
          Longest Streak: <span className="font-semibold text-ink">{activity.longestStreak} day{activity.longestStreak === 1 ? '' : 's'}</span>
        </span>
      </div>
    </div>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
  tag,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
  tag?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-surface-border bg-surface-card p-4 shadow-card">
      <div className="flex items-center justify-between">
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-surface text-ink-muted">
          <Icon className="h-4 w-4" />
        </span>
        {tag}
      </div>
      <p className="mt-3 text-xl font-bold text-ink">{value}</p>
      <p className="text-[11px] text-ink-muted">{label}</p>
    </div>
  );
}

export const LearnerProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { updateUser } = useAuth();
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['learner-profile'],
    queryFn: getLearnerProfileApi,
  });

  async function handlePhotoChosen(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setPhotoError('Please choose an image file (JPG, PNG or WebP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setPhotoError('That photo is larger than 5MB.');
      return;
    }
    setPhotoError(null);
    setUploading(true);
    try {
      const avatarUrl = await uploadProfilePhotoApi(file);
      updateUser({ avatarUrl });
      queryClient.invalidateQueries({ queryKey: ['learner-profile'] });
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : 'Photo upload failed.');
    } finally {
      setUploading(false);
    }
  }

  if (isLoading || !profile) return <p className="text-xs text-ink-faint">Loading profile...</p>;

  const { user, level, stats, activity, currentFocus, history } = profile;
  const levelPct = Math.round((level.xpIntoLevel / Math.max(1, level.xpForNextLevel)) * 100);
  const initials = user.fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
  const tags = [user.salesRole, user.employeeType].filter((t): t is string => Boolean(t));

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px]">
      <div className="min-w-0 space-y-5">
        {/* Profile header */}
        <div className="rounded-xl border border-surface-border bg-surface-card p-5 shadow-card">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="relative mx-auto shrink-0 sm:mx-0">
              <div className="h-24 w-24 overflow-hidden rounded-full border-4 border-accent/80 bg-surface">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.fullName} className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-2xl font-bold text-ink-muted">
                    {initials}
                  </span>
                )}
              </div>
              <button
                onClick={() => fileInput.current?.click()}
                disabled={uploading}
                title="Change profile photo"
                className="absolute right-0 top-0 flex h-8 w-8 items-center justify-center rounded-full border-2 border-surface-card bg-charcoal text-white shadow hover:bg-accent disabled:opacity-60"
              >
                <Camera className="h-3.5 w-3.5" />
              </button>
              <span className="absolute -bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-1 whitespace-nowrap rounded-full border border-surface-border bg-surface-card px-2 py-0.5 text-[10px] font-bold text-accent shadow-sm">
                Lvl {level.level}
              </span>
              <input ref={fileInput} type="file" accept="image/*" className="hidden" onChange={handlePhotoChosen} />
            </div>

            <div className="min-w-0 flex-1 text-center sm:text-left">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <h1 className="text-2xl font-bold tracking-tight text-ink">{user.fullName}</h1>
                <button
                  onClick={() => fileInput.current?.click()}
                  disabled={uploading}
                  className="mx-auto flex items-center gap-1.5 rounded-md border border-surface-border px-3 py-1.5 text-xs font-semibold text-ink-muted hover:border-accent hover:text-accent disabled:opacity-60 sm:mx-0"
                >
                  <ImageIcon className="h-3.5 w-3.5" />
                  {uploading ? 'Uploading...' : user.avatarUrl ? 'Change Photo' : 'Upload Photo'}
                </button>
              </div>
              <p className="mt-1 flex flex-wrap items-center justify-center gap-x-1.5 text-sm text-ink-muted sm:justify-start">
                <IdCard className="h-4 w-4" />
                {user.designation || 'Learner'}
                {user.employeeId && <span>· ID: {user.employeeId}</span>}
              </p>
              {(user.departmentName || user.territoryName) && (
                <p className="text-xs text-ink-faint">
                  {[user.departmentName, user.territoryName].filter(Boolean).join(' · ')}
                </p>
              )}
              <div className="mt-3 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                {tags.map((t) => (
                  <span key={t} className="rounded bg-surface px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ink-muted">
                    {t.replace(/_/g, ' ')}
                  </span>
                ))}
                <span className="flex items-center gap-1 text-sm font-bold text-ink">
                  <Zap className="h-4 w-4 text-accent" /> {level.totalXp.toLocaleString()}
                  <span className="text-xs font-medium text-ink-muted">Total XP</span>
                </span>
              </div>
              {photoError && <p className="mt-2 text-xs text-status-danger">{photoError}</p>}
            </div>
          </div>
        </div>

        {/* Stat tiles */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatTile
            icon={BookOpen}
            label="Assigned"
            value={stats.coursesAssigned}
            tag={<span className="rounded bg-surface px-1.5 py-0.5 text-[10px] font-medium text-ink-muted">Courses</span>}
          />
          <StatTile icon={CheckCircle2} label="Completed" value={stats.coursesCompleted} />
          <StatTile
            icon={Flame}
            label="Current Streak"
            value={`${stats.currentStreak} Day${stats.currentStreak === 1 ? '' : 's'}`}
            tag={
              stats.currentStreak > 0 ? (
                stats.streakActiveToday ? (
                  <span className="rounded bg-status-dangerSubtle px-1.5 py-0.5 text-[10px] font-bold text-status-danger">Hot</span>
                ) : (
                  <span className="rounded bg-status-warningSubtle px-1.5 py-0.5 text-[10px] font-bold text-status-warning">
                    Keep it going
                  </span>
                )
              ) : undefined
            }
          />
          <StatTile icon={GraduationCap} label="Lessons Completed" value={stats.lessonsCompleted} />
        </div>

        <ActivityHeatmap activity={activity} />

        {/* Current focus */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-ink">Current Focus</h2>
            <button onClick={() => navigate('/learner/courses')} className="text-xs font-semibold text-accent hover:text-accent-hover">
              View all courses
            </button>
          </div>
          {currentFocus.length === 0 ? (
            <div className="rounded-xl border border-dashed border-surface-border bg-surface-card p-6 text-center text-xs text-ink-muted">
              Nothing in progress — you&apos;re all caught up.
            </div>
          ) : (
            <div className="space-y-3">
              {currentFocus.map((c) => (
                <button
                  key={c.courseId}
                  onClick={() => navigate(`/learner/courses/${c.courseId}`)}
                  className="flex w-full items-center gap-4 rounded-xl border border-surface-border bg-surface-card p-3 text-left shadow-card transition hover:border-accent"
                >
                  <div className="h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-surface">
                    {c.bannerRef ? (
                      <img src={c.bannerRef} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-ink-faint">
                        <BookOpen className="h-5 w-5" />
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-ink-faint">
                      {c.assignmentStatus === 'assigned' ? 'Not started' : 'In progress'} · Due {c.dueDate}
                    </p>
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-bold text-ink">{c.name}</p>
                      <span className="shrink-0 text-xs font-bold text-accent">{c.progress}%</span>
                    </div>
                    <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-surface">
                      <div className="h-full rounded-full bg-accent" style={{ width: `${c.progress}%` }} />
                    </div>
                  </div>
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
                    <Play className="h-3.5 w-3.5" />
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Learning history */}
        <div className="overflow-hidden rounded-xl border border-surface-border bg-surface-card shadow-card">
          <h2 className="px-5 pt-5 text-sm font-bold text-ink">Learning History</h2>
          {history.length === 0 ? (
            <p className="p-5 text-xs text-ink-muted">Courses you complete will appear here.</p>
          ) : (
            <table className="mt-3 w-full text-left text-xs">
              <thead className="border-y border-surface-border bg-surface text-[10px] uppercase tracking-wider text-ink-muted">
                <tr>
                  <th className="px-5 py-2.5 font-semibold">Course</th>
                  <th className="px-3 py-2.5 font-semibold">Completed</th>
                  <th className="px-3 py-2.5 text-right font-semibold">XP Earned</th>
                  <th className="px-5 py-2.5 text-right font-semibold">Final Quiz</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h) => (
                  <tr key={h.assignmentId} className="border-b border-surface-border last:border-0">
                    <td className="px-5 py-3">
                      <span className="flex items-center gap-2 font-semibold text-ink">
                        <BadgeCheck className="h-4 w-4 shrink-0 text-status-success" />
                        {h.courseName}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-ink-muted">{formatDate(h.completedAt)}</td>
                    <td className="px-3 py-3 text-right font-bold text-accent">+{h.xpEarned} XP</td>
                    <td className="px-5 py-3 text-right">
                      {h.finalQuizScore !== null ? (
                        <span className="rounded bg-status-successSubtle px-2 py-0.5 text-[11px] font-semibold text-status-success">
                          {h.finalQuizScore}%
                        </span>
                      ) : (
                        <span className="text-ink-faint">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Right column */}
      <aside className="space-y-4 lg:sticky lg:top-24 lg:h-fit">
        <div className="rounded-xl border border-surface-border bg-surface-card p-5 shadow-card">
          <h2 className="flex items-center gap-2 text-sm font-bold text-ink">
            <Trophy className="h-4 w-4 text-accent" /> Rank Progression
          </h2>
          <div className="mt-4 flex items-end justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-faint">Current Level</p>
              <p className="text-2xl font-bold text-ink">Level {level.level}</p>
              <p className="text-[11px] font-medium text-accent">{level.levelTitle}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-faint">Next Level</p>
              <p className="text-sm font-bold text-ink">Level {level.level + 1}</p>
            </div>
          </div>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-surface">
            <div className="h-full rounded-full bg-accent" style={{ width: `${levelPct}%` }} />
          </div>
          <p className="mt-2 text-[11px] text-ink-muted">
            <span className="font-semibold text-accent">{level.xpForNextLevel - level.xpIntoLevel} XP</span> needed to reach
            Level {level.level + 1}
          </p>
        </div>
      </aside>
    </div>
  );
};
