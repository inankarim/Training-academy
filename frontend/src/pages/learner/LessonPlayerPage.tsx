import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getLearnerLessonApi,
  getLearnerCourseApi,
  completeLessonApi,
  submitBlockAttemptApi,
  getLearnerDashboardApi,
} from '../../services/learner.service';
import { LearnerBlock, LearnerCourseDetail } from '../../types/learner.types';
import { renderFormattedText } from '../../utils/richTextFormat';
import { getVideoEmbedUrl } from '../../utils/videoEmbed';
import {
  ChevronLeft,
  CheckCircle2,
  PlayCircle,
  Circle,
  Play,
  FileText,
  Image as ImageIcon,
  HelpCircle,
  ArrowRight,
  Flame,
  Award,
  LifeBuoy,
  Clock,
  Zap,
  BookOpen,
  Lock,
} from 'lucide-react';
import clsx from 'clsx';

// Block types that aren't standalone learner-facing content — HERO_BANNER
// folds into the page header, NEXT_LESSON is the page's own Continue button,
// and KNOWLEDGE_CHECK/QUIZ complete automatically when passed rather than
// via a manual button.
const NO_MANUAL_COMPLETE = new Set(['HERO_BANNER', 'NEXT_LESSON', 'KNOWLEDGE_CHECK', 'QUIZ']);

interface KnowledgeCheckQuestion {
  id: string;
  question: string;
  options: string[];
  points: number;
}

function BlockImage({ url, className }: { url?: string; className: string }) {
  if (!url) {
    return (
      <div className={clsx('flex items-center justify-center bg-surface-border text-ink-faint', className)}>
        <ImageIcon className="h-5 w-5" />
      </div>
    );
  }
  return <img src={url} alt="" className={clsx('object-cover', className)} />;
}

function lessonXpPotential(blocks: LearnerBlock[]): number {
  return blocks
    .filter((b) => b.type === 'KNOWLEDGE_CHECK' || b.type === 'QUIZ')
    .reduce((sum, b) => {
      const questions = ((b.content as { questions?: { points: number }[] }).questions ?? []) as {
        points: number;
      }[];
      return sum + questions.reduce((s, q) => s + (q.points ?? 0), 0);
    }, 0);
}

