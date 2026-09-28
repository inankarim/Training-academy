import React from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { getLearnerCourseApi } from '../../services/learner.service';
import { ChevronLeft, CheckCircle2, PlayCircle, Circle, Clock, Zap, Trophy, Lock, ClipboardCheck } from 'lucide-react';
import clsx from 'clsx';

export const CourseOverviewPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();

  const { data: course, isLoading, error } = useQuery({
    queryKey: ['learner-course', courseId],
    queryFn: () => getLearnerCourseApi(courseId!),
    enabled: Boolean(courseId),
    retry: false,
  });

  if (axios.isAxiosError(error) && error.response?.status === 423) {
    return (
      <div className="rounded-lg border border-status-warning/30 bg-status-warningSubtle p-6 text-center">
        <p className="text-sm font-bold text-status-warning">This course is locked</p>
        <p className="mt-1 text-xs text-ink-muted">
          {(error.response.data as { error?: { message?: string } })?.error?.message ||
            'Its due date has passed. Contact HR to extend your deadline.'}
        </p>
        <Link to="/learner/courses" className="mt-3 inline-block text-xs font-semibold text-accent hover:text-accent-hover">
          Back to My Courses
        </Link>
      </div>
    );
  }

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

          {course.finalQuiz && (
            <div
              className={clsx(
                'flex items-center gap-3 rounded-lg border p-4 shadow-card',
                course.finalQuiz.status === 'available'
                  ? 'border-accent bg-accent/5'
                  : course.finalQuiz.status === 'passed'
                  ? 'border-status-success/30 bg-status-successSubtle'
                  : course.finalQuiz.status === 'failed'
                  ? 'border-status-danger/30 bg-status-dangerSubtle'
                  : 'border-surface-border bg-surface-card',
              )}
            >
              {course.finalQuiz.status === 'passed' ? (
                <Trophy className="h-5 w-5 shrink-0 text-status-success" />
              ) : course.finalQuiz.status === 'locked' ? (
                <Lock className="h-5 w-5 shrink-0 text-ink-faint" />
              ) : (
                <ClipboardCheck
                  className={clsx(
                    'h-5 w-5 shrink-0',
                    course.finalQuiz.status === 'failed' ? 'text-status-danger' : 'text-accent',
                  )}
                />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">Final Quiz</p>
                <p className="truncate text-sm font-semibold text-ink">{course.finalQuiz.quizName}</p>
                <p className="text-[11px] text-ink-muted">
                  {course.finalQuiz.status === 'locked' && 'Finish every lesson to unlock it.'}
                  {course.finalQuiz.status === 'available' &&
                    `${course.finalQuiz.questionCount} questions · pass mark ${course.finalQuiz.passingScore}% — required to complete the course.`}
                  {course.finalQuiz.status === 'passed' &&
                    `Passed with ${course.finalQuiz.bestScorePercent ?? 0}% — course complete.`}
                  {course.finalQuiz.status === 'failed' &&
                    `Not passed (${course.finalQuiz.bestScorePercent ?? 0}%). Please contact HR personally to get another attempt.`}
                </p>
              </div>
              {course.finalQuiz.status !== 'locked' && (
                <button
                  onClick={() => navigate(`/learner/courses/${course.courseId}/final-quiz`)}
                  className={clsx(
                    'shrink-0 rounded-md px-3.5 py-2 text-xs font-semibold',
                    course.finalQuiz.status === 'available'
                      ? 'bg-accent text-white hover:bg-accent-hover'
                      : 'border border-surface-border bg-surface-card text-ink-muted hover:text-ink',
                  )}
                >
                  {course.finalQuiz.status === 'available' ? 'Start Final Quiz' : 'View'}
                </button>
              )}
            </div>
          )}
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
          {course.finalQuiz && (
            <p
              className={clsx(
                'mt-1 text-[11px] font-medium',
                course.finalQuiz.status === 'passed' ? 'text-status-success' : 'text-status-warning',
              )}
            >
              {course.finalQuiz.status === 'passed' ? 'Final quiz passed' : 'Final quiz required to complete'}
            </p>
          )}
          {course.finalQuiz && (
            <p className="mt-1 text-[10px] text-ink-faint">Lessons count for 75%, the final quiz for 25%.</p>
          )}
          <p className="mt-1 text-[11px] text-ink-faint">Due {course.dueDate}</p>
        </div>
      </div>
    </div>
  );
};
