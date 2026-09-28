import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listUsersApi } from '../../services/users.service';
import {
  listAssignableCoursesApi,
  listAssignmentsApi,
  createAssignmentApi,
  deleteAssignmentApi,
  grantFinalQuizAttemptApi,
} from '../../services/assignments.service';
import { AssignmentStatus } from '../../types/assignments.types';
import { UserSummary } from '../../types/auth.types';
import {
  ClipboardList,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Clock,
  PlayCircle,
  Search,
  ChevronDown,
  ChevronRight,
  Layers,
  Timer,
  Zap,
  Rocket,
} from 'lucide-react';
import clsx from 'clsx';

const STATUS_META: Record<AssignmentStatus, { label: string; className: string; icon: React.ReactNode }> = {
  assigned: { label: 'Assigned', className: 'bg-blue-500/10 text-blue-700', icon: <Clock className="h-3 w-3" /> },
  in_progress: {
    label: 'In Progress',
    className: 'bg-amber-500/10 text-amber-700',
    icon: <PlayCircle className="h-3 w-3" />,
  },
  completed: {
    label: 'Completed',
    className: 'bg-status-success/10 text-status-success',
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  overdue: {
    label: 'Overdue',
    className: 'bg-status-dangerSubtle text-status-danger',
    icon: <AlertCircle className="h-3 w-3" />,
  },
};

const FINAL_QUIZ_META = {
  locked: { label: 'Lessons pending', className: 'text-ink-faint' },
  available: { label: 'Ready to take', className: 'text-blue-700' },
  passed: { label: 'Passed', className: 'text-status-success' },
  failed: { label: 'Failed', className: 'text-status-danger' },
} as const;

function defaultDueDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().slice(0, 10);
}

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
}

