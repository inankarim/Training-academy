import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listAssignmentsApi, deleteAssignmentApi, grantFinalQuizAttemptApi } from '../../services/assignments.service';
import { AssignmentStatus } from '../../types/assignments.types';
import { ClipboardList, Trash2, AlertCircle, CheckCircle2, Clock, PlayCircle, Search } from 'lucide-react';
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

const SALES_ROLES = ['SO', 'TSM', 'ASM', 'RSM', 'NON_SALES'] as const;

export const AssignmentHistoryPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<AssignmentStatus | 'all'>('all');
  const [roleFilter, setRoleFilter] = useState<string | 'all'>('all');
  const [search, setSearch] = useState('');

  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ['assignments', statusFilter],
    queryFn: () => listAssignmentsApi(statusFilter === 'all' ? {} : { status: statusFilter }),
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

  const counts = useMemo(() => {
    const c = { assigned: 0, in_progress: 0, completed: 0, overdue: 0 };
    assignments.forEach((a) => {
      c[a.status] += 1;
    });
    return c;
  }, [assignments]);

  // Role + free-text search are refined client-side — the server already
  // returns everything matching the status filter, and both learner name and
  // course name are already present on each row, so no extra round trip is
  // needed for a search this small.
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return assignments.filter((a) => {
      if (roleFilter !== 'all' && a.assignedToSalesRole !== roleFilter) return false;
      if (q && !a.assignedToName.toLowerCase().includes(q) && !a.courseName.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [assignments, roleFilter, search]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-ink">Assignment History</h1>
        <p className="mt-1 text-xs text-ink-muted">Track every course assignment and its progress.</p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
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

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="rounded-md border border-surface-border bg-surface-card px-2.5 py-1.5 text-xs font-medium text-ink focus:border-accent focus:outline-none"
          >
            <option value="all">All roles</option>
            {SALES_ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-faint" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search learner or course..."
              className="w-56 rounded-md border border-surface-border bg-surface-card py-1.5 pl-8 pr-2.5 text-xs focus:border-accent focus:outline-none"
            />
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-surface-border bg-surface-card shadow-card">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-surface-border bg-surface text-[11px] uppercase tracking-wider text-ink-muted">
            <tr>
              <th className="px-4 py-3 font-semibold">Learner</th>
              <th className="px-4 py-3 font-semibold">Role</th>
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
                <td colSpan={7} className="px-4 py-8 text-center text-ink-faint">
                  Loading assignments...
                </td>
              </tr>
            )}
            {!isLoading && filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-ink-faint">
                  <ClipboardList className="mx-auto mb-2 h-6 w-6 text-ink-faint" />
                  No assignments match these filters.
                </td>
              </tr>
            )}
            {filtered.map((a) => {
              const meta = STATUS_META[a.status];
              return (
                <tr key={a.id} className="border-b border-surface-border last:border-0 hover:bg-surface/60">
                  <td className="px-4 py-3 font-medium text-ink">{a.assignedToName}</td>
                  <td className="px-4 py-3 text-ink-muted">{a.assignedToSalesRole ?? '—'}</td>
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
  );
};
