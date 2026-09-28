import * as finalQuizRepo from '../courses/finalQuiz.mongo.repository';
import { FinalQuizSubdoc } from '../courses/courseContent.model';
import * as lessonsRepo from '../lessons/lessons.postgres.repository';
import * as learnerRepo from './learner.postgres.repository';
import * as learnerMongoRepo from './learner.mongo.repository';
import { FinalQuizStatus } from './learner.types';

/** Fixed pass mark for every course's final quiz. */
export const FINAL_QUIZ_PASS_PERCENT = 50;

/** A course requires a final quiz once its quiz has at least one question. */
export async function loadRequiredFinalQuiz(courseId: string): Promise<FinalQuizSubdoc | null> {
  const quiz = await finalQuizRepo.getFinalQuiz(courseId);
  return quiz && quiz.questions.length > 0 ? quiz : null;
}

/** Share of course progress the final quiz is worth, when a course has one. */
export const FINAL_QUIZ_PROGRESS_WEIGHT = 25;

/**
 * Course progress %: lessons fill 75% and passing the final quiz the last 25%
 * when the course has a final quiz; otherwise lessons are the full 100%.
 */
export function courseProgressPercent(
  completedLessons: number,
  totalLessons: number,
  finalQuiz: { passed: boolean } | null,
): number {
  const lessonShare = finalQuiz ? 100 - FINAL_QUIZ_PROGRESS_WEIGHT : 100;
  const lessonPart = totalLessons > 0 ? (Math.min(completedLessons, totalLessons) / totalLessons) * lessonShare : 0;
  return Math.round(lessonPart + (finalQuiz?.passed ? FINAL_QUIZ_PROGRESS_WEIGHT : 0));
}

export function scorePercent(earned: number, max: number): number {
  return max > 0 ? Math.round((earned / max) * 100) : 0;
}

export interface FinalQuizProgress {
  status: FinalQuizStatus;
  attemptsUsed: number;
  allowedAttempts: number;
  bestScorePercent: number | null;
}

/**
 * Single source of truth for where a learner stands on a course's final quiz,
 * shared by the learner screens and HR's assignment list. One attempt is
 * allowed per assignment; each HR grant after a fail allows one more.
 */
export async function getFinalQuizProgress(
  courseId: string,
  assignment: { id: string; final_quiz_extra_attempts: number },
): Promise<FinalQuizProgress> {
  const [attempts, lessons, completedLessons] = await Promise.all([
    learnerMongoRepo.listFinalQuizAttempts(assignment.id),
    lessonsRepo.findPublishedLessonsByCourse(courseId),
    learnerRepo.countCompletedLessons(assignment.id),
  ]);

  const allowedAttempts = 1 + assignment.final_quiz_extra_attempts;
  const scores = attempts.map((a) => scorePercent(a.totalScore, a.maxScore));
  const bestScorePercent = scores.length > 0 ? Math.max(...scores) : null;

  let status: FinalQuizStatus;
  if (attempts.some((a) => a.passed)) status = 'passed';
  else if (attempts.length >= allowedAttempts) status = 'failed';
  else if (lessons.length > 0 && completedLessons >= lessons.length) status = 'available';
  else status = 'locked';

  return { status, attemptsUsed: attempts.length, allowedAttempts, bestScorePercent };
}
