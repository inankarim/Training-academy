import { Router, Request, Response, NextFunction } from 'express';
import * as controller from './assignments.controller';
import {
  assignmentIdParamValidation,
  createAssignmentValidation,
  listAssignmentsValidation,
} from './assignments.validation';
import { validate } from '../../middleware/validate';
import { requireAuth } from '../../middleware/auth.middleware';
import { AppError } from '../../middleware/errorHandler';
import { writeAuditLog } from '../../utils/auditLog';

/**
 * HR-exclusive, checked directly on role (not requirePermission) — confirmed
 * choice: admin also holds assignments.create/view in the seeded RBAC data,
 * but assignment is scoped to hr only here, same exclusivity pattern as
 * Course/Lesson Builder being content_creator-only.
 */
function requireHrRole(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user) {
    next(new AppError('Authentication required.', 401));
    return;
  }
  if (req.user.role !== 'hr') {
    void writeAuditLog({
      actorUserId: req.user.id,
      action: 'assignment.access_denied',
      metadata: { reason: 'wrong_role', role: req.user.role },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
    next(new AppError('Only HR can manage course assignments.', 403));
    return;
  }
  next();
}

export const assignmentsRouter = Router();
assignmentsRouter.use(requireAuth, requireHrRole);

assignmentsRouter.post('/', createAssignmentValidation, validate, controller.createAssignment);
assignmentsRouter.get('/', listAssignmentsValidation, validate, controller.listAssignments);
// Registered before '/:assignmentId' so the literal path isn't swallowed by the UUID param route.
assignmentsRouter.get('/courses', controller.listAssignableCourses);
assignmentsRouter.get('/:assignmentId', assignmentIdParamValidation, validate, controller.getAssignment);
assignmentsRouter.delete('/:assignmentId', assignmentIdParamValidation, validate, controller.deleteAssignment);
