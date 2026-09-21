import clsx from 'clsx';

type Tone = 'success' | 'warning' | 'danger' | 'neutral';

const toneStyles: Record<Tone, string> = {
  success: 'bg-status-successSubtle text-status-success',
  warning: 'bg-status-warningSubtle text-status-warning',
  danger: 'bg-status-dangerSubtle text-status-danger',
  neutral: 'bg-surface-border text-ink-muted',
};

const dotStyles: Record<Tone, string> = {
  success: 'bg-status-success',
  warning: 'bg-status-warning',
  danger: 'bg-status-danger',
  neutral: 'bg-ink-faint',
};

export function StatusBadge({ label, tone }: { label: string; tone: Tone }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1 text-sm font-medium',
        toneStyles[tone],
      )}
    >
      <span className={clsx('h-1.5 w-1.5 rounded-full', dotStyles[tone])} aria-hidden="true" />
      {label}
    </span>
  );
}
