import React from 'react';
import { Signal, User, ChevronLeft, ChevronRight, ArrowLeft, MoreVertical, Search, type LucideIcon } from 'lucide-react';

const NAVY = 'text-[#0A2342]';

export type ScreenTransition = 'push' | 'pop' | 'none';

/**
 * Phone bezel + status bar. Scales down to the viewport on small screens,
 * caps at a real phone's width on large ones.
 *
 * Multi-screen flows pass a `screenKey` per screen: changing it remounts the
 * screen (scroll back to top) and plays `transition` like a native app.
 * `footer` stays pinned to the bottom of the phone (bottom buttons, FABs).
 */
export function PhoneFrame({
  children,
  footer,
  overlay,
  modal,
  screenKey = 'main',
  transition = 'none',
}: {
  children: React.ReactNode;
  footer?: React.ReactNode;
  /** Floats centred over the screen without blocking taps — app toasts/alerts. */
  overlay?: React.ReactNode;
  /** Dims the screen and shows a dialog on top (e.g. a picker). */
  modal?: React.ReactNode;
  screenKey?: string;
  transition?: ScreenTransition;
}) {
  return (
    <div className="w-full max-w-[390px] overflow-hidden rounded-[2.5rem] border-[8px] border-[#111827] bg-white shadow-2xl">
      <div className="flex items-center justify-between px-6 pb-1 pt-2 text-[13px] font-bold text-black">
        <span>2:23</span>
        <span className="flex items-center gap-1 text-[11px]">
          <Signal className="h-3.5 w-3.5" /> 4G
          <span className="rounded bg-green-500 px-1 text-[9px] font-bold text-white">80</span>
        </span>
      </div>
      <div className="relative h-[min(720px,75vh)] overflow-hidden">
        <div
          key={screenKey}
          className={`absolute inset-0 bg-white ${transition === 'push' ? 'oa-push' : transition === 'pop' ? 'oa-pop' : ''}`}
        >
          <div className={`h-full space-y-3 overflow-y-auto px-3 pt-1 ${footer ? 'pb-28' : 'pb-6'}`}>{children}</div>
          {footer && <div className="absolute inset-x-0 bottom-0 px-3 pb-4">{footer}</div>}
          {overlay && (
            <div className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center px-8">{overlay}</div>
          )}
          {modal && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 px-12">{modal}</div>
          )}
        </div>
      </div>
    </div>
  );
}

export function AppHeader({ name, role }: { name: string; role: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl p-1 text-left">
      <span className={`flex h-5 w-5 shrink-0 flex-col justify-center gap-[3px] ${NAVY}`}>
        <span className="h-[2px] w-full rounded bg-current" />
        <span className="h-[2px] w-full rounded bg-current" />
        <span className="h-[2px] w-full rounded bg-current" />
      </span>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-200">
        <User className="h-5 w-5 text-slate-500" />
      </span>
      <div className="min-w-0 flex-1">
        <p className={`truncate text-[14px] font-extrabold leading-tight ${NAVY}`}>{name}</p>
        <p className="text-[13px] font-extrabold leading-tight text-[#0E7490]">{role}</p>
      </div>
    </div>
  );
}

