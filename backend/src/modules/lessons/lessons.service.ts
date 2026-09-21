import { AppError } from '../../middleware/errorHandler';
import { writeAuditLog } from '../../utils/auditLog';
import { logger } from '../../utils/logger';
import * as coursesPgRepo from '../courses/courses.postgres.repository';
import * as courseModulesRepo from './courseModules.postgres.repository';
import * as lessonsRepo from './lessons.postgres.repository';
import * as lessonsMongoRepo from './lessons.mongo.repository';
import { BLOCK_TYPE_CATALOG } from './blockTypes';
import { validateBlockContent } from './blockContentValidation';
import {
  CourseModuleDTO,
  CourseModuleRecord,
  CreateModuleInput,
  UpdateModuleInput,
  LessonRecord,
  LessonSummaryDTO,
  LessonDetailDTO,
  CreateLessonInput,
  UpdateLessonInput,
  AddBlockInput,
  UpdateBlockInput,
  RequesterContext,
} from './lessons.types';
import { ClientContext } from '../auth/auth.types';

// ---------------------------------------------------------------------------
// Ownership chain: a module/lesson/block's owner is its course's created_by.
// Mirrors Course Builder's exact ownership pattern (courses.service.ts).
// ---------------------------------------------------------------------------

async function loadOwnedCourse(requester: RequesterContext, courseId: string, ctx: ClientContext) {
  const course = await coursesPgRepo.findCourseById(courseId);
  if (!course) throw new AppError('Course not found.', 404);
  if (course.created_by !== requester.id) {
    await writeAuditLog({
      actorUserId: requester.id,
      action: 'lesson.access_denied',
      targetType: 'course',
      targetId: courseId,
      metadata: { reason: 'not_owner' },
      ipAddress: ctx.ip,
      userAgent: ctx.userAgent,
    });
    throw new AppError('You do not have access to this course.', 403);
  }
  return course;
}

async function loadOwnedModule(
  requester: RequesterContext,
  courseId: string,
  moduleId: string,
  ctx: ClientContext,
): Promise<CourseModuleRecord> {
  await loadOwnedCourse(requester, courseId, ctx);
  const courseModule = await courseModulesRepo.findModuleById(moduleId);
  if (!courseModule || courseModule.course_id !== courseId) {
    throw new AppError('Module not found in this course.', 404);
  }
  return courseModule;
}

/** Loads a lesson and verifies the requester owns its parent course. */
async function loadOwnedLesson(
  requester: RequesterContext,
  lessonId: string,
  ctx: ClientContext,
): Promise<LessonRecord> {
  const lesson = await lessonsRepo.findLessonById(lessonId);
  if (!lesson) throw new AppError('Lesson not found.', 404);

  const course = await coursesPgRepo.findCourseById(lesson.course_id);
  if (!course || course.created_by !== requester.id) {
    await writeAuditLog({
      actorUserId: requester.id,
      action: 'lesson.access_denied',
      targetType: 'lesson',
      targetId: lessonId,
      metadata: { reason: 'not_owner' },
      ipAddress: ctx.ip,
      userAgent: ctx.userAgent,
    });
    throw new AppError('You do not have access to this lesson.', 403);
  }
  return lesson;
}

// ---------------------------------------------------------------------------
// Modules
// ---------------------------------------------------------------------------

async function toModuleDTO(record: CourseModuleRecord, withLessons: boolean): Promise<CourseModuleDTO> {
  const lessons = await lessonsRepo.findLessonsByModule(record.id);
  const dto: CourseModuleDTO = {
    moduleId: record.id,
    courseId: record.course_id,
    title: record.title,
    sortOrder: record.sort_order,
    lessonCount: lessons.length,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  };
  if (withLessons) {
    dto.lessons = await Promise.all(lessons.map((l) => toLessonSummaryDTO(l)));
  }
  return dto;
}

