import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getLearnerFinalQuizApi, submitFinalQuizAttemptApi } from '../../services/learner.service';
import { FinalQuizAttemptResult } from '../../types/learner.types';
import { ChevronLeft, Trophy, Lock, PhoneCall, CheckCircle2, XCircle, Award } from 'lucide-react';
import clsx from 'clsx';

function ContactHrNotice({ scorePercent, passingScore }: { scorePercent: number | null; passingScore: number }) {
  return (
    <div className="rounded-xl border border-status-danger/30 bg-status-dangerSubtle p-6 text-center">
      <XCircle className="mx-auto h-8 w-8 text-status-danger" />
      <p className="mt-2 text-base font-bold text-status-danger">Final quiz not passed</p>
      {scorePercent !== null && (
        <p className="mt-1 text-sm text-ink">
          You scored <span className="font-bold">{scorePercent}%</span> — you need {passingScore}% to pass.
        </p>
      )}
      <div className="mx-auto mt-4 flex max-w-md items-start gap-2 rounded-lg bg-surface-card p-3 text-left">
        <PhoneCall className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
        <p className="text-xs text-ink">
          <span className="font-bold">Please contact HR personally</span> to get another attempt. Your lessons stay
          open, so you can review them while you wait.
        </p>
      </div>
    </div>
  );
}

