/* ============================================================================
   One App Training — Portable UI Primitives
   ----------------------------------------------------------------------------
   Every visual pattern from DESIGN_TEMPLATE.md §6, extracted as pure
   presentational components. No training state, no fixtures, no router —
   drop this file into the new project, point it at your own `cn` helper, and
   compose screens from it.

   Requires: react, lucide-react, tokens.css, and a `cn()` built from
   clsx + tailwind-merge.

   This file is reference material, not part of the running app.
   ========================================================================= */

import type { ReactNode } from "react";
import {
  Bell,
  CalendarCheck2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  CircleAlert,
  Menu,
  Trash2,
  UserCircle2,
} from "lucide-react";

import { cn } from "@/lib/utils";

/* ---------------------------------------------------------------------------
   Pulse — the "touch this next" affordance.
   Exactly one element on screen may be pulsing at any moment.
   -------------------------------------------------------------------------*/
export const pulseIf = (active?: boolean) => (active ? " pulse-target" : "");

/* ===========================================================================
   Phone frame
   ========================================================================= */

export function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-[420px] lg:max-w-[400px]">
      <div className="relative overflow-hidden rounded-[42px] border-[12px] border-navy bg-white shadow-2xl">
        <div className="flex h-6 items-center justify-center bg-navy text-[10px] font-bold text-white">
          <div className="absolute left-1/2 top-0 h-4 w-24 -translate-x-1/2 rounded-b-2xl bg-navy" />
        </div>
        <div className="relative h-[720px] overflow-y-auto bg-white">{children}</div>
      </div>
    </div>
  );
}

/** On a real phone there is no frame — the simulated app fills the device. */
export function PhoneFrameMobile({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-white">{children}</div>;
}

/* ===========================================================================
   Headers
   ========================================================================= */

export function AppHeader({
  name,
  role,
  staffId,
  notificationCount,
  onMenu,
  onProfile,
  onNotifications,
}: {
  name: string;
  role: string;
  staffId: string;
  notificationCount?: number;
  onMenu?: () => void;
  onProfile?: () => void;
  onNotifications?: () => void;
}) {
  return (
    <div className="flex items-center gap-3 px-4 pt-4">
      <button onClick={onMenu} className="rounded-lg p-2 hover:bg-muted">
        <Menu className="h-6 w-6 text-navy" />
      </button>
      <button onClick={onProfile} className="flex items-center gap-2 rounded-lg p-1 hover:bg-muted">
        <UserCircle2 className="h-11 w-11 text-muted-foreground" />
        <div className="text-left leading-tight">
          <div className="text-lg font-extrabold text-navy">{name}</div>
          <div className="text-xs font-bold text-teal">
            {role} <span className="text-navy">{staffId}</span>
          </div>
        </div>
      </button>
      <button onClick={onNotifications} className="relative ml-auto rounded-full p-2 hover:bg-muted">
        <Bell className="h-6 w-6 text-navy" />
        {!!notificationCount && (
          <span className="absolute -right-0 -top-0 rounded-full bg-destructive px-1.5 text-[10px] font-bold text-white">
            {notificationCount}
          </span>
        )}
      </button>
    </div>
  );
}

export function ScreenHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="flex items-center gap-2 px-4 pt-5 pb-4">
      <button onClick={onBack} className="rounded-lg p-2 hover:bg-muted">
        <ChevronLeft className="h-7 w-7 text-navy" />
      </button>
      <h2 className="flex-1 text-center text-xl font-extrabold text-navy">{title}</h2>
      {/* spacer keeps the title optically centred against the back button */}
      <div className="w-11" />
    </div>
  );
}

/* ===========================================================================
   Typography helpers
   ========================================================================= */

export function ScreenTitle({ children }: { children: ReactNode }) {
  return <h1 className="text-3xl font-extrabold text-navy">{children}</h1>;
}

export function SectionTitle({ children, className }: { children: ReactNode; className?: string }) {
  return <h2 className={cn("text-2xl font-extrabold text-navy", className)}>{children}</h2>;
}

export function Eyebrow({ icon, children }: { icon?: ReactNode; children: ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-teal">
      {icon}
      {children}
    </div>
  );
}

