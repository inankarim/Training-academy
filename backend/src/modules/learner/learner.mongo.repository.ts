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

export const FINAL_QUIZ_BLOCK_ID = 'FINAL_QUIZ';

export async function listFinalQuizAttempts(assignmentId: string) {
  return QuizAttemptModel.find({ assignmentId, blockId: FINAL_QUIZ_BLOCK_ID })
    .sort({ attemptNumber: 1 })
    .lean()
    .exec();
}

export async function recordAttempt(input: {
  userId: string;
  courseId: string;
  lessonId: string | null;
  blockId: string;
  assignmentId?: string | null;
  attemptNumber: number;
  answers: QuizAttemptAnswer[];
  totalScore: number;
  maxScore: number;
  passed: boolean;
}): Promise<void> {
  await QuizAttemptModel.create({ ...input, attemptedAt: new Date() });
}

/** When the learner submitted any check or quiz — feeds the activity heatmap. */
export async function listAttemptTimes(userId: string): Promise<Date[]> {
  const docs = await QuizAttemptModel.find({ userId }, { attemptedAt: 1, _id: 0 }).lean().exec();
  return docs.map((d) => d.attemptedAt);
}

/** XP-bearing attempts for one course: passed lesson checks, and final quiz attempts for this assignment. */
export async function listPassedAttemptsForCourse(userId: string, courseId: string) {
  return QuizAttemptModel.find({ userId, courseId, passed: true }).lean().exec();
}