const QuizBlock: React.FC<{ lessonId: string; block: LearnerBlock; label: string; onPassed: () => void }> = ({
  lessonId,
  block,
  label,
  onPassed,
}) => {
  const content = block.content as { questions?: KnowledgeCheckQuestion[] };
  const questions = content.questions ?? [];
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<
    { passed: boolean; score: number; maxScore: number; perQuestion: Array<{ questionId: string; correct: boolean }> } | null
  >(null);
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      submitBlockAttemptApi(lessonId, block.id, {
        answers: questions.map((q) => ({ questionId: q.id, selectedAnswer: answers[q.id] ?? '' })),
      }),
    onSuccess: (res) => {
      setResult(res);
      setError(null);
      if (res.passed) onPassed();
    },
    onError: (err: unknown) => {
      setError(err instanceof Error ? err.message : 'Failed to submit answers');
    },
  });

  const allAnswered = questions.length > 0 && questions.every((q) => Boolean(answers[q.id]));
  const correctCount = result?.perQuestion.filter((p) => p.correct).length ?? 0;

  // An unconfigured check (no questions yet), or one the learner has already
  // passed before (server-verified), has nothing left to do here — treat it
  // as already satisfied so it can never permanently block the unlock chain
  // or the lesson-level "all blocks done" gate below.
  useEffect(() => {
    if (questions.length === 0 || block.alreadyCompleted) onPassed();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (questions.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-surface-border bg-surface p-5 text-center">
        <HelpCircle className="mx-auto h-5 w-5 text-ink-faint" />
        <p className="mt-2 text-xs font-medium text-ink-muted">
          This {label.toLowerCase()} hasn&apos;t been configured with questions yet.
        </p>
      </div>
    );
  }

  if (block.alreadyCompleted && !result) {
    return (
      <div className="overflow-hidden rounded-xl border border-surface-border bg-surface-card shadow-card">
        <div className="flex items-center justify-between bg-charcoal px-4 py-3">
          <div className="flex items-center gap-2 text-white">
            <HelpCircle className="h-4 w-4 text-accent" />
            <h3 className="text-sm font-bold">{label}</h3>
          </div>
        </div>
        <div className="flex flex-col items-center gap-2 p-6 text-center">
          <CheckCircle2 className="h-6 w-6 text-status-success" />
          <p className="text-xs font-semibold text-ink">Already completed</p>
          <p className="text-[11px] text-ink-muted">This check can only be taken once.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-surface-border bg-surface-card shadow-card">
      <div className="flex items-center justify-between bg-charcoal px-4 py-3">
        <div className="flex items-center gap-2 text-white">
          <HelpCircle className="h-4 w-4 text-accent" />
          <h3 className="text-sm font-bold">{label}</h3>
        </div>
        <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-semibold text-white">
          Score: {result ? `${correctCount}/${questions.length}` : `0/${questions.length}`}
        </span>
      </div>

      <div className="space-y-4 p-4">
        {questions.map((q, idx) => {
          const qResult = result?.perQuestion.find((p) => p.questionId === q.id);
          return (
            <div key={q.id} className="rounded-lg border border-surface-border p-3.5">
              <p className="flex items-start gap-2 text-xs font-semibold text-ink">
                <span className="flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-accent/10 text-[10px] font-bold text-accent">
                  {idx + 1}
                </span>
                {q.question}
              </p>
              <div className="mt-2.5 space-y-1.5 pl-6.5">
                {q.options.map((opt) => (
                  <label
                    key={opt}
                    className={clsx(
                      'flex items-center gap-2 rounded-md border px-2.5 py-2 text-xs transition',
                      result ? 'cursor-default' : 'cursor-pointer border-surface-border hover:border-accent/50 hover:bg-surface',
                      !result && 'border-surface-border',
                      result && answers[q.id] === opt && qResult?.correct && 'border-status-success bg-status-success/10',
                      result && answers[q.id] === opt && !qResult?.correct && 'border-status-danger bg-status-danger/10',
                      result && answers[q.id] !== opt && 'border-surface-border opacity-60',
                    )}
                  >
                    <input
                      type="radio"
                      name={q.id}
                      value={opt}
                      disabled={Boolean(result)}
                      checked={answers[q.id] === opt}
                      onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: opt }))}
                      className="accent-accent"
                    />
                    <span className="text-ink">{opt}</span>
                  </label>
                ))}
              </div>
              {result && (
                <p
                  className={clsx(
                    'mt-2 pl-6.5 text-[11px] font-semibold',
                    qResult?.correct ? 'text-status-success' : 'text-status-danger',
                  )}
                >
                  {qResult?.correct ? 'Correct' : 'Incorrect — the right answer stays hidden, try again.'}
                </p>
              )}
            </div>
          );
        })}

        {error && <p className="text-[11px] text-status-danger">{error}</p>}

        {!result && (
          <button
            onClick={() => mutation.mutate()}
            disabled={!allAnswered || mutation.isPending}
            className="w-full rounded-md bg-accent py-2.5 text-xs font-semibold text-white transition hover:bg-accent-hover disabled:opacity-40"
          >
            {mutation.isPending ? 'Submitting...' : 'Submit Answers'}
          </button>
        )}

        {result && !result.passed && (
          <button
            onClick={() => {
              setResult(null);
              setAnswers({});
            }}
            className="w-full rounded-md border border-status-warning py-2.5 text-xs font-semibold text-status-warning hover:bg-status-warningSubtle"
          >
            Try Again (next attempt scores less)
          </button>
        )}

        {result && result.passed && (
          <p className="flex items-center justify-center gap-1.5 rounded-md bg-status-success/10 py-2.5 text-xs font-semibold text-status-success">
            <CheckCircle2 className="h-4 w-4" /> Passed — earned {result.score} XP
          </p>
        )}
      </div>
    </div>
  );
};

