import { AppError } from '../../middleware/errorHandler';
import { writeAuditLog } from '../../utils/auditLog';
import * as coursesPgRepo from './courses.postgres.repository';
import * as finalQuizRepo from './finalQuiz.mongo.repository';
import { FinalQuizSubdoc } from './courseContent.model';
import {
  UpdateFinalQuizConfigInput,
  FinalQuizQuestionInput,
  FinalQuizDTO,
  FinalQuizQuestionDTO,
} from './finalQuiz.types';
import { RequesterContext } from './courses.types';
import { ClientContext } from '../auth/auth.types';

async function assertCourseOwnership(requester: RequesterContext, courseId: string, ctx: ClientContext) {
  const course = await coursesPgRepo.findCourseById(courseId);
  if (!course) throw new AppError('Course not found.', 404);
  if (course.created_by !== requester.id) {
    await writeAuditLog({
      actorUserId: requester.id,
      action: 'course.access_denied',
      targetType: 'course',
      targetId: courseId,
      metadata: { reason: 'not_owner', scope: 'final_quiz' },
      ipAddress: ctx.ip,
      userAgent: ctx.userAgent,
    });
    throw new AppError('You do not have access to this course.', 403);
  }
}

function validateQuestionInput(input: Partial<FinalQuizQuestionInput>): void {
  if (input.options !== undefined && input.correctAnswer !== undefined && !input.options.includes(input.correctAnswer)) {
    throw new AppError("correctAnswer must match one of the question's options.", 400);
  }
}

function toDTO(finalQuiz: FinalQuizSubdoc | null): FinalQuizDTO {
  if (!finalQuiz) {
    return {
      quizName: '',
      xpReward: 0,
      totalQuestions: 0,
      passingScore: 80,
      maxAttempts: 3,
      retryPolicy: { allowRetry: true, hideCorrectAnswer: true, scoreDecayPercent: 10 },
      questions: [],
    };
  }
  return {
    quizName: finalQuiz.quizName,
    xpReward: finalQuiz.xpReward,
    totalQuestions: finalQuiz.totalQuestions,
    passingScore: finalQuiz.passingScore,
    maxAttempts: finalQuiz.maxAttempts,
    retryPolicy: finalQuiz.retryPolicy,
    questions: finalQuiz.questions
      .map((q) => ({
        id: q.id,
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        points: q.points,
        explanation: q.explanation,
        sortOrder: q.sortOrder,
      }))
      .sort((a, b) => a.sortOrder - b.sortOrder),
  };
}

export async function getFinalQuiz(
  requester: RequesterContext,
  courseId: string,
  ctx: ClientContext,
): Promise<FinalQuizDTO> {
  await assertCourseOwnership(requester, courseId, ctx);
  const finalQuiz = await finalQuizRepo.getFinalQuiz(courseId);
  return toDTO(finalQuiz);
}

export async function updateFinalQuizConfig(
  requester: RequesterContext,
  courseId: string,
  input: UpdateFinalQuizConfigInput,
  ctx: ClientContext,
): Promise<FinalQuizDTO> {
  await assertCourseOwnership(requester, courseId, ctx);

  const finalQuiz = await finalQuizRepo.updateFinalQuizConfig(courseId, input);

  await writeAuditLog({
    actorUserId: requester.id,
    action: 'course.final_quiz_update',
    targetType: 'course',
    targetId: courseId,
    metadata: { changes: input },
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
  });

  return toDTO(finalQuiz);
}

export async function addFinalQuizQuestion(
  requester: RequesterContext,
  courseId: string,
  input: FinalQuizQuestionInput,
  ctx: ClientContext,
): Promise<FinalQuizQuestionDTO[]> {
  await assertCourseOwnership(requester, courseId, ctx);
  validateQuestionInput(input);

  let questions;
  try {
    questions = await finalQuizRepo.addFinalQuizQuestion(courseId, input);
  } catch (err) {
    throw new AppError(err instanceof Error ? err.message : 'Failed to add question.', 400);
  }

  await writeAuditLog({
    actorUserId: requester.id,
    action: 'course.final_quiz_question_added',
    targetType: 'course',
    targetId: courseId,
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
  });

  return questions;
}

export async function updateFinalQuizQuestion(
  requester: RequesterContext,
  courseId: string,
  questionId: string,
  input: Partial<FinalQuizQuestionInput>,
  ctx: ClientContext,
): Promise<FinalQuizQuestionDTO[]> {
  await assertCourseOwnership(requester, courseId, ctx);
  validateQuestionInput(input);

  let questions;
  try {
    questions = await finalQuizRepo.updateFinalQuizQuestion(courseId, questionId, input);
  } catch (err) {
    throw new AppError(err instanceof Error ? err.message : 'Failed to update question.', 400);
  }

  await writeAuditLog({
    actorUserId: requester.id,
    action: 'course.final_quiz_question_updated',
    targetType: 'course',
    targetId: courseId,
    metadata: { questionId },
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
  });

  return questions;
}

export async function deleteFinalQuizQuestion(
  requester: RequesterContext,
  courseId: string,
  questionId: string,
  ctx: ClientContext,
): Promise<FinalQuizQuestionDTO[]> {
  await assertCourseOwnership(requester, courseId, ctx);

  let questions;
  try {
    questions = await finalQuizRepo.deleteFinalQuizQuestion(courseId, questionId);
  } catch (err) {
    throw new AppError(err instanceof Error ? err.message : 'Failed to delete question.', 400);
  }

  await writeAuditLog({
    actorUserId: requester.id,
    action: 'course.final_quiz_question_deleted',
    targetType: 'course',
    targetId: courseId,
    metadata: { questionId },
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
  });

  return questions;
}

export async function reorderFinalQuizQuestions(
  requester: RequesterContext,
  courseId: string,
  questionIds: string[],
  ctx: ClientContext,
): Promise<FinalQuizQuestionDTO[]> {
  await assertCourseOwnership(requester, courseId, ctx);

  let questions;
  try {
    questions = await finalQuizRepo.reorderFinalQuizQuestions(courseId, questionIds);
  } catch (err) {
    throw new AppError(err instanceof Error ? err.message : 'Failed to reorder questions.', 400);
  }

  await writeAuditLog({
    actorUserId: requester.id,
    action: 'course.final_quiz_question_reordered',
    targetType: 'course',
    targetId: courseId,
    metadata: { questionIds },
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
  });

  return questions;
}
