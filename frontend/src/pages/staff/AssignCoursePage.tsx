import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listUsersApi, getOrgMetadataApi } from '../../services/users.service';
import { listAssignableCoursesApi, createAssignmentApi } from '../../services/assignments.service';
import { UserSummary } from '../../types/auth.types';
import {
  AlertCircle,
  CheckCircle2,
  Search,
  ChevronDown,
  ChevronRight,
  Layers,
  Timer,
  Zap,
  Rocket,
  User,
  Users,
  MapPin,
} from 'lucide-react';
import clsx from 'clsx';

const SALES_ROLES = ['SO', 'TSM', 'ASM', 'RSM', 'NON_SALES'] as const;

type Mode = 'single' | 'role' | 'region';

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

export const AssignCoursePage: React.FC = () => {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<Mode>('single');

  // --- Single employee ---
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<UserSummary | null>(null);

  // --- Bulk by sales role ---
  const [selectedRoles, setSelectedRoles] = useState<Set<string>>(new Set());

  // --- Bulk by region/territory ---
  const [selectedRegionId, setSelectedRegionId] = useState('');
  const [selectedTerritoryId, setSelectedTerritoryId] = useState('');

  // --- Select Courses ---
  const [selectedCourses, setSelectedCourses] = useState<Map<string, string>>(new Map());
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { data: courses = [] } = useQuery({
    queryKey: ['assignable-courses'],
    queryFn: listAssignableCoursesApi,
  });

  const { data: orgMeta } = useQuery({
    queryKey: ['org-metadata'],
    queryFn: getOrgMetadataApi,
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

  // One listUsersApi call per selected role, merged and de-duplicated — the
  // filter endpoint only accepts a single salesRole value at a time.
  const { data: roleMatches = [], isFetching: isFetchingRoleMatches } = useQuery({
    queryKey: ['bulk-learners-role', Array.from(selectedRoles).sort()],
    queryFn: async () => {
      const lists = await Promise.all(
        Array.from(selectedRoles).map((salesRole) =>
          listUsersApi({ role: 'learner', status: 'active', salesRole, pageSize: 500 }),
        ),
      );
      const byId = new Map<string, UserSummary>();
      lists.forEach((l) => l.items.forEach((u) => byId.set(u.id, u)));
      return Array.from(byId.values());
    },
    enabled: mode === 'role' && selectedRoles.size > 0,
  });

  const { data: regionMatches = [], isFetching: isFetchingRegionMatches } = useQuery({
    queryKey: ['bulk-learners-region', selectedRegionId, selectedTerritoryId],
    queryFn: async () => {
      const res = await listUsersApi({
        role: 'learner',
        status: 'active',
        regionId: selectedRegionId,
        territoryId: selectedTerritoryId || undefined,
        pageSize: 500,
      });
      return res.items;
    },
    enabled: mode === 'region' && Boolean(selectedRegionId),
  });

  // Territories whose area belongs to the selected region — territories
  // only carry an areaId, so the region link goes through the areas table.
  const territoriesInRegion = useMemo(() => {
    if (!orgMeta || !selectedRegionId) return [];
    const areaIdsInRegion = new Set(orgMeta.areas.filter((a) => a.regionId === selectedRegionId).map((a) => a.id));
    return orgMeta.territories.filter((t) => t.areaId && areaIdsInRegion.has(t.areaId));
  }, [orgMeta, selectedRegionId]);

  const targetLearners: UserSummary[] = useMemo(() => {
    if (mode === 'single') return selectedEmployee ? [selectedEmployee] : [];
    if (mode === 'role') return roleMatches;
    return regionMatches;
  }, [mode, selectedEmployee, roleMatches, regionMatches]);

  const isMatching = mode === 'role' ? isFetchingRoleMatches : mode === 'region' ? isFetchingRegionMatches : false;

  const createMutation = useMutation({
    mutationFn: async () => {
      if (targetLearners.length === 0) throw new Error('No learners selected to assign to.');
      if (selectedCourses.size === 0) throw new Error('Select at least one course to assign.');

      const jobs = targetLearners.flatMap((learner) =>
        Array.from(selectedCourses.entries()).map(([courseId, dueDate]) => ({ learner, courseId, dueDate })),
      );
      const results = await Promise.allSettled(
        jobs.map((j) => createAssignmentApi({ courseId: j.courseId, userId: j.learner.id, dueDate: j.dueDate })),
      );
      const failed = results.filter((r) => r.status === 'rejected').length;
      return { total: jobs.length, failed };
    },
    onSuccess: ({ total, failed }) => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      setSelectedCourses(new Map());
      setFormError(null);
      setSuccessMessage(
        failed === 0
          ? `Assigned successfully (${total} assignment${total === 1 ? '' : 's'} created).`
          : `Created ${total - failed} of ${total} assignments — ${failed} failed.`,
      );
    },
    onError: (err: unknown) => {
      setSuccessMessage(null);
      setFormError(err instanceof Error ? err.message : 'Failed to assign courses');
    },
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

  const toggleRole = (role: string) => {
    setSelectedRoles((prev) => {
      const next = new Set(prev);
      if (next.has(role)) next.delete(role);
      else next.add(role);
      return next;
    });
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

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-ink">Assign Courses</h1>
        <p className="mt-1 text-xs text-ink-muted">Select learners and assign relevant learning paths.</p>
      </div>

      <div className="flex items-center gap-2">
        {([
          { key: 'single', label: 'Single Employee', icon: User },
          { key: 'role', label: 'By Sales Role', icon: Users },
          { key: 'region', label: 'By Region / Territory', icon: MapPin },
        ] as const).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setMode(key)}
            className={clsx(
              'flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition',
              mode === key
                ? 'bg-accent text-white'
                : 'border border-surface-border bg-surface-card text-ink-muted hover:border-ink',
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_1.4fr_1fr]">
        {/* --- Target selection (mode-dependent) --- */}
        <div className="space-y-3 rounded-lg border border-surface-border bg-surface-card p-4 shadow-card">
          {mode === 'single' && (
            <>
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
            </>
          )}

          {mode === 'role' && (
            <>
              <h2 className="text-xs font-bold uppercase tracking-wider text-ink-muted">Sales Roles</h2>
              <div className="space-y-1.5">
                {SALES_ROLES.map((role) => (
                  <label
                    key={role}
                    className={clsx(
                      'flex cursor-pointer items-center gap-2.5 rounded-md border px-3 py-2 text-xs font-medium transition',
                      selectedRoles.has(role)
                        ? 'border-accent bg-accent/5 text-ink'
                        : 'border-surface-border text-ink-muted hover:border-ink/30',
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={selectedRoles.has(role)}
                      onChange={() => toggleRole(role)}
                      className="h-3.5 w-3.5 accent-accent"
                    />
                    {role}
                  </label>
                ))}
              </div>
              <div className="rounded-md border border-dashed border-surface-border bg-surface p-3 text-center">
                <p className="text-[11px] text-ink-muted">
                  {isMatching ? 'Finding learners...' : `${targetLearners.length} learner${targetLearners.length === 1 ? '' : 's'} match`}
                </p>
              </div>
            </>
          )}

          {mode === 'region' && (
            <>
              <h2 className="text-xs font-bold uppercase tracking-wider text-ink-muted">Region / Territory</h2>
              <div>
                <label className="text-[11px] font-semibold text-ink-muted">Region</label>
                <select
                  value={selectedRegionId}
                  onChange={(e) => {
                    setSelectedRegionId(e.target.value);
                    setSelectedTerritoryId('');
                  }}
                  className="mt-1 w-full rounded-md border border-surface-border px-2.5 py-2 text-xs focus:border-accent focus:outline-none"
                >
                  <option value="">Select a region...</option>
                  {orgMeta?.regions.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-ink-muted">Territory (optional)</label>
                <select
                  value={selectedTerritoryId}
                  onChange={(e) => setSelectedTerritoryId(e.target.value)}
                  disabled={!selectedRegionId}
                  className="mt-1 w-full rounded-md border border-surface-border px-2.5 py-2 text-xs focus:border-accent focus:outline-none disabled:opacity-50"
                >
                  <option value="">All territories in region</option>
                  {territoriesInRegion.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
                {selectedRegionId && territoriesInRegion.length === 0 && (
                  <p className="mt-1 text-[10px] text-ink-faint">No territories mapped under this region yet.</p>
                )}
              </div>
              <div className="rounded-md border border-dashed border-surface-border bg-surface p-3 text-center">
                <p className="text-[11px] text-ink-muted">
                  {!selectedRegionId
                    ? 'Select a region to see matching learners.'
                    : isMatching
                      ? 'Finding learners...'
                      : `${targetLearners.length} learner${targetLearners.length === 1 ? '' : 's'} match`}
                </p>
              </div>
            </>
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
          {successMessage && (
            <div className="flex items-center gap-2 rounded-lg border border-status-success/30 bg-status-success/10 p-2.5 text-[11px] text-status-success">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-faint">Assignees</p>
            {mode === 'single' ? (
              <p className="mt-1 text-sm font-bold text-ink">{selectedEmployee?.fullName ?? 'None selected'}</p>
            ) : (
              <p className="mt-1 text-sm font-bold text-ink">
                {targetLearners.length > 0
                  ? `${targetLearners.length} learner${targetLearners.length === 1 ? '' : 's'}`
                  : 'None matched yet'}
              </p>
            )}
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
              setSuccessMessage(null);
              createMutation.mutate();
            }}
            disabled={createMutation.isPending || targetLearners.length === 0 || selectedCourses.size === 0}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-accent py-2.5 text-xs font-semibold text-white transition hover:bg-accent-hover disabled:opacity-40"
          >
            <Rocket className="h-3.5 w-3.5" />
            {createMutation.isPending ? 'Assigning...' : 'Assign Courses'}
          </button>
        </div>
      </div>
    </div>
  );
};
