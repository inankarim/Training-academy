import React from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { listCoursesInPathApi } from '../../services/learner.service';
import { ChevronLeft, Clock, Zap, PlayCircle, CheckCircle2, BookOpen } from 'lucide-react';
import clsx from 'clsx';

export const LearningPathCoursesPage: React.FC = () => {
  const { learningPath } = useParams<{ learningPath: string }>();
  const navigate = useNavigate();

  const { data: courses = [], isLoading } = useQuery({
    queryKey: ['learning-path-courses', learningPath],
    queryFn: () => listCoursesInPathApi(learningPath!),
    enabled: Boolean(learningPath),
  });

  return (
    <div className="space-y-6">
      <div>
        <Link to="/learner/paths" className="flex items-center gap-1 text-xs font-medium text-ink-muted hover:text-ink">
          <ChevronLeft className="h-3.5 w-3.5" /> Back to Learning Paths
        </Link>
        <h1 className="mt-2 text-xl font-bold tracking-tight text-ink">{learningPath}</h1>
        <p className="mt-1 text-xs text-ink-muted">
          {courses.length} course{courses.length === 1 ? '' : 's'} assigned to you in this path.
        </p>
      </div>

      {isLoading && <p className="text-xs text-ink-faint">Loading courses...</p>}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {courses.map((c) => {
          const isCompleted = c.assignmentStatus === 'completed';
          const isInProgress = c.assignmentStatus === 'in_progress';
          return (
            <button
              key={c.courseId}
              onClick={() => navigate(`/learner/courses/${c.courseId}`)}
              className="flex flex-col items-start rounded-lg border border-surface-border bg-white p-5 text-left shadow-card transition hover:border-accent"
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

              <h3 className="mt-3 text-sm font-bold text-ink">{c.name}</h3>
              {c.description && <p className="mt-1 line-clamp-2 text-xs text-ink-muted">{c.description}</p>}

              <div className="mt-3 flex items-center gap-3 text-[11px] text-ink-muted">
                <span className="flex items-center gap-1">
                  <BookOpen className="h-3.5 w-3.5" /> {c.completedLessonCount}/{c.lessonCount} lessons
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" /> {c.estimatedDuration}h
                </span>
                <span className="flex items-center gap-1 font-semibold text-accent">
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
  );
};
