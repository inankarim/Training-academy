import { Router, Request, Response, NextFunction } from 'express';
import * as controller from './courses.controller';
import {
  createCourseValidation,
  updateCourseValidation,
  courseIdParamValidation,
  statusValidation,
} from './courses.validation';
import { validate } from '../../middleware/validate';
import { requireAuth } from '../../middleware/auth.middleware';
import { AppError } from '../../middleware/errorHandler';
import { writeAuditLog } from '../../utils/auditLog';

export const coursesRouter = Router();

/**
 * The Course Builder is exclusively for the content_creator role — this
 * checks req.user.role directly rather than requirePermission(), because
 * admin/super_admin also hold the underlying courses.* permission keys
 * (for the future course-approval surface) but must NOT reach these
 * builder endpoints. Every rejection here is audit-logged.
 */
function requireContentCreatorRole(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user) {
    next(new AppError('Authentication required.', 401));
    return;
  }
  if (req.user.role !== 'content_creator') {
    void writeAuditLog({
      actorUserId: req.user.id,
      action: 'course.access_denied',
      metadata: { reason: 'wrong_role', role: req.user.role },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
    next(new AppError('Only Content Creators can access the Course Builder.', 403));
    return;
  }
  next();
}

coursesRouter.use(requireAuth, requireContentCreatorRole);

coursesRouter.post('/', createCourseValidation, validate, controller.createCourse);

coursesRouter.get('/', controller.listCourses);

coursesRouter.get('/:courseId', courseIdParamValidation, validate, controller.getCourse);

coursesRouter.put(
  '/:courseId',
  courseIdParamValidation,
  updateCourseValidation,
  validate,
  controller.updateCourse,
);

coursesRouter.delete('/:courseId', courseIdParamValidation, validate, controller.archiveCourse);

coursesRouter.put(
  '/:courseId/status',
  courseIdParamValidation,
  statusValidation,
  validate,
  controller.changeStatus,
);