/* ===========================================================================
   Pills, chips, meters
   ========================================================================= */

export function Pill({
  children,
  size = "sm",
  onClick,
}: {
  children: ReactNode;
  size?: "sm" | "lg";
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-lg bg-mint px-3 py-1.5 font-bold text-mint-foreground",
        size === "lg" ? "text-lg shadow-sm" : "text-sm",
      )}
    >
      {children}
    </button>
  );
}

/** Label above a mint pill — the dashboard's Region / Area / Territory block. */
export function LabelledPill({
  label,
  value,
  onClick,
}: {
  label: string;
  value: string;
  onClick?: () => void;
}) {
  return (
    <button onClick={onClick} className="text-left">
      <div className="text-sm font-bold text-muted-foreground">{label}</div>
      <div className="mt-1 inline-block rounded-lg bg-mint px-3 py-1.5 text-sm font-bold text-mint-foreground">
        {value}
      </div>
    </button>
  );
}

/** Trough-and-fill meter. `tone` picks mint (explore) or teal (guided). */
export function Meter({
  value,
  tone = "mint",
  className,
}: {
  value: number; // 0..1
  tone?: "mint" | "teal";
  className?: string;
}) {
  return (
    <div className={cn("h-3 overflow-hidden rounded-full bg-muted", className)}>
      <div
        className={cn("h-full rounded-full transition-all", tone === "teal" ? "bg-teal" : "bg-mint")}
        style={{ width: `${Math.min(Math.max(value, 0), 1) * 100}%` }}
      />
    </div>
  );
}

/** Percentage + scheduled ratio + flat soft-blue trough. Two per card. */
export function MetricRow({
  title,
  percent = "0.00 %",
  ratioLabel = "Scheduled",
  ratio,
  onClick,
}: {
  title: string;
  percent?: string;
  ratioLabel?: string;
  ratio: string;
  onClick?: () => void;
}) {
  return (
    <button onClick={onClick} className="w-full text-left">
      <div className="text-sm font-extrabold text-navy">{title}</div>
      <div className="mt-1 text-2xl font-extrabold text-navy">{percent}</div>
      <div className="mt-1 flex items-center justify-between text-xs font-bold text-muted-foreground">
        <span>{ratioLabel}</span>
        <span>{ratio}</span>
      </div>
      <div className="mt-1 h-2 rounded-full bg-soft-blue" />
    </button>
  );
}

export function MetricCard({ children }: { children: ReactNode }) {
  return <div className="rounded-2xl bg-white p-4 shadow-md ring-1 ring-border">{children}</div>;
}

/** Teal label/value chip. Laid out grid-cols-2 gap-3. */
export function StatChip({
  label,
  value,
  onClick,
}: {
  label: string;
  value: ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-between rounded-xl bg-teal px-4 py-3 text-left text-teal-foreground shadow-sm"
    >
      <span className="text-sm font-extrabold">{label}</span>
      <span className="text-lg font-extrabold">{value}</span>
    </button>
  );
}

/* ===========================================================================
   Navigation surfaces
   ========================================================================= */

/** The signature two-tone tile: navy icon plate over a soft-blue label strip. */
export function ActivityTile({
  icon,
  label,
  onClick,
  pulse,
}: {
  icon: ReactNode;
  label: string;
  onClick?: () => void;
  pulse?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={
        "flex flex-col overflow-hidden rounded-xl shadow-md transition active:scale-[0.98]" +
        pulseIf(pulse)
      }
    >
      <div className="flex flex-1 items-center justify-center bg-navy py-5 text-white">{icon}</div>
      <div className="bg-soft-blue py-2 text-center text-sm font-extrabold text-navy">{label}</div>
    </button>
  );
}

/** Soft-blue list row with icon, title, optional subtitle and teal chevron. */
export function MenuRow({
  icon,
  title,
  subtitle,
  onClick,
  pulse,
}: {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  onClick?: () => void;
  pulse?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={
        "flex w-full items-center gap-4 rounded-2xl bg-soft-blue p-4 text-left shadow-sm transition active:scale-[0.99]" +
        pulseIf(pulse)
      }
    >
      {icon}
      <div className="flex-1">
        <div className="text-lg font-extrabold text-navy">{title}</div>
        {subtitle && <div className="text-sm font-bold text-navy/70">{subtitle}</div>}
      </div>
      <ChevronRight className="h-6 w-6 text-teal" />
    </button>
  );
}

