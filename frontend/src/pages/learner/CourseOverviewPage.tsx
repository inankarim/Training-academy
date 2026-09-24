import React from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getLearnerCourseApi } from '../../services/learner.service';
import { ChevronLeft, CheckCircle2, PlayCircle, Circle, Clock, Zap } from 'lucide-react';
import clsx from 'clsx';

export const CourseOverviewPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();

  const { data: course, isLoading } = useQuery({
    queryKey: ['learner-course', courseId],
    queryFn: () => getLearnerCourseApi(courseId!),
    enabled: Boolean(courseId),
  });

  if (isLoading || !course) {
    return <p className="text-xs text-ink-faint">Loading course...</p>;
  }

  // Group lessons by module, preserving sort order
  const moduleOrder: string[] = [];
  const byModule = new Map<string, typeof course.lessons>();
  course.lessons.forEach((l) => {
    if (!byModule.has(l.moduleId)) {
      byModule.set(l.moduleId, []);
      moduleOrder.push(l.moduleId);
    }
    byModule.get(l.moduleId)!.push(l);
  });

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_260px]">
      <div className="space-y-5">
        <div>
          <Link
            to="/learner/courses"
            className="flex items-center gap-1 text-xs font-medium text-ink-muted hover:text-ink"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> Back to My Courses
          </Link>
          <h1 className="mt-2 text-xl font-bold tracking-tight text-ink">{course.name}</h1>
          {course.description && <p className="mt-1 text-xs text-ink-muted">{course.description}</p>}
          <div className="mt-3 flex items-center gap-4 text-xs text-ink-muted">
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" /> {course.estimatedDuration}h
            </span>
            <span className="flex items-center gap-1 font-semibold text-accent">
              <Zap className="h-3.5 w-3.5" /> {course.totalXpReward} XP
            </span>
            <span className="capitalize">{course.difficulty}</span>
          </div>
        </div>

        <div className="space-y-4">
          {moduleOrder.map((moduleId) => {
            const lessons = byModule.get(moduleId)!;
            return (
              <div key={moduleId} className="rounded-lg border border-surface-border bg-surface-card shadow-card">
                <div className="border-b border-surface-border px-4 py-3">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-ink-muted">
                    {lessons[0]?.moduleTitle || 'Module'}
                  </h2>
                </div>
                <ul>
                  {lessons.map((l) => {
                    const isDone = l.progressStatus === 'completed';
                    const isCurrent = l.progressStatus === 'in_progress';
                    return (
                      <li key={l.lessonId} className="border-b border-surface-border last:border-0">
                        <button
                          onClick={() => navigate(`/learner/lessons/${l.lessonId}`)}
                          className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-surface/60"
                        >
                          {isDone ? (
                            <CheckCircle2 className="h-4.5 w-4.5 shrink-0 text-status-success" />
                          ) : isCurrent ? (
                            <PlayCircle className="h-4.5 w-4.5 shrink-0 text-accent" />
                          ) : (
                            <Circle className="h-4.5 w-4.5 shrink-0 text-ink-faint" />
                          )}
                          <div className="min-w-0 flex-1">
                            <p
                              className={clsx(
                                'truncate text-xs font-semibold',
                                isCurrent ? 'text-accent' : 'text-ink',
                              )}
                            >
                              {l.title}
                            </p>
                            {l.description && (
                              <p className="truncate text-[11px] text-ink-faint">{l.description}</p>
                            )}
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right sidebar: course progress */}
      <div className="space-y-4">
        <div className="rounded-lg border border-surface-border bg-surface-card p-4 shadow-card">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-faint">Course Progress</p>
          <div className="mt-2">
            <div className="flex justify-between text-[11px] font-medium text-ink-muted">
              <span>Overall Completion</span>
              <span>{course.progress}%</span>
            </div>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-surface">
              <div className="h-full rounded-full bg-accent" style={{ width: `${course.progress}%` }} />
            </div>
          </div>
          <p className="mt-3 text-[11px] text-ink-muted">
            {course.completedLessonCount} of {course.lessonCount} lessons complete
          </p>
          <p className="mt-1 text-[11px] text-ink-faint">Due {course.dueDate}</p>
        </div>
      </div>
    </div>
  );
};
