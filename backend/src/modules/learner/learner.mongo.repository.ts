import { QuizAttemptModel, QuizAttemptAnswer } from './quizAttempt.model';

export async function countPriorAttempts(userId: string, lessonId: string | null, blockId: string): Promise<number> {
  return QuizAttemptModel.countDocuments({ userId, lessonId, blockId }).exec();
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
