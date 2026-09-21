import { Router } from 'express';
import * as controller from './learner.controller';
import {
  learningPathParamValidation,
  courseIdParamValidation,
  lessonIdParamValidation,
  blockIdParamValidation,
  blockAttemptValidation,
} from './learner.validation';
import { validate } from '../../middleware/validate';
import { requireAuth } from '../../middleware/auth.middleware';

// No role gate beyond authentication: every endpoint here is scoped to
// req.user.id (their own assignments/progress/stats), so any authenticated
// account — including staff previewing "Learner View", already a feature in
// the existing frontend — can safely hit these without seeing anyone else's data.
export const learnerRouter = Router();
learnerRouter.use(requireAuth);

learnerRouter.get('/dashboard', controller.getDashboard);
learnerRouter.get('/learning-paths', controller.listLearningPaths);
learnerRouter.get(
  '/learning-paths/:learningPath/courses',
  learningPathParamValidation,
  validate,
  controller.listCoursesInPath,
);
learnerRouter.get('/courses/:courseId', courseIdParamValidation, validate, controller.getCourse);
learnerRouter.get('/lessons/:lessonId', lessonIdParamValidation, validate, controller.getLesson);
learnerRouter.post('/lessons/:lessonId/complete', lessonIdParamValidation, validate, controller.completeLesson);
learnerRouter.post(
  '/lessons/:lessonId/blocks/:blockId/attempt',
  lessonIdParamValidation,
  blockIdParamValidation,
  blockAttemptValidation,
  validate,
  controller.submitBlockAttempt,
);
