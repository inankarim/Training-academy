import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { listCoursesApi } from '../../services/courseBuilder.service';
import { Plus, BookOpen, FileEdit, CheckCircle2, Archive, Clock } from 'lucide-react';
import clsx from 'clsx';

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  draft: { label: 'DRAFT', className: 'bg-status-warningSubtle text-status-warning' },
  published: { label: 'PUBLISHED', className: 'bg-status-successSubtle text-status-success' },
  archived: { label: 'ARCHIVED', className: 'bg-surface-border text-ink-muted' },
};

export const CourseListPage: React.FC = () => {
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['content-creator-courses'],
    queryFn: listCoursesApi,
  });

  const counts = data?.counts;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-ink">Courses</h1>
          <p className="mt-1 text-xs text-ink-muted">Build and manage your training courses.</p>
        </div>
        <button
          onClick={() => navigate('/staff/courses/create')}
          className="flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-accent-hover"
        >
          <Plus className="h-4 w-4" />
          Create Course
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <SummaryTile icon={BookOpen} label="Total Courses" value={counts?.total ?? 0} tone="text-accent" />
        <SummaryTile icon={FileEdit} label="Draft" value={counts?.draft ?? 0} tone="text-status-warning" />
        <SummaryTile icon={CheckCircle2} label="Published" value={counts?.published ?? 0} tone="text-status-success" />
        <SummaryTile icon={Archive} label="Archived" value={counts?.archived ?? 0} tone="text-ink-muted" />
      </div>

      <div className="overflow-hidden rounded-lg border border-surface-border bg-white shadow-card">
        {isLoading ? (
          <div className="p-10 text-center text-xs text-ink-muted">
            <div className="mx-auto mb-2 h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
            Loading courses...
          </div>
        ) : !data || data.items.length === 0 ? (
          <div className="p-12 text-center">
            <BookOpen className="mx-auto h-8 w-8 text-ink-faint" />
            <h3 className="mt-3 text-sm font-bold text-ink">No courses yet</h3>
            <p className="mt-1 text-xs text-ink-muted">Click "Create Course" to build your first training course.</p>
          </div>
        ) : (
          <table className="w-full text-left text-xs text-ink">
            <thead className="border-b border-surface-border bg-surface font-semibold uppercase tracking-wider text-ink-muted">
              <tr>
                <th className="px-5 py-3.5">Course</th>
                <th className="px-5 py-3.5">Learning Path</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Lessons</th>
                <th className="px-5 py-3.5">Setup Progress</th>
                <th className="px-5 py-3.5">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {data.items.map((course) => {
                const statusMeta = STATUS_STYLES[course.status] ?? STATUS_STYLES.draft;
                return (
                  <tr
                    key={course.courseId}
                    onClick={() => navigate(`/staff/courses/${course.courseId}/edit`)}
                    className="cursor-pointer transition hover:bg-surface/50"
                  >
                    <td className="px-5 py-4">
                      <div className="font-semibold text-ink">{course.name}</div>
                      <div className="text-[11px] text-ink-muted">{course.totalXpReward} XP</div>
                    </td>
                    <td className="px-5 py-4 text-ink-muted">{course.learningPath}</td>
                    <td className="px-5 py-4">
                      <span className={clsx('inline-block rounded px-2 py-0.5 text-[11px] font-semibold', statusMeta.className)}>
                        {statusMeta.label}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-ink-muted">{course.lessonCount}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-20 overflow-hidden rounded-full bg-surface">
                          <div
                            className="h-full rounded-full bg-accent"
                            style={{ width: `${course.setupProgress}%` }}
                          />
                        </div>
                        <span className="text-[11px] text-ink-muted">{course.setupProgress}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-[11px] text-ink-muted">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(course.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

function SummaryTile({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  tone: string;
}) {
  return (
    <div className="rounded-lg border border-surface-border bg-white p-4 shadow-card">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">{label}</span>
        <Icon className={clsx('h-4 w-4', tone)} />
      </div>
      <p className={clsx('mt-1 text-2xl font-bold', tone)}>{value}</p>
    </div>
  );
}