export async function createModule(
  requester: RequesterContext,
  courseId: string,
  input: CreateModuleInput,
  ctx: ClientContext,
): Promise<CourseModuleDTO> {
  await loadOwnedCourse(requester, courseId, ctx);

  const sortOrder = await courseModulesRepo.getNextModuleSortOrder(courseId);
  const record = await courseModulesRepo.insertModule(courseId, requester.id, input, sortOrder);

  await writeAuditLog({
    actorUserId: requester.id,
    action: 'module.create',
    targetType: 'module',
    targetId: record.id,
    metadata: { courseId, title: record.title },
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
  });

  return toModuleDTO(record, false);
}

export async function listModules(
  requester: RequesterContext,
  courseId: string,
  ctx: ClientContext,
): Promise<CourseModuleDTO[]> {
  await loadOwnedCourse(requester, courseId, ctx);
  const records = await courseModulesRepo.findModulesByCourse(courseId);
  return Promise.all(records.map((r) => toModuleDTO(r, true)));
}

export async function updateModule(
  requester: RequesterContext,
  courseId: string,
  moduleId: string,
  input: UpdateModuleInput,
  ctx: ClientContext,
): Promise<CourseModuleDTO> {
  const record = await loadOwnedModule(requester, courseId, moduleId, ctx);
  await courseModulesRepo.updateModule(moduleId, input);

  await writeAuditLog({
    actorUserId: requester.id,
    action: 'module.update',
    targetType: 'module',
    targetId: moduleId,
    metadata: { changes: input },
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
  });

  const updated = await courseModulesRepo.findModuleById(moduleId);
  return toModuleDTO(updated ?? record, false);
}

export async function deleteModule(
  requester: RequesterContext,
  courseId: string,
  moduleId: string,
  ctx: ClientContext,
): Promise<void> {
  await loadOwnedModule(requester, courseId, moduleId, ctx);

  const lessonCount = await courseModulesRepo.countLessonsForModule(moduleId);
  if (lessonCount > 0) {
    throw new AppError('This module still has lessons. Delete or move them first.', 400);
  }

  await courseModulesRepo.deleteModule(moduleId);

  await writeAuditLog({
    actorUserId: requester.id,
    action: 'module.delete',
    targetType: 'module',
    targetId: moduleId,
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
  });
}

export async function reorderModules(
  requester: RequesterContext,
  courseId: string,
  moduleIds: string[],
  ctx: ClientContext,
): Promise<void> {
  await loadOwnedCourse(requester, courseId, ctx);

  const existing = await courseModulesRepo.findModulesByCourse(courseId);
  const existingIds = new Set(existing.map((m) => m.id));
  const requestedIds = new Set(moduleIds);
  const sameSet =
    existingIds.size === requestedIds.size && [...existingIds].every((id) => requestedIds.has(id));
  if (!sameSet) {
    throw new AppError("moduleIds must match the course's existing module set exactly.", 400);
  }

  await Promise.all(moduleIds.map((id, index) => courseModulesRepo.setModuleSortOrder(id, index + 1)));

  await writeAuditLog({
    actorUserId: requester.id,
    action: 'module.reorder',
    targetType: 'course',
    targetId: courseId,
    metadata: { moduleIds },
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
  });
}

// ---------------------------------------------------------------------------
// Lessons
// ---------------------------------------------------------------------------

async function toLessonSummaryDTO(record: LessonRecord): Promise<LessonSummaryDTO> {
  const content = await lessonsMongoRepo.findLessonContentByLessonId(record.id);
  return {
    lessonId: record.id,
    courseId: record.course_id,
    moduleId: record.module_id,
    title: record.title,
    description: record.description,
    sortOrder: record.sort_order,
    status: record.status,
    blockCount: content?.blocks.length ?? 0,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  };
}