function renderBlock(
  lessonId: string,
  block: LearnerBlock,
  onQuizPassed: () => void,
  footer: React.ReactNode,
): React.ReactNode {
  const c = block.content as Record<string, unknown>;

  switch (block.type) {
    case 'HERO_BANNER':
      return null; // folded into the page-level hero header instead
    case 'VIDEO': {
      const videoUrl = c.videoUrl ? String(c.videoUrl) : '';
      const embedUrl = videoUrl ? getVideoEmbedUrl(videoUrl) : null;
      return (
        <div className="overflow-hidden rounded-xl border border-surface-border bg-surface-card p-4 shadow-card">
          {embedUrl ? (
            <iframe
              src={embedUrl}
              className="aspect-video w-full rounded-lg bg-charcoal"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : videoUrl ? (
            <video src={videoUrl} controls className="aspect-video w-full rounded-lg bg-charcoal" />
          ) : (
            <div className="flex aspect-video items-center justify-center rounded-lg bg-charcoal text-white/60">
              <Play className="h-8 w-8" />
            </div>
          )}
          {footer}
        </div>
      );
    }
    case 'IMAGES': {
      const images = (c.images as { url: string; caption?: string }[]) ?? [];
      return (
        <div className="rounded-xl border border-surface-border bg-surface-card p-4 shadow-card">
          <div className="grid grid-cols-2 gap-4">
            {images.map((img, i) => (
              <div key={i} className="overflow-hidden rounded-lg border border-surface-border">
                <BlockImage url={img.url} className="aspect-video w-full" />
                {img.caption && (
                  <p className="border-t border-surface-border bg-surface-card px-2.5 py-1.5 text-[11px] font-medium text-ink-muted">
                    {img.caption}
                  </p>
                )}
              </div>
            ))}
          </div>
          {footer}
        </div>
      );
    }
    case 'BANNER_IMAGE':
      // object-contain, not cover: this block is used for infographics and
      // diagrams with edge-to-edge information as often as decorative
      // photos, and no single fixed aspect ratio matches every upload — a
      // wide diagram would otherwise get its edges cropped off to fill the
      // box. contain always shows the full image, letterboxed on a neutral
      // background instead of zooming/cropping.
      return (
        <div className="rounded-xl border border-surface-border bg-surface-card p-4 shadow-card">
          <BlockImage
            url={c.imageUrl ? String(c.imageUrl) : undefined}
            className="aspect-[5/2] w-full rounded-lg bg-surface object-contain"
          />
          {footer}
        </div>
      );
    case 'PDF':
      return (
        <div className="rounded-xl border border-surface-border bg-surface-card p-4 shadow-card">
          <a
            href={c.fileUrl ? String(c.fileUrl) : '#'}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 rounded-lg border border-surface-border p-3 transition hover:border-accent"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10">
              <FileText className="h-4.5 w-4.5 text-accent" />
            </div>
            <span className="text-xs font-semibold text-ink">{String(c.fileName ?? 'document.pdf')}</span>
          </a>
          {footer}
        </div>
      );
    case 'RICH_TEXT':
      return (
        <div className="rounded-xl border border-surface-border bg-surface-card p-5 shadow-card">
          <p className="whitespace-pre-line text-sm leading-relaxed text-ink-muted">
            {renderFormattedText(String(c.html ?? ''))}
          </p>
          {footer}
        </div>
      );
    case 'CALLOUT':
      return (
        <div className="rounded-xl border-l-4 border-accent bg-accent/5 p-4 shadow-card">
          <p className="text-sm font-bold text-ink">{String(c.title ?? '')}</p>
          <p className="mt-1 whitespace-pre-line text-xs leading-relaxed text-ink-muted">
            {renderFormattedText(String(c.message ?? ''))}
          </p>
          {footer}
        </div>
      );
    case 'IMAGE_TEXT': {
      const image = (c.image as { url?: string }) ?? {};
      const position = c.imagePosition === 'right' ? 'right' : 'left';
      return (
        <div className="rounded-xl border border-surface-border bg-surface-card p-4 shadow-card">
          {/* Mobile-first: stacked (image on top, text below) by default —
              stretching a small image to match a long block of text looked
              broken on narrow screens. At sm: (640px+) it switches to a real
              side-by-side card with a fixed-size thumbnail, honoring left/right. */}
          <div className={clsx('flex flex-col gap-4 sm:flex-row', position === 'right' && 'sm:flex-row-reverse')}>
            <BlockImage
              url={image.url}
              className="aspect-video w-full shrink-0 rounded-lg sm:aspect-square sm:h-32 sm:w-32"
            />
            <div className="min-w-0">
              <p className="text-sm font-bold text-ink">{String(c.title ?? '')}</p>
              <p className="mt-1 whitespace-pre-line text-xs leading-relaxed text-ink-muted">
                {renderFormattedText(String(c.description ?? ''))}
              </p>
            </div>
          </div>
          {footer}
        </div>
      );
    }
    case 'KNOWLEDGE_CHECK':
      return <QuizBlock lessonId={lessonId} block={block} label="Knowledge Check" onPassed={onQuizPassed} />;
    case 'QUIZ':
      return <QuizBlock lessonId={lessonId} block={block} label="Lesson Quiz" onPassed={onQuizPassed} />;
    case 'NEXT_LESSON':
      return null; // handled by the page-level "Continue" button
    default:
      return null;
  }
}

const CompleteFooter: React.FC<{ isCompleted: boolean; onComplete: () => void }> = ({ isCompleted, onComplete }) =>
  isCompleted ? (
    <p className="mt-3 flex items-center gap-1.5 border-t border-surface-border pt-3 text-[11px] font-semibold text-status-success">
      <CheckCircle2 className="h-3.5 w-3.5" /> Completed
    </p>
  ) : (
    <button
      onClick={onComplete}
      className="mt-3 flex items-center gap-1.5 border-t border-surface-border pt-3 text-[11px] font-semibold text-ink-muted transition hover:text-accent"
    >
      <CheckCircle2 className="h-3.5 w-3.5" />
      Mark Complete
    </button>
  );

function heroImageFor(blocks: LearnerBlock[], course: LearnerCourseDetail | undefined): string | undefined {
  const bannerBlock = blocks.find((b) => b.type === 'HERO_BANNER');
  const blockUrl = (bannerBlock?.content as { bannerImage?: { url?: string } } | undefined)?.bannerImage?.url;
  return blockUrl || course?.bannerRef || undefined;
}

export const LessonPlayerPage: React.FC = () => {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: lesson, isLoading } = useQuery({
    queryKey: ['learner-lesson', lessonId],
    queryFn: () => getLearnerLessonApi(lessonId!),
    enabled: Boolean(lessonId),
  });

  const { data: course } = useQuery({
    queryKey: ['learner-course', lesson?.courseId],
    queryFn: () => getLearnerCourseApi(lesson!.courseId),
    enabled: Boolean(lesson?.courseId),
  });

  const { data: dashboard } = useQuery({
    queryKey: ['learner-dashboard'],
    queryFn: getLearnerDashboardApi,
  });

  const completeMutation = useMutation({
    mutationFn: () => completeLessonApi(lessonId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learner-course', lesson?.courseId] });
      queryClient.invalidateQueries({ queryKey: ['learner-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['learner-courses'] });

      const lessons = course?.lessons ?? [];
      const idx = lessons.findIndex((l) => l.lessonId === lessonId);
      const next = idx >= 0 ? lessons[idx + 1] : undefined;
      if (next) {
        navigate(`/learner/lessons/${next.lessonId}`);
      } else {
        navigate(`/learner/courses/${lesson!.courseId}`);
      }
    },
  });

  // Session-only reveal state: which blocks the learner has marked complete
  // in THIS visit. Resets on reload/navigation by design — this paces how
  // content is revealed within a lesson, it isn't a second progress tracker
  // (lesson/course completion is already persisted separately).
  const [completedBlockIds, setCompletedBlockIds] = useState<Set<string>>(new Set());
  const markBlockComplete = (blockId: string) => {
    setCompletedBlockIds((prev) => (prev.has(blockId) ? prev : new Set(prev).add(blockId)));
  };

  const sortedBlocks = useMemo(
    () => (lesson ? [...lesson.blocks].sort((a, b) => a.sortOrder - b.sortOrder) : []),
    [lesson],
  );

  const hasUnresolvedAssessment = sortedBlocks.some((b) => {
    if (b.type !== 'KNOWLEDGE_CHECK' && b.type !== 'QUIZ') return false;
    const questions = (b.content as { questions?: unknown[] }).questions ?? [];
    return questions.length > 0;
  });

  // HERO_BANNER folds into the page header and NEXT_LESSON is the page's own
  // Continue button — neither is "content" a learner marks done, so they're
  // excluded from the gate below. Every other block (including quiz/check
  // blocks, which complete via passing) must be done before the lesson-level
  // complete button appears — this is what stops a learner from finishing
  // the lesson while blocks above are still locked/unread.
  const completableBlocks = sortedBlocks.filter((b) => b.type !== 'HERO_BANNER' && b.type !== 'NEXT_LESSON');
  const allBlocksComplete = completableBlocks.every((b) => Boolean(b.alreadyCompleted) || completedBlockIds.has(b.id));

  if (isLoading || !lesson) {
    return <p className="p-8 text-xs text-ink-faint">Loading lesson...</p>;
  }

  const isAlreadyCompleted = lesson.progressStatus === 'completed';
  const lessons = course?.lessons ?? [];
  const lessonIndex = lessons.findIndex((l) => l.lessonId === lessonId);
  const xpPotential = lessonXpPotential(sortedBlocks);
  const heroImage = heroImageFor(sortedBlocks, course);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_1fr_240px]">
      {/* Dark lesson sidebar */}
      <div className="space-y-1 rounded-xl bg-charcoal p-3 shadow-card lg:sticky lg:top-24 lg:h-fit">
        <p className="flex items-center gap-1.5 px-2 pb-3 pt-1 text-[10px] font-bold uppercase tracking-wider text-white/40">
          <BookOpen className="h-3 w-3" /> {course?.name ?? 'Course'}
        </p>
        {lessons.map((l) => {
          const isCurrent = l.lessonId === lessonId;
          const isDone = l.progressStatus === 'completed';
          return (
            <button
              key={l.lessonId}
              onClick={() => navigate(`/learner/lessons/${l.lessonId}`)}
              className={clsx(
                'flex w-full items-center gap-2 rounded-md border-l-2 px-2.5 py-2 text-left text-[11px] font-medium transition',
                isCurrent
                  ? 'border-accent bg-charcoal-soft text-white'
                  : 'border-transparent text-white/60 hover:border-white/20 hover:text-white',
              )}
            >
              {isDone ? (
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-status-success" />
              ) : isCurrent ? (
                <PlayCircle className="h-3.5 w-3.5 shrink-0 text-accent" />
              ) : (
                <Circle className="h-3.5 w-3.5 shrink-0 text-white/30" />
              )}
              <span className="truncate">{l.title}</span>
            </button>
          );
        })}
      </div>

      {/* Main content */}
      <div className="space-y-5">
        <button
          onClick={() => navigate(`/learner/courses/${lesson.courseId}`)}
          className="flex items-center gap-1 text-xs font-medium text-ink-muted hover:text-ink"
        >
          <ChevronLeft className="h-3.5 w-3.5" /> Back to course
        </button>

        {/* Hero header — fixed aspect ratio (not a fixed height) so the crop
            is identical to the Lesson Builder's Student Preview and stays
            consistent across phone/tablet/desktop widths. */}
        <div className="relative overflow-hidden rounded-xl shadow-card">
          <BlockImage url={heroImage} className="aspect-[3/1] w-full" />
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal via-charcoal/40 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-5">
            {lessonIndex >= 0 && (
              <p className="text-[11px] font-semibold uppercase tracking-wider text-accent">
                Lesson {lessonIndex + 1} of {lessons.length}
              </p>
            )}
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-white">{lesson.title}</h1>
            {lesson.description && (
              <p className="mt-1 max-w-xl text-xs text-white/80">{lesson.description}</p>
            )}
            <div className="mt-3 flex items-center gap-3 text-[11px] font-semibold text-white/90">
              {course?.difficulty && (
                <span className="rounded-full bg-white/15 px-2.5 py-1 capitalize backdrop-blur">
                  {course.difficulty}
                </span>
              )}
              {xpPotential > 0 && (
                <span className="flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 backdrop-blur">
                  <Zap className="h-3 w-3 text-accent" /> +{xpPotential} XP
                </span>
              )}
              <span className="flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 backdrop-blur">
                <Clock className="h-3 w-3" /> {sortedBlocks.length} block{sortedBlocks.length === 1 ? '' : 's'}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          {sortedBlocks.map((block, i) => {
            const previousBlock = sortedBlocks[i - 1];
            // Locks only apply while first working through a lesson — once
            // it's already completed, the block-unlock state (session-only,
            // resets on reload) would otherwise re-lock everything on every
            // revisit, blocking a learner from reviewing their own finished lesson.
            const isLocked =
              !isAlreadyCompleted &&
              Boolean(block.style.lockUntilPrevious) &&
              previousBlock !== undefined &&
              !completedBlockIds.has(previousBlock.id);

            if (isLocked) {
              return (
                <div
                  key={block.id}
                  className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-surface-border bg-surface p-6 text-center"
                >
                  <Lock className="h-5 w-5 text-ink-faint" />
                  <p className="text-xs font-medium text-ink-muted">
                    Complete the previous section to unlock this.
                  </p>
                </div>
              );
            }

            // A KNOWLEDGE_CHECK/QUIZ block the learner already passed before
            // this visit is done as far as the lesson-completion gate is
            // concerned even though completedBlockIds (session-only) has no
            // record of it — otherwise a reload would re-lock a passed check.
            const isCompleted = Boolean(block.alreadyCompleted) || completedBlockIds.has(block.id);
            const showCompleteButton = !NO_MANUAL_COMPLETE.has(block.type);
            const footer = showCompleteButton ? (
              <CompleteFooter isCompleted={isCompleted} onComplete={() => markBlockComplete(block.id)} />
            ) : null;

            const rendered = renderBlock(lesson.lessonId, block, () => markBlockComplete(block.id), footer);
            if (!rendered) return null;

            return <div key={block.id}>{rendered}</div>;
          })}
        </div>

        <div className="border-t border-surface-border pt-5">
          {isAlreadyCompleted ? (
            <p className="flex items-center gap-1.5 text-xs font-semibold text-status-success">
              <CheckCircle2 className="h-4 w-4" /> Lesson already completed
            </p>
          ) : allBlocksComplete ? (
            <button
              onClick={() => completeMutation.mutate()}
              disabled={completeMutation.isPending}
              className="flex items-center gap-2 rounded-md bg-accent px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-accent-hover disabled:opacity-50"
            >
              {completeMutation.isPending ? 'Saving...' : 'Mark Complete & Continue'} <ArrowRight className="h-3.5 w-3.5" />
            </button>
          ) : (
            <p className="text-[11px] font-medium text-ink-faint">
              Complete every section above to finish this lesson.
            </p>
          )}
          {hasUnresolvedAssessment && !isAlreadyCompleted && allBlocksComplete && (
            <p className="mt-2 text-[11px] text-ink-faint">
              Passing the checks above earns bonus XP.
            </p>
          )}
        </div>
      </div>

      {/* Right sidebar */}
      <div className="space-y-4 lg:sticky lg:top-24 lg:h-fit">
        <div className="rounded-xl border border-surface-border bg-surface-card p-4 shadow-card">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-faint">Course Progress</p>
          <div className="mt-2">
            <div className="flex justify-between text-[11px] font-medium text-ink-muted">
              <span>Overall Completion</span>
              <span>{course?.progress ?? 0}%</span>
            </div>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-surface">
              <div className="h-full rounded-full bg-accent" style={{ width: `${course?.progress ?? 0}%` }} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-surface-border bg-surface-card p-3 text-center shadow-card">
            <Award className="mx-auto h-4 w-4 text-accent" />
            <p className="mt-1 text-sm font-bold text-ink">{dashboard?.level ?? 1}</p>
            <p className="text-[9px] text-ink-faint">Current Level</p>
          </div>
          <div className="rounded-xl border border-surface-border bg-surface-card p-3 text-center shadow-card">
            <Flame className="mx-auto h-4 w-4 text-amber-600" />
            <p className="mt-1 text-sm font-bold text-ink">{dashboard?.currentStreak ?? 0}</p>
            <p className="text-[9px] text-ink-faint">Day Streak</p>
          </div>
        </div>

        <div className="rounded-xl border border-surface-border bg-surface-card p-4 shadow-card">
          <div className="flex items-center gap-2 text-ink-muted">
            <LifeBuoy className="h-4 w-4" />
            <h3 className="text-xs font-bold">Need Help?</h3>
          </div>
          <p className="mt-2 text-[11px] text-ink-faint">Reach out if you get stuck on this lesson.</p>
        </div>
      </div>
    </div>
  );
};
