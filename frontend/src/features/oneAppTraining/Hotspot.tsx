import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import clsx from 'clsx';
import type { HotspotContent } from './content/types';
import { useLessonLang } from './i18n';

interface HotspotProps {
  id: string;
  explored: boolean;
  content: HotspotContent;
  onExplore: (id: string) => void;
  /** Popup opens below the element by default; screens near the bottom of the phone frame flip it above. */
  popupPosition?: 'below' | 'above';
  /** 'stretch' matches the hotspot's width; 'right' gives small targets (e.g. an icon) a readable fixed-width popup anchored to their right edge. */
  popupAlign?: 'stretch' | 'right';
  /** Fill the parent's height — only for grid cells that must match a sibling's height (e.g. side-by-side cards). */
  fillHeight?: boolean;
  /** Task rows: tapping runs this (e.g. opens the task's screens) instead of showing a popup. The task flow reports completion itself. */
  action?: () => void;
  /** Strict-order tasks: not this row's turn yet. No highlight, no popup, tap doesn't count. */
  locked?: boolean;
  onLockedTap?: () => void;
  /** Show a green border + tick once explored (task rows), instead of no border. */
  showDone?: boolean;
  children: React.ReactNode;
}

/**
 * Wraps one tappable zone of a replica app screen. Tapping it always opens
 * the explanation (re-tappable anytime, per design) and reports the tap to
 * the caller, which is responsible for persisting it via the API — this
 * component only renders, it never calls the backend itself.
 */
export const Hotspot: React.FC<HotspotProps> = ({
  id,
  explored,
  content,
  onExplore,
  popupPosition = 'below',
  popupAlign = 'stretch',
  fillHeight = false,
  action,
  locked = false,
  onLockedTap,
  showDone = false,
  children,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const text = content[useLessonLang()];
  const popupRef = useRef<HTMLDivElement>(null);

  // Tall hotspots (e.g. the Activity grid) can open a popup outside the
  // phone's visible scroll area — bring it into view.
  useEffect(() => {
    if (isOpen) popupRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [isOpen]);

  return (
    <div className={clsx('relative', fillHeight && 'h-full')}>
      <button
        type="button"
        onClick={() => {
          if (locked) {
            onLockedTap?.();
            return;
          }
          if (action) {
            action();
            return;
          }
          setIsOpen((v) => !v);
          if (!explored) onExplore(id);
        }}
        className={clsx(
          'relative block w-full rounded-xl text-left outline-none transition',
          fillHeight && 'h-full',
          'focus-visible:ring-2 focus-visible:ring-teal-400',
          locked && 'opacity-60',
          !locked && !explored && 'ring-2 ring-teal-400/70',
          showDone && explored && 'ring-2 ring-green-500',
          isOpen && 'ring-2 ring-teal-500',
        )}
      >
        {children}
        {!locked && !explored && (
          <span className="absolute -right-1.5 -top-1.5 z-10 flex h-4 w-4 animate-pulse items-center justify-center rounded-full bg-teal-500 text-[9px] font-bold text-white shadow">
            ?
          </span>
        )}
        {showDone && explored && (
          <span className="absolute -right-1.5 -top-1.5 z-10 flex h-4 w-4 items-center justify-center rounded-full bg-green-500 text-[9px] font-bold text-white shadow">
            ✓
          </span>
        )}
      </button>

      {isOpen && (
        <div
          ref={popupRef}
          className={clsx(
            'absolute z-30 rounded-xl border border-teal-100 bg-white p-3.5 text-left shadow-xl',
            popupAlign === 'right' ? 'right-0 w-60' : 'left-0 right-0',
            popupPosition === 'below' ? 'top-[calc(100%+6px)]' : 'bottom-[calc(100%+6px)]',
          )}
        >
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs font-bold text-slate-900">{text.title}</p>
            <button onClick={() => setIsOpen(false)} className="shrink-0 text-slate-400 hover:text-slate-600">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <p className="mt-1 whitespace-pre-line text-xs leading-relaxed text-slate-600">{text.body}</p>
        </div>
      )}
    </div>
  );
};