export async function createLesson(
  requester: RequesterContext,
  courseId: string,
  moduleId: string,
  input: CreateLessonInput,
  ctx: ClientContext,
): Promise<LessonSummaryDTO> {
  await loadOwnedModule(requester, courseId, moduleId, ctx);

  const sortOrder = await lessonsRepo.getNextLessonSortOrder(moduleId);
  const lesson = await lessonsRepo.insertLesson(courseId, moduleId, requester.id, input, sortOrder);

  try {
    await lessonsMongoRepo.createLessonContent(lesson.id, courseId, moduleId);
  } catch (err) {
    logger.error('Failed to create lesson_content — rolling back lesson record', {
      lessonId: lesson.id,
      message: err instanceof Error ? err.message : 'unknown error',
    });
    try {
      await lessonsRepo.deleteLessonHard(lesson.id);
    } catch (cleanupErr) {
      logger.error('Lesson rollback also failed — orphaned lesson record needs manual cleanup', {
        lessonId: lesson.id,
        message: cleanupErr instanceof Error ? cleanupErr.message : 'unknown error',
      });
    }
    throw new AppError('Failed to initialize lesson content. Please try again.', 500);
  }

  await writeAuditLog({
    actorUserId: requester.id,
    action: 'lesson.create',
    targetType: 'lesson',
    targetId: lesson.id,
    metadata: { courseId, moduleId, title: lesson.title },
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
  });

  return toLessonSummaryDTO(lesson);
}

export async function getLessonDetail(
  requester: RequesterContext,
  lessonId: string,
  ctx: ClientContext,
): Promise<LessonDetailDTO> {
  const lesson = await loadOwnedLesson(requester, lessonId, ctx);
  const content = await lessonsMongoRepo.findLessonContentByLessonId(lessonId);

  return {
    lessonId: lesson.id,
    courseId: lesson.course_id,
    moduleId: lesson.module_id,
    title: lesson.title,
    description: lesson.description,
    sortOrder: lesson.sort_order,
    status: lesson.status,
    blockCount: content?.blocks.length ?? 0,
    createdAt: lesson.created_at,
    updatedAt: lesson.updated_at,
    blocks: content?.blocks.map((b) => b.toObject()) ?? [],
    contentVersion: content?.contentVersion ?? 1,
  };
}

export async function updateLesson(
  requester: RequesterContext,
  lessonId: string,
  input: UpdateLessonInput,
  ctx: ClientContext,
): Promise<LessonDetailDTO> {
  await loadOwnedLesson(requester, lessonId, ctx);
  await lessonsRepo.updateLesson(lessonId, input);

  await writeAuditLog({
    actorUserId: requester.id,
    action: 'lesson.update',
    targetType: 'lesson',
    targetId: lessonId,
    metadata: { changes: input },
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
  });

  return getLessonDetail(requester, lessonId, ctx);
}

export async function deleteLesson(
  requester: RequesterContext,
  lessonId: string,
  ctx: ClientContext,
): Promise<void> {
  await loadOwnedLesson(requester, lessonId, ctx);

  try {
    await lessonsMongoRepo.deleteLessonContent(lessonId);
  } catch (err) {
    // Content cleanup failing must not block the primary delete — the
    // Postgres row is the authoritative identity; a stray Mongo doc left
    // behind is just orphaned data, logged for later cleanup.
    logger.error('Failed to delete lesson_content during lesson deletion', {
      lessonId,
      message: err instanceof Error ? err.message : 'unknown error',
    });
  }

  await lessonsRepo.deleteLessonHard(lessonId);

  await writeAuditLog({
    actorUserId: requester.id,
    action: 'lesson.delete',
    targetType: 'lesson',
    targetId: lessonId,
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
  });
}