export const FinalQuizPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const queryClient = useQueryClient();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<FinalQuizAttemptResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: quiz, isLoading } = useQuery({
    queryKey: ['learner-final-quiz', courseId],
    queryFn: () => getLearnerFinalQuizApi(courseId!),
    enabled: Boolean(courseId),
    retry: false,
  });

  const submit = useMutation({
    mutationFn: () =>
      submitFinalQuizAttemptApi(courseId!, {
        answers: (quiz?.questions ?? []).map((q) => ({ questionId: q.id, selectedAnswer: answers[q.id] ?? '' })),
      }),
    onSuccess: (res) => {
      setResult(res);
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['learner-course', courseId] });
      queryClient.invalidateQueries({ queryKey: ['learner-courses'] });
      queryClient.invalidateQueries({ queryKey: ['learner-dashboard'] });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    onError: (err: unknown) => setError(err instanceof Error ? err.message : 'Failed to submit the final quiz'),
  });

  if (isLoading) return <p className="text-xs text-ink-faint">Loading final quiz...</p>;
  if (!quiz) {
    return (
      <div className="text-center text-xs text-ink-muted">
        This course has no final quiz.{' '}
        <Link to={`/learner/courses/${courseId}`} className="font-semibold text-accent">
          Back to course
        </Link>
      </div>
    );
  }

  const questions = quiz.questions;
  const allAnswered = questions.length > 0 && questions.every((q) => Boolean(answers[q.id]));
  const perQuestion = new Map((result?.perQuestion ?? []).map((p) => [p.questionId, p]));

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link
        to={`/learner/courses/${courseId}`}
        className="flex items-center gap-1 text-xs font-medium text-ink-muted hover:text-ink"
      >
        <ChevronLeft className="h-3.5 w-3.5" /> Back to {quiz.courseName}
      </Link>

      <div className="overflow-hidden rounded-xl bg-charcoal p-6 text-white shadow-card">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-accent">Final Quiz</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">{quiz.quizName}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] font-semibold text-white/80">
          <span className="rounded-full bg-white/10 px-2.5 py-1">{quiz.questionCount} questions</span>
          <span className="rounded-full bg-white/10 px-2.5 py-1">Pass mark {quiz.passingScore}%</span>
          <span className="rounded-full bg-white/10 px-2.5 py-1">Up to {quiz.xpReward} XP</span>
          <span className="rounded-full bg-white/10 px-2.5 py-1">
            Attempt {Math.min(quiz.attemptsUsed + 1, quiz.allowedAttempts)} of {quiz.allowedAttempts}
          </span>
        </div>
      </div>

      {/* Result of the attempt just submitted */}
      {result?.passed && (
        <div className="rounded-xl border border-status-success/30 bg-status-successSubtle p-6 text-center">
          <Trophy className="mx-auto h-9 w-9 text-status-success" />
          <p className="mt-2 text-lg font-bold text-status-success">You passed with {result.scorePercent}%!</p>
          <p className="mt-1 text-sm text-ink">Course complete — you earned {result.xpAwarded} XP.</p>
          <Link
            to="/learner/courses"
            className="mt-4 inline-block rounded-md bg-accent px-4 py-2 text-xs font-semibold text-white hover:bg-accent-hover"
          >
            Back to My Courses
          </Link>
        </div>
      )}
      {result && !result.passed && <ContactHrNotice scorePercent={result.scorePercent} passingScore={result.passingScore} />}

      {/* State when arriving on the page (no attempt submitted in this visit) */}
      {!result && quiz.status === 'locked' && (
        <div className="rounded-xl border border-dashed border-surface-border bg-surface-card p-8 text-center">
          <Lock className="mx-auto h-6 w-6 text-ink-faint" />
          <p className="mt-2 text-sm font-semibold text-ink">Finish every lesson to unlock the final quiz.</p>
        </div>
      )}
      {!result && quiz.status === 'passed' && (
        <div className="rounded-xl border border-status-success/30 bg-status-successSubtle p-6 text-center">
          <Award className="mx-auto h-8 w-8 text-status-success" />
          <p className="mt-2 text-base font-bold text-status-success">
            Passed{quiz.bestScorePercent !== null ? ` with ${quiz.bestScorePercent}%` : ''} — course complete.
          </p>
        </div>
      )}
      {!result && quiz.status === 'failed' && (
        <ContactHrNotice scorePercent={quiz.bestScorePercent} passingScore={quiz.passingScore} />
      )}

      {/* The quiz itself — shown while an attempt is open, and kept visible after submitting to show which were right */}
      {(quiz.status === 'available' || result) && questions.length > 0 && (
        <div className="space-y-4">
          {questions.map((q, idx) => {
            const graded = perQuestion.get(q.id);
            return (
              <div key={q.id} className="rounded-xl border border-surface-border bg-surface-card p-4 shadow-card">
                <p className="flex items-start gap-2 text-sm font-semibold text-ink">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/10 text-[10px] font-bold text-accent">
                    {idx + 1}
                  </span>
                  <span className="flex-1">{q.question}</span>
                  <span className="shrink-0 text-[11px] font-medium text-ink-faint">{q.points} pts</span>
                </p>
                <div className="mt-3 space-y-1.5 pl-7">
                  {q.options.map((opt) => {
                    const selected = answers[q.id] === opt;
                    return (
                      <label
                        key={opt}
                        className={clsx(
                          'flex items-center gap-2 rounded-md border px-3 py-2 text-xs transition',
                          result ? 'cursor-default' : 'cursor-pointer hover:border-accent/50 hover:bg-surface',
                          !result && 'border-surface-border',
                          result && selected && graded?.correct && 'border-status-success bg-status-success/10',
                          result && selected && !graded?.correct && 'border-status-danger bg-status-danger/10',
                          result && !selected && 'border-surface-border opacity-60',
                        )}
                      >
                        <input
                          type="radio"
                          name={q.id}
                          disabled={Boolean(result)}
                          checked={selected}
                          onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: opt }))}
                          className="accent-accent"
                        />
                        <span className="text-ink">{opt}</span>
                      </label>
                    );
                  })}
                </div>
                {graded && (
                  <p
                    className={clsx(
                      'mt-2 flex items-center gap-1 pl-7 text-[11px] font-semibold',
                      graded.correct ? 'text-status-success' : 'text-status-danger',
                    )}
                  >
                    {graded.correct ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                    {graded.correct
                      ? 'Correct'
                      : graded.correctAnswer
                      ? `Incorrect — correct answer: ${graded.correctAnswer}`
                      : 'Incorrect'}
                  </p>
                )}
              </div>
            );
          })}

          {error && <p className="text-xs text-status-danger">{error}</p>}

          {!result && (
            <button
              onClick={() => submit.mutate()}
              disabled={!allAnswered || submit.isPending}
              className="w-full rounded-md bg-accent py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-accent-hover disabled:opacity-40"
            >
              {submit.isPending ? 'Submitting...' : allAnswered ? 'Submit Final Quiz' : 'Answer every question to submit'}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
