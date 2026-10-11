import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, Languages } from 'lucide-react';
import clsx from 'clsx';
import {
  LessonLang,
  LessonLangContext,
  UI_TEXT,
  loadLessonLang,
  saveLessonLang,
} from '../../features/oneAppTraining/i18n';
import { getHardcodedLessonProgressApi, exploreHotspotApi, getLearnerCourseApi } from '../../services/learner.service';
import { useAuth } from '../../hooks/useAuth';
import { TeacherCard } from '../../features/oneAppTraining/TeacherCard';
import type { HotspotContent } from '../../features/oneAppTraining/content/types';
import { SODashboardScreen } from '../../features/oneAppTraining/screens/SODashboardScreen';
import { TSMDashboardScreen } from '../../features/oneAppTraining/screens/TSMDashboardScreen';
import { SOJourneyCyclePlanScreen } from '../../features/oneAppTraining/screens/SOJourneyCyclePlanScreen';
import { TSMJourneyCyclePlanScreen } from '../../features/oneAppTraining/screens/TSMJourneyCyclePlanScreen';

interface ScreenProps {
  learnerName: string;
  exploredHotspotIds: string[];
  onExplore: (id: string) => void;
  setGuide: (guide: HotspotContent | null) => void;
}

// One entry per hardcoded_key — the only place a new "One App" screen needs
// to be registered on the frontend once its backend registry entry exists.
// unit: 'things' for tap-to-learn screens, 'tasks' for lessons built from guided tasks.
const SCREENS: Record<string, { component: React.FC<ScreenProps>; unit: 'things' | 'tasks' }> = {
  SO_DASHBOARD: { component: SODashboardScreen, unit: 'things' },
  TSM_DASHBOARD: { component: TSMDashboardScreen, unit: 'things' },
  SO_JOURNEY_CYCLE_PLAN: { component: SOJourneyCyclePlanScreen, unit: 'tasks' },
  TSM_JOURNEY_CYCLE_PLAN: { component: TSMJourneyCyclePlanScreen, unit: 'tasks' },
};

export const HardcodedLessonPage: React.FC = () => {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // "Start over" is a replay of the walkthrough on screen only. Saved
  // progress/completion/XP stay as they are on the server; while replaying,
  // the badges and counter follow this local list instead.
  const [replayExplored, setReplayExplored] = useState<string[] | null>(null);
  const [replayRound, setReplayRound] = useState(0);
  const [guide, setGuide] = useState<HotspotContent | null>(null);

  // Continue → next lesson reuses this page; start the new lesson clean.
  useEffect(() => {
    setReplayExplored(null);
    setGuide(null);
  }, [lessonId]);

  const [lang, setLang] = useState<LessonLang>(loadLessonLang);
  const changeLang = (l: LessonLang) => {
    setLang(l);
    saveLessonLang(l);
  };

  const { data: progress, isLoading } = useQuery({
    queryKey: ['hardcoded-lesson-progress', lessonId],
    queryFn: () => getHardcodedLessonProgressApi(lessonId!),
    enabled: Boolean(lessonId),
  });

  const { data: course } = useQuery({
    queryKey: ['learner-course', progress?.courseId],
    queryFn: () => getLearnerCourseApi(progress!.courseId),
    enabled: Boolean(progress?.courseId),
  });

  const exploreMutation = useMutation({
    mutationFn: (hotspotId: string) => exploreHotspotApi(lessonId!, hotspotId),
    onSuccess: (updated) => {
      queryClient.setQueryData(['hardcoded-lesson-progress', lessonId], updated);
      if (updated.lessonCompleted) {
        queryClient.invalidateQueries({ queryKey: ['learner-course', updated.courseId] });
        queryClient.invalidateQueries({ queryKey: ['learner-dashboard'] });
        queryClient.invalidateQueries({ queryKey: ['learner-courses'] });
      }
    },
  });

  if (isLoading || !progress) {
    return <p className="p-8 text-xs text-ink-faint">Loading lesson...</p>;
  }

  const screen = SCREENS[progress.hardcodedKey];
  const ScreenComponent = screen?.component;
  const firstName = user?.fullName?.split(' ')[0] ?? 'there';
  const shownExplored = replayExplored ?? progress.exploredHotspotIds;
  const shownCompleted = progress.lessonCompleted && shownExplored.length >= progress.totalHotspots;

  const lessons = course?.lessons ?? [];
  const lessonIndex = lessons.findIndex((l) => l.lessonId === lessonId);
  const next = lessonIndex >= 0 ? lessons[lessonIndex + 1] : undefined;
  const everyLessonDone = lessons.every((l) => l.lessonId === lessonId || l.progressStatus === 'completed');
  const quizPending = course?.finalQuiz && course.finalQuiz.status !== 'passed';

  const handleContinue = () => {
    if (next) {
      navigate(next.contentType === 'hardcoded' ? `/learner/lessons/${next.lessonId}/walkthrough` : `/learner/lessons/${next.lessonId}`);
    } else if (quizPending && everyLessonDone) {
      navigate(`/learner/courses/${progress.courseId}/final-quiz`);
    } else {
      navigate(`/learner/courses/${progress.courseId}`);
    }
  };

  const t = UI_TEXT[lang];

  return (
    <LessonLangContext.Provider value={lang}>
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => navigate(`/learner/courses/${progress.courseId}`)}
          className="flex items-center gap-1 text-xs font-medium text-ink-muted hover:text-ink"
        >
          <ChevronLeft className="h-3.5 w-3.5" /> {t.backToCourse}
        </button>

        <div
          role="group"
          aria-label="Language"
          className="flex shrink-0 items-center gap-1 rounded-full border border-surface-border bg-surface-card p-1 shadow-sm"
        >
          <Languages className="ml-1.5 h-4 w-4 text-ink-muted" />
          {(['en', 'bn'] as const).map((l) => (
            <button
              key={l}
              onClick={() => changeLang(l)}
              aria-pressed={lang === l}
              className={clsx(
                'rounded-full px-3.5 py-1.5 text-sm font-semibold transition',
                lang === l ? 'bg-teal-600 text-white' : 'text-ink-muted hover:text-ink',
              )}
            >
              {l === 'en' ? 'English' : 'বাংলা'}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">{progress.title}</h1>
        <p className="mt-1 text-xs text-ink-muted">{t.pageHint}</p>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_390px] lg:gap-10">
        <TeacherCard
          learnerFirstName={firstName}
          exploredCount={shownExplored.length}
          totalCount={progress.totalHotspots}
          lessonCompleted={shownCompleted}
          canContinue={progress.lessonCompleted}
          onStartOver={() => {
            setReplayExplored([]);
            setReplayRound((r) => r + 1);
          }}
          onContinue={handleContinue}
          guide={guide}
          unit={screen?.unit}
        />

        <div className="flex w-full justify-center">
          {ScreenComponent ? (
            <ScreenComponent
              key={replayRound}
              learnerName={user?.fullName ?? ''}
              exploredHotspotIds={shownExplored}
              setGuide={setGuide}
              onExplore={(hotspotId) => {
                setReplayExplored((prev) => (prev && !prev.includes(hotspotId) ? [...prev, hotspotId] : prev));
                if (!progress.exploredHotspotIds.includes(hotspotId)) {
                  exploreMutation.mutate(hotspotId);
                }
              }}
            />
          ) : (
            <p className="text-xs text-ink-faint">This screen hasn&apos;t been built yet.</p>
          )}
        </div>
      </div>
    </div>
    </LessonLangContext.Provider>
  );
};
