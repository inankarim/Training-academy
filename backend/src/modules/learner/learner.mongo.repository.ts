import { QuizAttemptModel, QuizAttemptAnswer } from './quizAttempt.model';

export async function countPriorAttempts(userId: string, lessonId: string | null, blockId: string): Promise<number> {
  return QuizAttemptModel.countDocuments({ userId, lessonId, blockId }).exec();
}

/**
 * Every attempt is kept permanently (never overwritten) specifically so HR
 * can later see a learner's full history on a check, not just the outcome —
 * this just asks whether any of them passed.
 */
export async function hasPassedBlock(userId: string, lessonId: string | null, blockId: string): Promise<boolean> {
  const passedAttempt = await QuizAttemptModel.exists({ userId, lessonId, blockId, passed: true });
  return passedAttempt !== null;
}

export async function recordAttempt(input: {
  userId: string;
  courseId: string;
  lessonId: string | null;
  blockId: string;
  attemptNumber: number;
  answers: QuizAttemptAnswer[];
  totalScore: number;
  maxScore: number;
  passed: boolean;
}): Promise<void> {
  await QuizAttemptModel.create({ ...input, attemptedAt: new Date() });
}
