import { Router, Request, Response, NextFunction } from 'express';
import * as controller from './lessons.controller';
import {
  courseIdParamValidation,
  moduleIdParamValidation,
  lessonIdParamValidation,
  blockIdParamValidation,
  createModuleValidation,
  updateModuleValidation,
  moduleReorderValidation,
  createLessonValidation,
  updateLessonValidation,
  lessonReorderValidation,
  addBlockValidation,
  updateBlockValidation,
  blockReorderValidation,
} from './lessons.validation';
import { validate } from '../../middleware/validate';
import { requireAuth } from '../../middleware/auth.middleware';
import { AppError } from '../../middleware/errorHandler';
import { writeAuditLog } from '../../utils/auditLog';

/**
 * Same exclusivity rule as Course Builder (courses.routes.ts): the Lesson
 * Builder is content_creator-only, checked directly on role rather than via
 * requirePermission(), since admin/super_admin also hold the underlying
 * lessons.* permission keys but must not reach these builder endpoints.
 * Kept as a separate local copy (not shared with courses.routes.ts) so
 * Stage 1's working code isn't touched.
 */
function requireContentCreatorRole(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user) {
    next(new AppError('Authentication required.', 401));
    return;
  }
  if (req.user.role !== 'content_creator') {
    void writeAuditLog({
      actorUserId: req.user.id,
      action: 'lesson.access_denied',
      metadata: { reason: 'wrong_role', role: req.user.role },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
    next(new AppError('Only Content Creators can access the Lesson Builder.', 403));
    return;
  }
  next();
}

// --- Modules + their nested lessons: /content-creator/courses/:courseId/modules ---
export const courseModulesRouter = Router({ mergeParams: true });
courseModulesRouter.use(requireAuth, requireContentCreatorRole, courseIdParamValidation, validate);

courseModulesRouter.post('/', createModuleValidation, validate, controller.createModule);
courseModulesRouter.get('/', controller.listModules);
courseModulesRouter.put('/reorder', moduleReorderValidation, validate, controller.reorderModules);
courseModulesRouter.put(
  '/:moduleId',
  moduleIdParamValidation,
  updateModuleValidation,
  validate,
  controller.updateModule,
);
courseModulesRouter.delete('/:moduleId', moduleIdParamValidation, validate, controller.deleteModule);

courseModulesRouter.post(
  '/:moduleId/lessons',
  moduleIdParamValidation,
  createLessonValidation,
  validate,
  controller.createLesson,
);
courseModulesRouter.put(
  '/:moduleId/lessons/reorder',
  moduleIdParamValidation,
  lessonReorderValidation,
  validate,
  controller.reorderLessons,
);

// --- Lessons + their blocks: /content-creator/lessons ---
export const lessonsRouter = Router();
lessonsRouter.use(requireAuth, requireContentCreatorRole);

lessonsRouter.get('/:lessonId', lessonIdParamValidation, validate, controller.getLesson);
lessonsRouter.put(
  '/:lessonId',
  lessonIdParamValidation,
  updateLessonValidation,
  validate,
  controller.updateLesson,
);
lessonsRouter.delete('/:lessonId', lessonIdParamValidation, validate, controller.deleteLesson);

lessonsRouter.post(
  '/:lessonId/blocks',
  lessonIdParamValidation,
  addBlockValidation,
  validate,
  controller.addBlock,
);
lessonsRouter.put(
  '/:lessonId/blocks/reorder',
  lessonIdParamValidation,
  blockReorderValidation,
  validate,
  controller.reorderBlocks,
);
lessonsRouter.patch(
  '/:lessonId/blocks/:blockId',
  lessonIdParamValidation,
  blockIdParamValidation,
  updateBlockValidation,
  validate,
  controller.updateBlock,
);
lessonsRouter.delete(
  '/:lessonId/blocks/:blockId',
  lessonIdParamValidation,
  blockIdParamValidation,
  validate,
  controller.deleteBlock,
);

// --- Lesson Builder metadata: /content-creator/lesson-builder ---
export const lessonBuilderRouter = Router();
lessonBuilderRouter.use(requireAuth, requireContentCreatorRole);
lessonBuilderRouter.get('/block-types', controller.getBlockTypes);
