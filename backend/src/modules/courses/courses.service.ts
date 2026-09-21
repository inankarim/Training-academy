import { AppError } from '../../middleware/errorHandler';
import { writeAuditLog } from '../../utils/auditLog';
import { logger } from '../../utils/logger';
import * as pgRepo from './courses.postgres.repository';
import * as mongoRepo from './courses.mongo.repository';
import * as courseModulesRepo from '../lessons/courseModules.postgres.repository';
import { countLessonsForCourse, findLessonsByCourse } from '../lessons/lessons.postgres.repository';
import { findLessonContentByLessonId } from '../lessons/lessons.mongo.repository';
import {
  CourseDTO,
  CourseRecord,
  CreateCourseInput,
  UpdateCourseInput,
  RequesterContext,
  CourseStatus,
  CourseCounts,
} from './courses.types';
import { ClientContext } from '../auth/auth.types';

// Simple, explicit lifecycle — no approval workflow yet (Stage 1 scope).
const VALID_STATUS_TRANSITIONS: Record<CourseStatus, CourseStatus[]> = {
  draft: ['published', 'archived'],
  published: ['draft', 'archived'],
  archived: ['draft'],
};

async function assertOwnership(
  requester: RequesterContext,
  course: CourseRecord,
  ctx: ClientContext,
): Promise<void> {
  if (course.created_by !== requester.id) {
    await writeAuditLog({
      actorUserId: requester.id,
      action: 'course.access_denied',
      targetType: 'course',
      targetId: course.id,
      metadata: { reason: 'not_owner' },
      ipAddress: ctx.ip,
      userAgent: ctx.userAgent,
    });
    throw new AppError('You do not have access to this course.', 403);
  }
}

function toDTO(
  course: CourseRecord,
  lessonCount: number,
  hasQuiz: boolean,
): CourseDTO {
  // Course info is always complete at creation time (all four fields are
  // required by validation), so setup progress tracks the remaining three
  // optional pieces the Course Builder UI shows: banner, lessons, final quiz.
  const segments = [true, Boolean(course.banner_ref), lessonCount > 0, hasQuiz];
  const setupProgress = Math.round((segments.filter(Boolean).length / segments.length) * 100);

  return {
    courseId: course.id,
    name: course.name,
    learningPath: course.learning_path,
    description: course.description,
    difficulty: course.difficulty,
    estimatedDuration: Number(course.estimated_duration),
    totalXpReward: course.total_xp_reward,
    status: course.status,
    bannerRef: course.banner_ref,
    lessonCount,
    quizCount: hasQuiz ? 1 : 0,
    setupProgress,
    createdAt: course.created_at,
    updatedAt: course.updated_at,
  };
}

export async function createCourse(
  requester: RequesterContext,
  input: CreateCourseInput,
  ctx: ClientContext,
): Promise<CourseDTO> {
  const course = await pgRepo.insertCourse(requester.id, input);

  // A course always starts with one default module so lesson creation works
  // immediately — the Course Builder UI doesn't have a separate "create
  // module" step, but Postgres lessons.module_id is required (see
  // modules/lessons). Additional/renamed modules can be added later via the
  // module API once the frontend surfaces that.
  try {
    await courseModulesRepo.insertModule(course.id, requester.id, { title: 'Module 1' }, 1);
  } catch (err) {
    logger.error('Failed to create default module — rolling back course record', {
      courseId: course.id,
      message: err instanceof Error ? err.message : 'unknown error',
    });
    try {
      await pgRepo.deleteCourseHard(course.id);
    } catch (cleanupErr) {
      logger.error('Course rollback also failed — orphaned course record needs manual cleanup', {
        courseId: course.id,
        message: cleanupErr instanceof Error ? cleanupErr.message : 'unknown error',
      });
    }
    throw new AppError('Failed to initialize course structure. Please try again.', 500);
  }

  try {
    await mongoRepo.createCourseContent(course.id);
  } catch (err) {
    // Postgres and Mongo aren't in a shared transaction — compensate by
    // deleting everything just created so we never leave a course with no
    // content document behind.
    logger.error('Failed to create course_content — rolling back course record', {
      courseId: course.id,
      message: err instanceof Error ? err.message : 'unknown error',
    });
    try {
      await pgRepo.deleteCourseHard(course.id); // cascades the default module too
    } catch (cleanupErr) {
      logger.error('Course rollback also failed — orphaned course record needs manual cleanup', {
        courseId: course.id,
        message: cleanupErr instanceof Error ? cleanupErr.message : 'unknown error',
      });
    }
    throw new AppError('Failed to initialize course content. Please try again.', 500);
  }

  await writeAuditLog({
    actorUserId: requester.id,
    action: 'course.create',
    targetType: 'course',
    targetId: course.id,
    metadata: { name: course.name, learningPath: course.learning_path },
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
  });

  return toDTO(course, 0, false);
}

