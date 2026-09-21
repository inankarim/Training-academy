import { useQuery } from '@tanstack/react-query';
import { fetchHealth, type DependencyStatus } from '@services/health.service';
import { StatusBadge } from '@components/StatusBadge';
import { RefreshCw, AlertTriangle } from 'lucide-react';
import clsx from 'clsx';

function toneFor(status: DependencyStatus): 'success' | 'warning' | 'danger' {
  if (status === 'up') return 'success';
  if (status === 'not_configured_yet') return 'warning';
  return 'danger';
}

function labelFor(status: DependencyStatus): string {
  if (status === 'up') return 'Connected';
  if (status === 'not_configured_yet') return 'Not configured';
  return 'Unreachable';
}

const DEPENDENCY_LABELS: Record<string, string> = {
  postgres: 'PostgreSQL',
  mongodb: 'MongoDB',
  redis: 'Redis',
};

export function SystemStatusPage() {
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['health'],
    queryFn: fetchHealth,
    refetchInterval: 15000, // keep this live while we're building out infra
  });

  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b border-surface-border bg-charcoal px-8 py-5">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <div>
            <p className="text-sm font-medium text-white/60">Holcim Academy</p>
            <h1 className="text-lg font-semibold text-white">System Status</h1>
          </div>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 rounded border border-white/15 px-3 py-1.5 text-sm text-white/80 transition hover:bg-white/5 hover:text-white"
          >
            <RefreshCw className={clsx('h-3.5 w-3.5', isFetching && 'animate-spin')} />
            Refresh
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-8 py-10">
        <p className="mb-8 max-w-lg text-ink-muted">
          This checks the connection between the frontend, the API, and each data store. It's a
          build-time diagnostic, not a page learners or admins will see.
        </p>

        {isLoading && <p className="text-ink-muted">Checking connectivity…</p>}

        {isError && (
          <div className="flex items-start gap-3 rounded border border-status-danger/30 bg-status-dangerSubtle p-4">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-status-danger" />
            <div>
              <p className="font-medium text-status-danger">Couldn't reach the API</p>
              <p className="mt-1 text-sm text-ink-muted">
                {error instanceof Error ? error.message : 'Unknown error'} — confirm the backend
                is running at the configured API URL.
              </p>
            </div>
          </div>
        )}

        {data && (
          <div className="overflow-hidden rounded-lg border border-surface-border bg-surface-card shadow-card">
            <div className="flex items-center justify-between border-b border-surface-border px-5 py-4">
              <div>
                <p className="font-medium text-ink">{data.service}</p>
                <p className="text-sm text-ink-muted">{data.env}</p>
              </div>
              <StatusBadge
                label={data.success ? 'All systems connected' : 'Degraded'}
                tone={data.success ? 'success' : 'warning'}
              />
            </div>
            <dl>
              {Object.entries(data.dependencies).map(([key, status], i) => (
                <div
                  key={key}
                  className={clsx(
                    'flex items-center justify-between px-5 py-4',
                    i !== 0 && 'border-t border-surface-border',
                  )}
                >
                  <dt className="text-sm font-medium text-ink">
                    {DEPENDENCY_LABELS[key] ?? key}
                  </dt>
                  <dd>
                    <StatusBadge label={labelFor(status)} tone={toneFor(status)} />
                  </dd>
                </div>
              ))}
            </dl>
            <div className="border-t border-surface-border px-5 py-3">
              <p className="font-mono text-xs text-ink-faint">
                Last checked {new Date(data.timestamp).toLocaleTimeString()}
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
