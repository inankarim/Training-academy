import React, { useRef, useState } from 'react';
import { CalendarDays } from 'lucide-react';

const NAVY = 'text-[#0A2342]';

/** Grey section card with a navy heading, as on Create Request / Preview. */
export function FormCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-md bg-[#E8E9EC] p-3 shadow-md">
      <p className={`mb-2.5 text-[15px] font-black ${NAVY}`}>{title}</p>
      <div className="space-y-2.5">{children}</div>
    </div>
  );
}

function FloatingLabel({ text }: { text: string }) {
  return (
    <span className="absolute -top-2 left-3 bg-white px-1 text-[10px] font-bold leading-none text-slate-800">{text}</span>
  );
}

/** Outlined dropdown: label sits inside until opened/chosen, then floats onto the border. */
export function OutlinedSelect<T extends string>({
  label,
  value,
  options,
  open,
  onToggle,
  onSelect,
}: {
  label: string;
  value: T | '';
  options: Array<{ value: T; label: string }>;
  open: boolean;
  onToggle: () => void;
  onSelect: (value: T) => void;
}) {
  const selected = options.find((o) => o.value === value);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        className={`relative flex w-full items-center justify-between rounded-md border bg-white px-4 py-3 text-left ${
          open ? 'border-slate-700' : 'border-slate-400'
        }`}
      >
        {(open || selected) && <FloatingLabel text={label} />}
        <span className={`text-[14px] font-extrabold ${selected ? 'text-slate-900' : open ? 'text-slate-600' : 'text-slate-900'}`}>
          {selected?.label ?? label}
        </span>
        <span className="text-[10px] text-slate-700">▼</span>
      </button>
      {open && (
        <div className="oa-drop absolute inset-x-0 top-full z-20 bg-[#EEF1FB] py-1 shadow-lg">
          {options.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => onSelect(o.value)}
              className="block w-full px-4 py-3 text-left text-[14px] font-extrabold text-slate-900 hover:bg-[#E0E5F7]"
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Outlined text field: label inside when empty, floats onto the border when focused or filled. */
export function OutlinedInput({
  label,
  value,
  onChange,
  invalid = false,
  error,
  numeric = false,
  variant = 'dark',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  invalid?: boolean;
  /** Shown under the field in red. */
  error?: string;
  /** Numbers only (opens the number keypad on phones). */
  numeric?: boolean;
  /** 'dark' = thick dark border (Visit Information); 'light' = thin grey border (Add Brand). */
  variant?: 'dark' | 'light';
}) {
  const [focused, setFocused] = useState(false);
  const floated = focused || value !== '';
  const bad = invalid || Boolean(error);
  const border = bad
    ? 'border-red-500'
    : focused
      ? 'border-[#0A2E57]'
      : variant === 'light'
        ? 'border-slate-400'
        : 'border-slate-700';
  return (
    <div>
      <label className={`relative block rounded-md bg-white px-4 py-2.5 ${variant === 'light' ? 'border' : 'border-2'} ${border}`}>
        {floated && <FloatingLabel text={label} />}
        <input
          value={value}
          onChange={(e) => onChange(numeric ? e.target.value.replace(/[^0-9.]/g, '') : e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={floated ? '' : label}
          inputMode={numeric ? 'decimal' : undefined}
          className="w-full bg-transparent text-[14px] font-extrabold text-slate-900 outline-none placeholder:text-slate-900"
        />
      </label>
      {error && <p className="mt-1 px-1 text-[11px] font-bold text-red-600">{error}</p>}
    </div>
  );
}

/** dd/mm/yyyy, as the One App shows dates in fields. */
export function formatDateField(iso: string): string {
  const [y, m, d] = iso.split('-');
  return y ? `${d}/${m}/${y}` : '';
}

/** "12 Oct 2026", as the One App shows dates on request cards. */
export function formatDateCard(iso: string): string {
  const date = new Date(`${iso}T00:00:00`);
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

/** Date field styled like the app; opens the device's native date picker. */
export function OutlinedDateInput({
  label,
  value,
  onChange,
  invalid = false,
}: {
  label: string;
  value: string;
  onChange: (iso: string) => void;
  invalid?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const openPicker = () => {
    const input = inputRef.current;
    if (!input) return;
    try {
      input.showPicker();
    } catch {
      input.focus();
    }
  };
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={openPicker}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && openPicker()}
      className={`relative flex cursor-pointer items-center justify-between rounded-md border bg-white px-4 py-2.5 ${
        invalid ? 'border-red-500' : 'border-slate-400'
      }`}
    >
      {value && <FloatingLabel text={label} />}
      <span className="text-[15px] font-extrabold text-slate-900">{value ? formatDateField(value) : label}</span>
      <CalendarDays className="h-4 w-4 text-slate-700" />
      <input
        ref={inputRef}
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pointer-events-none absolute bottom-0 left-0 h-0 w-0 opacity-0"
        tabIndex={-1}
        aria-label={label}
      />
    </div>
  );
}

/** Label/value pair on the Preview screen. */
export function PreviewField({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-2">
      <p className="text-[12px] font-bold text-slate-600">{label}</p>
      <p className="text-[16px] font-black leading-tight text-slate-900">{value}</p>
    </div>
  );
}

/** "Select …" picker dialog with radio options and Cancel / Ok — pass it to PhoneFrame's `modal`. */
export function RadioDialog({
  title,
  options,
  selected,
  onSelect,
  onCancel,
  onOk,
  renderThumb,
}: {
  title: string;
  options: string[];
  selected: string;
  onSelect: (option: string) => void;
  onCancel: () => void;
  onOk: () => void;
  /** Optional image beside each option (e.g. a product bag). */
  renderThumb?: (option: string) => React.ReactNode;
}) {
  return (
    <div className="oa-toast w-full rounded-md bg-[#EEF1FB] p-5 shadow-2xl">
      <p className={`text-[17px] font-black ${renderThumb ? 'text-left' : 'text-center'} ${NAVY}`}>{title}</p>
      <div className="mt-3 space-y-1">
        {options.map((o) => (
          <button key={o} type="button" onClick={() => onSelect(o)} className="flex w-full items-center gap-3 px-2 py-1.5 text-left">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-[#0A2E57]">
              {selected === o && <span className="h-2.5 w-2.5 rounded-full bg-[#0A2E57]" />}
            </span>
            {renderThumb?.(o)}
            <span className={`text-[13px] font-extrabold ${NAVY}`}>{o}</span>
          </button>
        ))}
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <button type="button" onClick={onCancel} className={`rounded-md bg-white px-4 py-2.5 text-[13px] font-extrabold ${NAVY}`}>
          Cancel
        </button>
        <button
          type="button"
          disabled={!selected}
          onClick={onOk}
          className="rounded-md bg-[#0A2E57] px-4 py-2.5 text-[13px] font-extrabold text-white disabled:opacity-50"
        >
          Ok
        </button>
      </div>
    </div>
  );
}

/** Outlined field that opens a dialog when tapped (Cement Brand, Product). */
export function DialogField({ label, value, invalid = false, onClick }: { label: string; value: string; invalid?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex w-full items-center justify-between rounded-md border bg-white px-4 py-3 text-left ${
        invalid ? 'border-red-500' : 'border-slate-400'
      }`}
    >
      {value && <FloatingLabel text={label} />}
      <span className="text-[14px] font-extrabold text-slate-900">{value || label}</span>
      <span className="text-[10px] text-slate-700">▼</span>
    </button>
  );
}