export function TabStrip({
  tabs,
  active,
  onChange,
}: {
  tabs: string[];
  active: string;
  onChange?: (t: string) => void;
}) {
  return (
    <div
      className="grid border-b border-border px-4 text-center text-lg font-extrabold"
      style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
    >
      {tabs.map((t) => (
        <button
          key={t}
          onClick={() => onChange?.(t)}
          className={t === active ? "border-b-4 border-navy pb-2 text-navy" : "pb-2 text-navy/60"}
        >
          {t}
        </button>
      ))}
    </div>
  );
}

/* ===========================================================================
   Records
   ========================================================================= */

export function EntityCard({ children }: { children: ReactNode }) {
  return <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">{children}</div>;
}

/**
 * Field row. The colour contract across the whole app:
 *   navy = what the field is called, teal = what it says.
 */
export function FieldRow({
  icon,
  label,
  value,
}: {
  icon?: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-wrap items-start gap-1.5 text-[15px] font-bold text-navy">
      {icon && <span className="mt-1 text-teal">{icon}</span>}
      <span className="font-extrabold">{label}</span>
      <span className="text-teal">{value}</span>
    </div>
  );
}

export function StatusChip({ done, doneLabel = "Completed", pendingLabel = "No Status" }: {
  done?: boolean;
  doneLabel?: string;
  pendingLabel?: string;
}) {
  return (
    <span
      className={cn(
        "ml-auto flex items-center gap-1 rounded-md px-2 py-1 text-sm font-extrabold",
        done ? "bg-emerald-100 text-emerald-700" : "bg-sky-100 text-navy",
      )}
    >
      {done ? <CheckCircle2 className="h-4 w-4" /> : <CircleAlert className="h-4 w-4" />}
      {done ? doneLabel : pendingLabel}
    </span>
  );
}

/** Card footer: status label left, green "Details »"-style action right. */
export function CardFooterAction({
  icon,
  label,
  actionLabel = "Details »",
  onAction,
  pulse,
}: {
  icon?: ReactNode;
  label: string;
  actionLabel?: string;
  onAction?: () => void;
  pulse?: boolean;
}) {
  return (
    <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
      <div className="flex items-center gap-2 text-sm font-bold text-navy">
        {icon && <span className="text-teal">{icon}</span>}
        {label}
      </div>
      <button
        onClick={onAction}
        className={
          "rounded-lg px-3 py-1 text-sm font-extrabold text-green-700 hover:bg-green-50" +
          pulseIf(pulse)
        }
      >
        {actionLabel}
      </button>
    </div>
  );
}

/* ===========================================================================
   Actions & forms
   ========================================================================= */

/** Full-width teal CTA. Stacked with space-y-3. */
export function ActionButton({
  icon,
  label,
  onClick,
  pulse,
}: {
  icon?: ReactNode;
  label: string;
  onClick?: () => void;
  pulse?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={
        "flex w-full items-center justify-center gap-2 rounded-xl bg-teal py-4 text-lg font-extrabold text-teal-foreground shadow-md transition active:scale-[0.98]" +
        pulseIf(pulse)
      }
    >
      {icon}
      {label}
    </button>
  );
}

export function FormSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl bg-muted p-4">
      <h3 className="text-lg font-extrabold text-navy">{title}</h3>
      {children}
    </section>
  );
}

/** Select-like field. Caret is a rotated ChevronRight, matching the real app. */
export function SelectField({
  placeholder,
  value,
  onClick,
  pulse,
  emphasised,
  trailing,
}: {
  placeholder: string;
  value?: string | null;
  onClick?: () => void;
  pulse?: boolean;
  emphasised?: boolean;
  trailing?: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={
        cn(
          "mt-3 flex w-full items-center justify-between rounded-lg bg-white px-4 py-4 text-left",
          emphasised ? "border-2 border-navy/60" : "border border-border",
        ) + pulseIf(pulse)
      }
    >
      <span className={cn("text-lg font-extrabold", value ? "text-navy" : "text-navy/80")}>
        {value || placeholder}
      </span>
      {trailing ?? <ChevronRight className="h-5 w-5 rotate-90 text-navy" />}
    </button>
  );
}