export function BellButton({ badge }: { badge: string }) {
  return (
    <div className="relative flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm">
      <svg viewBox="0 0 24 24" className={`h-4 w-4 ${NAVY}`} fill="none" stroke="currentColor" strokeWidth={2}>
        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
        <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
      </svg>
      <span className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-[#E02424] px-1.5 text-[9px] font-extrabold leading-4 text-white">
        {badge}
      </span>
    </div>
  );
}

export function FocusAreaBlock({ fields }: { fields: Array<{ label: string; value: string }> }) {
  return (
    <div className="rounded-xl p-1 text-left">
      <div className="flex items-center gap-2.5">
        <p className={`text-[22px] font-black leading-none ${NAVY}`}>Focus Area</p>
        <span className="rounded-sm bg-[#3CC35C] px-2 py-1 text-[12px] font-extrabold text-white">Cement B2C</span>
      </div>
      <div className="mt-2.5 flex flex-wrap gap-x-2 gap-y-2">
        {fields.map((f) => (
          <div key={f.label}>
            <p className="text-[12px] font-bold text-slate-700">{f.label}</p>
            <span className="inline-block rounded-sm bg-[#3CC35C] px-1.5 py-0.5 text-[12px] font-extrabold text-white">
              {f.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DateField({ value }: { value: string }) {
  return (
    <div className="relative mt-2 rounded-md border border-slate-400 px-3 py-2.5">
      <span className="absolute -top-2 left-2 bg-white px-1 text-[10px] font-semibold text-slate-700">Date</span>
      <div className="flex items-center justify-between">
        <span className="text-[15px] font-semibold text-slate-900">{value}</span>
        <svg viewBox="0 0 24 24" className="h-4 w-4 text-slate-700" fill="none" stroke="currentColor" strokeWidth={2}>
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path d="M16 2v4M8 2v4M3 10h18" />
          <rect x="7" y="13" width="3" height="3" fill="currentColor" />
        </svg>
      </div>
    </div>
  );
}

/**
 * One metric inside a Today/MTD card. "Scheduled" and its figures sit on one
 * line when they fit and wrap (figures right-aligned underneath) when they
 * don't — exactly how the real app reflows on a narrow card. MTD Orders vs
 * Delivery has no "Scheduled" label, only the figures.
 */
export function StatRow({
  label,
  value,
  scheduled,
  percent = 0,
  showScheduledLabel = true,
  figuresOnOwnLine = false,
}: {
  label: string;
  value: string;
  scheduled: string;
  percent?: number;
  showScheduledLabel?: boolean;
  /** The TSM app always puts the figures on their own right-aligned line under "Scheduled". */
  figuresOnOwnLine?: boolean;
}) {
  return (
    <div className="mt-4 first:mt-0">
      <p className={`text-[12px] font-extrabold leading-tight ${NAVY}`}>{label}</p>
      <p className={`mt-1 text-[19px] font-black leading-tight ${NAVY}`}>{value}</p>
      <div className={`mt-1 flex flex-wrap items-baseline gap-x-2 ${NAVY}`}>
        {showScheduledLabel && <span className="text-[13px] font-extrabold">Scheduled</span>}
        <span className={`ml-auto text-[11px] font-extrabold ${figuresOnOwnLine ? 'basis-full text-right' : ''}`}>
          {scheduled}
        </span>
      </div>
      <div className="mt-1.5 h-[18px] w-full overflow-hidden rounded-full bg-[#C9E9FB]">
        <div className="h-full rounded-full bg-[#EF4136]" style={{ width: `${Math.min(100, Math.max(0, percent))}%` }} />
      </div>
    </div>
  );
}

export function StatCard({ children }: { children: React.ReactNode }) {
  return <div className="h-full rounded-lg border border-slate-200 bg-white p-3 text-left shadow-md">{children}</div>;
}

export function SummaryTile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between gap-1 rounded-lg border-2 border-[#0A3D52] bg-[#0D6E8A] px-2.5 py-2.5 text-[#E3F6FC]">
      <span className="truncate text-[12px] font-extrabold">{label}</span>
      <span className="shrink-0 text-[13px] font-extrabold">{value}</span>
    </div>
  );
}

export function ActivityTile({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <div className="overflow-hidden rounded-xl shadow-md">
      <div className="flex h-[68px] items-center justify-center bg-[#0A2E57]">
        <Icon className="h-8 w-8 text-white" strokeWidth={1.5} />
      </div>
      <div className="bg-[#EEF1FB] px-2 py-2.5 text-center">
        <p className={`truncate text-[13px] font-extrabold ${NAVY}`}>{label}</p>
      </div>
    </div>
  );
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return <p className={`text-[19px] font-black ${NAVY}`}>{children}</p>;
}

/** Inner-screen top bar: back arrow, centred title, overflow menu — as on Journey Cycle Plan. */
export function ScreenTopBar({
  title,
  onBack,
  showSearch = false,
  showMenu = true,
  backStyle = 'chevron',
}: {
  title: string;
  onBack?: () => void;
  showSearch?: boolean;
  showMenu?: boolean;
  /** Most screens use a chevron; a few (e.g. Visit Activity) use an arrow. */
  backStyle?: 'chevron' | 'arrow';
}) {
  const BackIcon = backStyle === 'arrow' ? ArrowLeft : ChevronLeft;
  return (
    <div className={`flex items-center justify-between px-1 py-1 ${NAVY}`}>
      <button type="button" onClick={onBack} aria-label="Back" className="-m-1 p-1" disabled={!onBack}>
        <BackIcon className="h-5 w-5" strokeWidth={2.5} />
      </button>
      <p className="text-[15px] font-black">{title}</p>
      <span className="flex min-w-5 items-center justify-end gap-2.5">
        {showSearch && <Search className="h-5 w-5" strokeWidth={2.5} />}
        {showMenu && <MoreVertical className="h-5 w-5" strokeWidth={2.5} />}
      </span>
    </div>
  );
}

/** One row of an inner-screen menu (icon, title, optional subtitle, chevron). */
export function MenuRow({ icon: Icon, title, subtitle }: { icon: LucideIcon; title: string; subtitle?: string }) {
  return (
    <div className="flex items-center gap-3 rounded-md border border-slate-200 bg-[#EEF1FB] px-3 py-3.5 shadow-md">
      <Icon className={`h-7 w-7 shrink-0 ${NAVY}`} strokeWidth={1.75} />
      <div className="min-w-0 flex-1">
        <p className={`text-[15px] font-black leading-tight ${NAVY}`}>{title}</p>
        {subtitle && <p className="mt-0.5 text-[11px] font-bold leading-tight text-[#34507A]">{subtitle}</p>}
      </div>
      <ChevronRight className={`h-5 w-5 shrink-0 ${NAVY}`} strokeWidth={2.5} />
    </div>
  );
}