export async function reorderLessons(
  requester: RequesterContext,
  courseId: string,
  moduleId: string,
  lessonIds: string[],
  ctx: ClientContext,
): Promise<void> {
  await loadOwnedModule(requester, courseId, moduleId, ctx);

  const existing = await lessonsRepo.findLessonsByModule(moduleId);
  const existingIds = new Set(existing.map((l) => l.id));
  const requestedIds = new Set(lessonIds);
  const sameSet =
    existingIds.size === requestedIds.size && [...existingIds].every((id) => requestedIds.has(id));
  if (!sameSet) {
    throw new AppError("lessonIds must match the module's existing lesson set exactly.", 400);
  }

  await Promise.all(lessonIds.map((id, index) => lessonsRepo.setLessonSortOrder(id, index + 1)));

  await writeAuditLog({
    actorUserId: requester.id,
    action: 'lesson.reorder',
    targetType: 'module',
    targetId: moduleId,
    metadata: { lessonIds },
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
  });
}

// ---------------------------------------------------------------------------
// Content blocks
// ---------------------------------------------------------------------------

export function getBlockTypeCatalog() {
  return BLOCK_TYPE_CATALOG;
}

export async function addBlock(
  requester: RequesterContext,
  lessonId: string,
  input: AddBlockInput,
  ctx: ClientContext,
) {
  await loadOwnedLesson(requester, lessonId, ctx);
  validateBlockContent(input.type, input.content);

  let blocks;
  try {
    blocks = await lessonsMongoRepo.addBlock(lessonId, input.type, input.position, input.content ?? {}, input.style ?? {});
  } catch (err) {
    throw new AppError(err instanceof Error ? err.message : 'Failed to add block.', 400);
  }

  await writeAuditLog({
    actorUserId: requester.id,
    action: 'lesson.block_added',
    targetType: 'lesson',
    targetId: lessonId,
    metadata: { type: input.type, position: input.position },
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
  });

  return blocks;
}

export async function updateBlock(
  requester: RequesterContext,
  lessonId: string,
  blockId: string,
  input: UpdateBlockInput,
  ctx: ClientContext,
) {
  await loadOwnedLesson(requester, lessonId, ctx);

  if (input.content !== undefined) {
    const existingContent = await lessonsMongoRepo.findLessonContentByLessonId(lessonId);
    const existingBlock = existingContent?.blocks.find((b) => b.id === blockId);
    if (!existingBlock) throw new AppError('Block not found.', 404);
    validateBlockContent(existingBlock.type, input.content);
  }

  let blocks;
  try {
    blocks = await lessonsMongoRepo.updateBlock(lessonId, blockId, input);
  } catch (err) {
    throw new AppError(err instanceof Error ? err.message : 'Failed to update block.', 400);
  }

  await writeAuditLog({
    actorUserId: requester.id,
    action: 'lesson.block_updated',
    targetType: 'lesson',
    targetId: lessonId,
    metadata: { blockId },
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
  });

  return blocks;
}

export async function deleteBlock(
  requester: RequesterContext,
  lessonId: string,
  blockId: string,
  ctx: ClientContext,
) {
  await loadOwnedLesson(requester, lessonId, ctx);

  let blocks;
  try {
    blocks = await lessonsMongoRepo.deleteBlock(lessonId, blockId);
  } catch (err) {
    throw new AppError(err instanceof Error ? err.message : 'Failed to delete block.', 400);
  }

  await writeAuditLog({
    actorUserId: requester.id,
    action: 'lesson.block_deleted',
    targetType: 'lesson',
    targetId: lessonId,
    metadata: { blockId },
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
  });

  return blocks;
}

export async function reorderBlocks(
  requester: RequesterContext,
  lessonId: string,
  blockIds: string[],
  ctx: ClientContext,
) {
  await loadOwnedLesson(requester, lessonId, ctx);

  let blocks;
  try {
    blocks = await lessonsMongoRepo.reorderBlocks(lessonId, blockIds);
  } catch (err) {
    throw new AppError(err instanceof Error ? err.message : 'Failed to reorder blocks.', 400);
  }

  await writeAuditLog({
    actorUserId: requester.id,
    action: 'lesson.block_reordered',
    targetType: 'lesson',
    targetId: lessonId,
    metadata: { blockIds },
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
  });

  return blocks;
}