export function DateField({ label, onClick }: { label: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="mt-3 flex w-full items-center justify-between rounded-lg border-2 border-navy/60 bg-white px-4 py-4 text-left"
    >
      <span className="text-lg font-extrabold text-navy">{label}</span>
      <CalendarCheck2 className="h-5 w-5 text-navy" />
    </button>
  );
}

/** Numeric/text input. Placeholder is as heavy as the value — intentional. */
export function TextField({
  placeholder,
  value,
  onChange,
  onFocus,
  type = "text",
  pulse,
}: {
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  onFocus?: () => void;
  type?: "text" | "number";
  pulse?: boolean;
}) {
  return (
    <div
      className={
        "mt-3 flex items-center rounded-lg border border-border bg-white px-4 py-2" + pulseIf(pulse)
      }
    >
      <input
        type={type}
        inputMode={type === "number" ? "numeric" : undefined}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        className="w-full bg-transparent py-2 text-lg font-extrabold text-navy placeholder:font-extrabold placeholder:text-navy/80 focus:outline-none"
      />
    </div>
  );
}

export function ComputedTotal({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="mt-3">
      <div className="text-sm font-bold text-muted-foreground">{label}</div>
      <div className="text-2xl font-extrabold text-navy">{value}</div>
    </div>
  );
}

/**
 * Sticky commit bar.
 * `lg:absolute` is load-bearing — without it the bar escapes the phone frame
 * on desktop. Give the screen body `pb-32` to clear it.
 */
export function CommitBar({
  onDiscard,
  discardLabel = "Discard",
  onSubmit,
  submitLabel = "Submit",
  submitPulse,
}: {
  onDiscard?: () => void;
  discardLabel?: string;
  onSubmit?: () => void;
  submitLabel?: string;
  submitPulse?: boolean;
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-10 space-y-2 bg-gradient-to-t from-white via-white to-transparent p-4 lg:absolute">
      {onDiscard && (
        <button
          onClick={onDiscard}
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-destructive bg-red-50 py-4 text-lg font-extrabold text-destructive"
        >
          <Trash2 className="h-5 w-5" />
          {discardLabel}
        </button>
      )}
      <button
        onClick={onSubmit}
        className={
          "flex w-full items-center justify-center gap-2 rounded-xl bg-blue-500 py-4 text-lg font-extrabold text-white shadow-lg" +
          pulseIf(submitPulse)
        }
      >
        <CheckCircle2 className="h-5 w-5" />
        {submitLabel}
      </button>
    </div>
  );
}

/* ===========================================================================
   In-phone picker — `absolute`, so the bezel clips it.
   Selection is local and only commits on Ok.
   ========================================================================= */