export async function listCoursesForCreator(
  requester: RequesterContext,
): Promise<{ items: CourseDTO[]; counts: CourseCounts }> {
  // Counts are computed from Postgres only — MongoDB document counts are
  // never used for the dashboard's numbers.
  const [records, counts] = await Promise.all([
    pgRepo.findCoursesByCreator(requester.id),
    pgRepo.getCourseCounts(requester.id),
  ]);

  const items = await Promise.all(
    records.map(async (record) => {
      const [lessonCount, content] = await Promise.all([
        countLessonsForCourse(record.id),
        mongoRepo.findCourseContentByCourseId(record.id),
      ]);
      return toDTO(record, lessonCount, Boolean(content?.finalQuiz));
    }),
  );

  return { items, counts };
}

export async function getCourseDetail(
  requester: RequesterContext,
  courseId: string,
  ctx: ClientContext,
): Promise<CourseDTO> {
  const course = await pgRepo.findCourseById(courseId);
  if (!course) throw new AppError('Course not found.', 404);
  await assertOwnership(requester, course, ctx);

  const [lessonCount, content] = await Promise.all([
    countLessonsForCourse(courseId),
    mongoRepo.findCourseContentByCourseId(courseId),
  ]);
  return toDTO(course, lessonCount, Boolean(content?.finalQuiz));
}

export async function updateCourse(
  requester: RequesterContext,
  courseId: string,
  input: UpdateCourseInput,
  ctx: ClientContext,
): Promise<CourseDTO> {
  const course = await pgRepo.findCourseById(courseId);
  if (!course) throw new AppError('Course not found.', 404);
  await assertOwnership(requester, course, ctx);

  await pgRepo.updateCourse(courseId, input);

  await writeAuditLog({
    actorUserId: requester.id,
    action: 'course.update',
    targetType: 'course',
    targetId: courseId,
    metadata: { changes: input },
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
  });

  return getCourseDetail(requester, courseId, ctx);
}

export async function archiveCourse(
  requester: RequesterContext,
  courseId: string,
  ctx: ClientContext,
): Promise<void> {
  const course = await pgRepo.findCourseById(courseId);
  if (!course) throw new AppError('Course not found.', 404);
  await assertOwnership(requester, course, ctx);

  if (course.status === 'archived') {
    throw new AppError('Course is already archived.', 400);
  }

  await pgRepo.setCourseStatus(courseId, 'archived');

  await writeAuditLog({
    actorUserId: requester.id,
    action: 'course.archive',
    targetType: 'course',
    targetId: courseId,
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
  });
}

/**
 * Every lesson needs at least one graded check before a course can go live —
 * a learner must never be able to complete a published lesson with nothing
 * to answer. Checked here (not at lesson-save time) so drafting stays free-form.
 */
async function assertLessonsReadyForPublish(courseId: string): Promise<void> {
  const lessons = await findLessonsByCourse(courseId);
  if (lessons.length === 0) {
    throw new AppError('Add at least one lesson before publishing this course.', 400);
  }

  const missing: string[] = [];
  for (const lesson of lessons) {
    const content = await findLessonContentByLessonId(lesson.id);
    const blocks = content?.blocks ?? [];
    const hasGradedCheck = blocks.some((b) => {
      if (b.type !== 'KNOWLEDGE_CHECK' && b.type !== 'QUIZ') return false;
      const questions = (b.content as Record<string, unknown>)?.questions as unknown[] | undefined;
      return Array.isArray(questions) && questions.length > 0;
    });
    if (!hasGradedCheck) {
      missing.push(lesson.title);
    }
  }

  if (missing.length > 0) {
    throw new AppError(
      `Every lesson needs a Knowledge Check or Quiz with at least one question before publishing. Missing on: ${missing.join(', ')}.`,
      400,
    );
  }
}

export async function changeCourseStatus(
  requester: RequesterContext,
  courseId: string,
  status: CourseStatus,
  ctx: ClientContext,
): Promise<CourseDTO> {
  const course = await pgRepo.findCourseById(courseId);
  if (!course) throw new AppError('Course not found.', 404);
  await assertOwnership(requester, course, ctx);

  if (course.status === status) {
    throw new AppError(`Course is already ${status}.`, 400);
  }
  if (!VALID_STATUS_TRANSITIONS[course.status].includes(status)) {
    throw new AppError(`Cannot change course status from ${course.status} to ${status}.`, 400);
  }

  if (status === 'published') {
    await assertLessonsReadyForPublish(courseId);
  }

  await pgRepo.setCourseStatus(courseId, status);

  await writeAuditLog({
    actorUserId: requester.id,
    action: 'course.status_change',
    targetType: 'course',
    targetId: courseId,
    metadata: { from: course.status, to: status },
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
  });

  return getCourseDetail(requester, courseId, ctx);
}
