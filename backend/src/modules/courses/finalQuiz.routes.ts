import { Router, Request, Response, NextFunction } from 'express';
import * as controller from './finalQuiz.controller';
import {
  courseIdParamValidation,
  questionIdParamValidation,
  updateFinalQuizConfigValidation,
  addFinalQuizQuestionValidation,
  updateFinalQuizQuestionValidation,
  reorderFinalQuizQuestionsValidation,
} from './finalQuiz.validation';
import { validate } from '../../middleware/validate';
import { requireAuth } from '../../middleware/auth.middleware';
import { AppError } from '../../middleware/errorHandler';
import { writeAuditLog } from '../../utils/auditLog';

/**
 * Same exclusivity + local-guard pattern as courses.routes.ts and
 * lessons.routes.ts (see those files for why this isn't requirePermission()
 * and isn't a shared middleware).
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
      metadata: { reason: 'wrong_role', role: req.user.role, scope: 'final_quiz' },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
    next(new AppError('Only Content Creators can access the Course Builder.', 403));
    return;
  }
  next();
}

// Mounted at /content-creator/courses/:courseId/final-quiz
export const finalQuizRouter = Router({ mergeParams: true });
finalQuizRouter.use(requireAuth, requireContentCreatorRole, courseIdParamValidation, validate);

finalQuizRouter.get('/', controller.getFinalQuiz);
finalQuizRouter.put('/', updateFinalQuizConfigValidation, validate, controller.updateFinalQuizConfig);

finalQuizRouter.post('/questions', addFinalQuizQuestionValidation, validate, controller.addQuestion);
finalQuizRouter.put(
  '/questions/reorder',
  reorderFinalQuizQuestionsValidation,
  validate,
  controller.reorderQuestions,
);
finalQuizRouter.put(
  '/questions/:questionId',
  questionIdParamValidation,
  updateFinalQuizQuestionValidation,
  validate,
  controller.updateQuestion,
);
finalQuizRouter.delete(
  '/questions/:questionId',
  questionIdParamValidation,
  validate,
  controller.deleteQuestion,
);