export function PickerModal({
  title,
  children,
  onCancel,
  onConfirm,
  cancelLabel = "Cancel",
  confirmLabel = "Ok",
}: {
  title: string;
  children: ReactNode;
  onCancel: () => void;
  onConfirm: () => void;
  cancelLabel?: string;
  confirmLabel?: string;
}) {
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-navy/50 p-4">
      <div className="pop-in w-full max-w-md rounded-2xl bg-soft-blue p-5 shadow-2xl">
        <h3 className="mb-3 text-2xl font-extrabold text-navy">{title}</h3>
        <div className="max-h-[420px] space-y-2 overflow-y-auto">{children}</div>
        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="rounded-lg bg-white px-5 py-2 text-lg font-extrabold text-navy shadow"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className="rounded-lg bg-navy px-5 py-2 text-lg font-extrabold text-white shadow"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function PickerRow({
  selected,
  thumbLabel = "Bag",
  label,
  onClick,
  pulse,
}: {
  selected?: boolean;
  thumbLabel?: string;
  label: string;
  onClick?: () => void;
  pulse?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={
        "flex w-full items-center gap-3 rounded-lg bg-white p-2 text-left transition hover:bg-white/80" +
        pulseIf(pulse)
      }
    >
      {selected ? (
        <CheckCircle2 className="h-6 w-6 shrink-0 text-teal" />
      ) : (
        <Circle className="h-6 w-6 shrink-0 text-navy/70" />
      )}
      <div className="grid h-12 w-12 shrink-0 place-items-center rounded bg-muted text-xs font-bold text-navy/70">
        {thumbLabel}
      </div>
      <span className="text-base font-extrabold text-navy">{label}</span>
    </button>
  );
}

/* ===========================================================================
   Coaching surfaces
   ========================================================================= */

/** Teacher modal — `fixed`, so it covers the page, not just the phone. */
export function TrainerOverlay({
  open,
  title,
  body,
  onClose,
  confirmText = "OK, got it!",
  icon,
  tone = "info",
}: {
  open: boolean;
  title: string;
  body: ReactNode;
  onClose: () => void;
  confirmText?: string;
  icon?: ReactNode;
  tone?: "info" | "warn" | "success";
}) {
  if (!open) return null;
  const toneRing =
    tone === "warn" ? "ring-amber-400" : tone === "success" ? "ring-emerald-400" : "ring-teal";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/60 p-4 backdrop-blur-sm">
      <div className={`pop-in relative w-full max-w-md rounded-3xl bg-card p-6 shadow-2xl ring-4 ${toneRing}`}>
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 rounded-full p-2 text-muted-foreground hover:bg-muted"
        >
          {/* lucide X */}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
        {icon && <div className="mb-3 text-5xl">{icon}</div>}
        <h3 className="mb-3 text-2xl font-extrabold text-navy">{title}</h3>
        <div className="text-lg leading-relaxed text-foreground">{body}</div>
        <button
          onClick={onClose}
          className="mt-6 w-full rounded-2xl bg-teal py-4 text-lg font-bold text-teal-foreground shadow-md transition hover:brightness-110 active:scale-[0.98]"
        >
          {confirmText}
        </button>
      </div>
    </div>
  );
}

/** Non-blocking redirect. Caller clears it after ~2200ms. */
export function WrongTapToast({ message }: { message: string }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
      <div className="pop-in flex items-center gap-3 rounded-2xl bg-amber-100 px-5 py-4 text-amber-900 shadow-xl ring-2 ring-amber-400">
        <span className="text-2xl">👉</span>
        <span className="text-base font-extrabold">{message}</span>
      </div>
    </div>
  );
}

/** Mobile instruction banner — mirrors the desktop teacher card's state. */
export function MobileInstructionBanner({
  icon,
  kicker,
  instruction,
}: {
  icon: ReactNode;
  kicker: string;
  instruction: string;
}) {
  return (
    <div className="sticky top-0 z-30 border-b border-teal/40 bg-navy px-4 py-3 text-white shadow-lg lg:hidden">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-teal">{icon}</div>
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-white/70">{kicker}</div>
          <div className="truncate text-base font-extrabold">{instruction}</div>
        </div>
      </div>
    </div>
  );
}

/** Amber hint strip inside the teacher card. */
export function HintStrip({ children }: { children: ReactNode }) {
  return (
    <p className="mt-2 rounded-lg bg-highlight/40 p-2 text-sm font-semibold text-navy">
      💡 {children}
    </p>
  );
}

/* ===========================================================================
   Shell
   ========================================================================= */

export function TrainingShell({
  banner,
  sidebar,
  children,
}: {
  banner?: ReactNode;
  sidebar: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-soft-blue via-background to-white">
      {banner}
      <div className="mx-auto grid max-w-7xl gap-6 p-4 lg:grid-cols-[minmax(320px,380px)_1fr] lg:p-8">
        <aside className="hidden lg:block">
          <div className="sticky top-8 space-y-4">{sidebar}</div>
        </aside>
        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}

export function TeacherCardShell({ children }: { children: ReactNode }) {
  return <div className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-border">{children}</div>;
}

/** Soft-blue body block inside the teacher card — one per level. */
export function TeacherPanel({ children }: { children: ReactNode }) {
  return <div className="mt-5 rounded-2xl bg-soft-blue p-4">{children}</div>;
}