export const AssignmentsPage: React.FC = () => {
  const queryClient = useQueryClient();

  // --- Find Employee ---
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<UserSummary | null>(null);

  // --- Select Courses ---
  const [selectedCourses, setSelectedCourses] = useState<Map<string, string>>(new Map());
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // --- Assignment history filter ---
  const [statusFilter, setStatusFilter] = useState<AssignmentStatus | 'all'>('all');

  const { data: courses = [] } = useQuery({
    queryKey: ['assignable-courses'],
    queryFn: listAssignableCoursesApi,
  });

  const { data: learnersData } = useQuery({
    queryKey: ['users', 'learners-for-assignment'],
    queryFn: () => listUsersApi({ role: 'learner', status: 'active', pageSize: 200 }),
  });
  const learners = learnersData?.items ?? [];

  const matchingLearners = useMemo(() => {
    if (!employeeSearch.trim()) return [];
    const q = employeeSearch.trim().toLowerCase();
    return learners
      .filter(
        (u) =>
          u.fullName.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          (u.employeeId ?? '').toLowerCase().includes(q),
      )
      .slice(0, 8);
  }, [employeeSearch, learners]);

  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ['assignments', statusFilter],
    queryFn: () => listAssignmentsApi(statusFilter === 'all' ? {} : { status: statusFilter }),
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!selectedEmployee) throw new Error('Select an employee first.');
      if (selectedCourses.size === 0) throw new Error('Select at least one course to assign.');
      await Promise.all(
        Array.from(selectedCourses.entries()).map(([courseId, dueDate]) =>
          createAssignmentApi({ courseId, userId: selectedEmployee.id, dueDate }),
        ),
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      setSelectedCourses(new Map());
      setFormError(null);
    },
    onError: (err: unknown) => {
      setFormError(err instanceof Error ? err.message : 'Failed to assign courses');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAssignmentApi,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['assignments'] }),
  });

  const grantAttemptMutation = useMutation({
    mutationFn: grantFinalQuizAttemptApi,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['assignments'] }),
    onError: (err: unknown) => window.alert(err instanceof Error ? err.message : 'Failed to grant another attempt'),
  });

  const toggleCourse = (courseId: string) => {
    setSelectedCourses((prev) => {
      const next = new Map(prev);
      if (next.has(courseId)) {
        next.delete(courseId);
        if (expandedCourse === courseId) setExpandedCourse(null);
      } else {
        next.set(courseId, defaultDueDate());
        setExpandedCourse(courseId);
      }
      return next;
    });
  };

  const setCourseDueDate = (courseId: string, date: string) => {
    setSelectedCourses((prev) => new Map(prev).set(courseId, date));
  };

  const summary = useMemo(() => {
    const picked = courses.filter((c) => selectedCourses.has(c.courseId));
    return {
      courses: picked,
      totalLessons: picked.reduce((sum, c) => sum + c.lessonCount, 0),
      totalHours: picked.reduce((sum, c) => sum + c.estimatedDuration, 0),
      totalXp: picked.reduce((sum, c) => sum + c.totalXpReward, 0),
    };
  }, [courses, selectedCourses]);

  const counts = useMemo(() => {
    const c = { assigned: 0, in_progress: 0, completed: 0, overdue: 0 };
    assignments.forEach((a) => {
      c[a.status] += 1;
    });
    return c;
  }, [assignments]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-ink">Assign Courses</h1>
        <p className="mt-1 text-xs text-ink-muted">Select an employee and assign relevant learning paths.</p>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_1.4fr_1fr]">
        {/* --- Find Employee --- */}
        <div className="space-y-3 rounded-lg border border-surface-border bg-surface-card p-4 shadow-card">
          <h2 className="text-xs font-bold uppercase tracking-wider text-ink-muted">Find Employee</h2>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-faint" />
            <input
              value={employeeSearch}
              onChange={(e) => setEmployeeSearch(e.target.value)}
              placeholder="Search by name, email, or ID..."
              className="w-full rounded-md border border-surface-border py-2 pl-8 pr-2.5 text-xs focus:border-accent focus:outline-none"
            />
          </div>

          {employeeSearch && matchingLearners.length > 0 && (
            <div className="max-h-40 space-y-1 overflow-y-auto rounded-md border border-surface-border p-1">
              {matchingLearners.map((u) => (
                <button
                  key={u.id}
                  onClick={() => {
                    setSelectedEmployee(u);
                    setEmployeeSearch('');
                  }}
                  className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs hover:bg-surface"
                >
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/10 text-[10px] font-bold text-accent">
                    {initials(u.fullName)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-ink">{u.fullName}</p>
                    <p className="truncate text-[10px] text-ink-faint">{u.email}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {selectedEmployee ? (
            <div className="rounded-lg border-t-2 border-accent bg-surface p-3.5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent/10 text-sm font-bold text-accent">
                  {initials(selectedEmployee.fullName)}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-ink">{selectedEmployee.fullName}</p>
                  <p className="truncate text-xs font-medium text-accent">
                    {selectedEmployee.designation || selectedEmployee.role}
                  </p>
                </div>
              </div>
              <dl className="mt-3 space-y-1.5 border-t border-surface-border pt-3 text-[11px]">
                <div className="flex justify-between">
                  <dt className="text-ink-faint">Employee ID</dt>
                  <dd className="font-medium text-ink">{selectedEmployee.employeeId || '—'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ink-faint">Department</dt>
                  <dd className="font-medium text-ink">{selectedEmployee.department || '—'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ink-faint">Region</dt>
                  <dd className="font-medium text-ink">{selectedEmployee.region || '—'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ink-faint">Area</dt>
                  <dd className="font-medium text-ink">{selectedEmployee.area || '—'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ink-faint">Territory</dt>
                  <dd className="font-medium text-ink">{selectedEmployee.territory || '—'}</dd>
                </div>
              </dl>
              <button
                onClick={() => setSelectedEmployee(null)}
                className="mt-3 w-full rounded border border-surface-border py-1.5 text-[11px] font-medium text-ink-muted hover:border-ink"
              >
                Change Employee
              </button>
            </div>
          ) : (
            <p className="py-6 text-center text-[11px] text-ink-faint">Search and select an employee to begin.</p>
          )}
        </div>

        {/* --- Select Courses --- */}
        <div className="space-y-3 rounded-lg border border-surface-border bg-surface-card p-4 shadow-card">
          <h2 className="text-xs font-bold uppercase tracking-wider text-ink-muted">Select Courses</h2>

          {courses.length === 0 && (
            <p className="py-6 text-center text-[11px] text-ink-faint">No published courses available to assign yet.</p>
          )}

          <div className="space-y-2">
            {courses.map((c) => {
              const isSelected = selectedCourses.has(c.courseId);
              const isExpanded = expandedCourse === c.courseId;
              return (
                <div
                  key={c.courseId}
                  className={clsx(
                    'rounded-lg border p-3 transition',
                    isSelected ? 'border-accent bg-accent/5' : 'border-surface-border hover:border-ink/30',
                  )}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleCourse(c.courseId)}
                      className="mt-0.5 h-4 w-4 shrink-0 accent-accent"
                    />
                    <button
                      type="button"
                      onClick={() => (isSelected ? setExpandedCourse(isExpanded ? null : c.courseId) : toggleCourse(c.courseId))}
                      className="flex flex-1 items-start justify-between gap-2 text-left"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-ink">{c.name}</p>
                        <p className="mt-0.5 text-[11px] text-ink-muted">
                          {c.lessonCount} lessons &bull; {c.estimatedDuration}h &bull; {c.totalXpReward} XP
                        </p>
                      </div>
                      {isSelected &&
                        (isExpanded ? (
                          <ChevronDown className="h-4 w-4 shrink-0 text-ink-faint" />
                        ) : (
                          <ChevronRight className="h-4 w-4 shrink-0 text-ink-faint" />
                        ))}
                    </button>
                  </div>

                  {isSelected && isExpanded && (
                    <div className="mt-3 flex items-center gap-2 border-t border-surface-border pt-3">
                      <label className="text-[11px] font-semibold text-ink-muted">Due Date</label>
                      <input
                        type="date"
                        value={selectedCourses.get(c.courseId) ?? defaultDueDate()}
                        min={new Date().toISOString().slice(0, 10)}
                        onChange={(e) => setCourseDueDate(c.courseId, e.target.value)}
                        className="rounded-md border border-surface-border px-2.5 py-1 text-xs focus:border-accent focus:outline-none"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <p className="pt-1 text-[11px] text-ink-faint">
            A learner can be assigned the same course more than once — repeat assignments (e.g. re-training) are
            allowed.
          </p>
        </div>

        {/* --- Summary --- */}
        <div className="space-y-4 self-start rounded-lg border border-surface-border bg-surface-card p-4 shadow-card">
          <h2 className="text-xs font-bold uppercase tracking-wider text-ink-muted">Summary</h2>

          {formError && (
            <div className="flex items-center gap-2 rounded-lg border border-status-danger/30 bg-status-dangerSubtle p-2.5 text-[11px] text-status-danger">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-faint">Assignee</p>
            <p className="mt-1 text-sm font-bold text-ink">{selectedEmployee?.fullName ?? 'None selected'}</p>
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-faint">
              Selected Courses ({summary.courses.length})
            </p>
            {summary.courses.length === 0 ? (
              <p className="mt-1 text-xs text-ink-faint">None yet</p>
            ) : (
              <ul className="mt-1 space-y-1">
                {summary.courses.map((c) => (
                  <li key={c.courseId} className="truncate text-xs text-ink">
                    &bull; {c.name}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2 border-t border-surface-border pt-3">
            <div className="rounded-md bg-surface p-2 text-center">
              <Layers className="mx-auto h-3.5 w-3.5 text-ink-faint" />
              <p className="mt-1 text-sm font-bold text-ink">{summary.totalLessons}</p>
              <p className="text-[9px] text-ink-faint">Lessons</p>
            </div>
            <div className="rounded-md bg-surface p-2 text-center">
              <Timer className="mx-auto h-3.5 w-3.5 text-ink-faint" />
              <p className="mt-1 text-sm font-bold text-ink">{summary.totalHours}h</p>
              <p className="text-[9px] text-ink-faint">Est. Time</p>
            </div>
            <div className="rounded-md bg-surface p-2 text-center">
              <Zap className="mx-auto h-3.5 w-3.5 text-accent" />
              <p className="mt-1 text-sm font-bold text-accent">{summary.totalXp}</p>
              <p className="text-[9px] text-ink-faint">XP</p>
            </div>
          </div>

          <button
            onClick={() => {
              setFormError(null);
              createMutation.mutate();
            }}
            disabled={createMutation.isPending || !selectedEmployee || selectedCourses.size === 0}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-accent py-2.5 text-xs font-semibold text-white transition hover:bg-accent-hover disabled:opacity-40"
          >
            <Rocket className="h-3.5 w-3.5" />
            {createMutation.isPending ? 'Assigning...' : 'Assign Courses'}
          </button>
        </div>
      </div>

      {/* --- Assignment history --- */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-ink">Assignment History</h2>
          <div className="flex items-center gap-2">
            {(['all', 'assigned', 'in_progress', 'completed'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={clsx(
                  'rounded-full px-3 py-1.5 text-xs font-semibold transition',
                  statusFilter === s
                    ? 'bg-accent text-white'
                    : 'border border-surface-border bg-surface-card text-ink-muted hover:border-ink',
                )}
              >
                {s === 'all' ? `All (${assignments.length})` : `${STATUS_META[s].label} (${counts[s]})`}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-surface-border bg-surface-card shadow-card">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-surface-border bg-surface text-[11px] uppercase tracking-wider text-ink-muted">
              <tr>
                <th className="px-4 py-3 font-semibold">Learner</th>
                <th className="px-4 py-3 font-semibold">Course</th>
                <th className="px-4 py-3 font-semibold">Due Date</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Final Quiz</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-ink-faint">
                    Loading assignments...
                  </td>
                </tr>
              )}
              {!isLoading && assignments.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-ink-faint">
                    <ClipboardList className="mx-auto mb-2 h-6 w-6 text-ink-faint" />
                    No assignments yet.
                  </td>
                </tr>
              )}
              {assignments.map((a) => {
                const meta = STATUS_META[a.status];
                return (
                  <tr key={a.id} className="border-b border-surface-border last:border-0 hover:bg-surface/60">
                    <td className="px-4 py-3 font-medium text-ink">{a.assignedToName}</td>
                    <td className="px-4 py-3 text-ink-muted">{a.courseName}</td>
                    <td className="px-4 py-3 text-ink-muted">{a.dueDate}</td>
                    <td className="px-4 py-3">
                      <span
                        className={clsx(
                          'inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-semibold',
                          meta.className,
                        )}
                      >
                        {meta.icon}
                        {meta.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {a.finalQuiz ? (
                        <div className="space-y-1">
                          <p className={clsx('text-[11px] font-semibold', FINAL_QUIZ_META[a.finalQuiz.status].className)}>
                            {FINAL_QUIZ_META[a.finalQuiz.status].label}
                            {a.finalQuiz.bestScorePercent !== null && ` · ${a.finalQuiz.bestScorePercent}%`}
                          </p>
                          {a.finalQuiz.attemptsUsed > 0 && (
                            <p className="text-[10px] text-ink-faint">
                              {a.finalQuiz.attemptsUsed} attempt{a.finalQuiz.attemptsUsed === 1 ? '' : 's'} used
                            </p>
                          )}
                          {a.finalQuiz.status === 'failed' && (
                            <button
                              onClick={() => {
                                if (window.confirm(`Give ${a.assignedToName} another attempt at the final quiz?`)) {
                                  grantAttemptMutation.mutate(a.id);
                                }
                              }}
                              disabled={grantAttemptMutation.isPending}
                              className="rounded border border-accent/40 px-2 py-0.5 text-[10px] font-semibold text-accent hover:bg-accent/10 disabled:opacity-50"
                            >
                              Grant another attempt
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="text-[11px] text-ink-faint">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => {
                          if (window.confirm(`Remove this assignment for ${a.assignedToName}?`)) {
                            deleteMutation.mutate(a.id);
                          }
                        }}
                        className="rounded p-1.5 text-ink-muted hover:bg-status-dangerSubtle hover:text-status-danger"
                        title="Remove assignment"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
