import React from 'react';
import { GraduationCap, RotateCcw, ArrowRight } from 'lucide-react';
import { UI_TEXT, useLessonLang } from './i18n';
import type { HotspotContent } from './content/types';

interface TeacherCardProps {
  learnerFirstName: string;
  exploredCount: number;
  totalCount: number;
  lessonCompleted: boolean;
  /** True once the lesson is saved as completed — stays true during a "Start over" replay. */
  canContinue: boolean;
  onStartOver: () => void;
  onContinue: () => void;
  /** Step-by-step instruction from the current screen (task lessons). Shown in place of the generic text. */
  guide?: HotspotContent | null;
  unit?: 'things' | 'tasks';
}

export const TeacherCard: React.FC<TeacherCardProps> = ({
  learnerFirstName,
  exploredCount,
  totalCount,
  lessonCompleted,
  canContinue,
  onStartOver,
  onContinue,
  guide = null,
  unit = 'things',
}) => {
  const pct = totalCount > 0 ? Math.round((exploredCount / totalCount) * 100) : 0;
  const lang = useLessonLang();
  const t = UI_TEXT[lang];
  const heading = guide ? guide[lang].title : lessonCompleted ? t.doneTitle : t.tapTitle;
  const body = guide ? guide[lang].body : lessonCompleted ? t.doneBody : t.tapBody;

  return (
    // On desktop, as tall as the phone beside it (phone screen + status bar + bezel).
    <div className="flex w-full max-w-md flex-col rounded-2xl bg-white p-5 shadow-lg ring-1 ring-slate-100 lg:min-h-[calc(min(720px,75vh)+46px)] lg:p-6">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-50 text-teal-600">
          <GraduationCap className="h-5 w-5" />
        </span>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-teal-600">{t.yourTeacher}</p>
          <p className="text-base font-bold text-slate-900">{t.hello(learnerFirstName)}</p>
        </div>
      </div>

      <div className="mt-4 min-h-[220px] flex-1 rounded-xl bg-teal-50 p-5">
        <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-teal-700">
          <span className="text-teal-500">✦</span> {t.levelTag}
        </p>
        <p key={heading} className="oa-toast mt-2 text-xl font-bold text-slate-900">
          {heading}
        </p>
        <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-700">{body}</p>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
          <span>{unit === 'tasks' ? t.tasksDone : t.explored}</span>
          <span>{unit === 'tasks' ? t.tasks(exploredCount, totalCount) : t.things(exploredCount, totalCount)}</span>
        </div>
        <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-teal-500 transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {canContinue && (
        <button
          onClick={onContinue}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-teal-600 py-2.5 text-xs font-semibold text-white transition hover:bg-teal-700"
        >
          {t.continue} <ArrowRight className="h-3.5 w-3.5" />
        </button>
      )}
      <button
        onClick={onStartOver}
        className={`${canContinue ? 'mt-2' : 'mt-4'} flex w-full items-center justify-center gap-2 rounded-full border border-slate-200 py-2.5 text-xs font-semibold text-slate-600 transition hover:border-teal-300 hover:text-teal-700`}
      >
        <RotateCcw className="h-3.5 w-3.5" />
        {t.startOver}
      </button>
    </div>
  );
};
