import { Router } from 'express';
import * as controller from './learner.controller';
import {
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
learnerRouter.get('/profile', controller.getProfile);
learnerRouter.post('/profile/photo', controller.uploadProfilePhoto);
// Registered before '/courses/:courseId' so the literal path isn't swallowed by the UUID param route.
learnerRouter.get('/courses', controller.listMyCourses);
learnerRouter.get('/courses/:courseId', courseIdParamValidation, validate, controller.getCourse);
learnerRouter.get('/courses/:courseId/final-quiz', courseIdParamValidation, validate, controller.getFinalQuiz);
learnerRouter.post(
  '/courses/:courseId/final-quiz/attempt',
  courseIdParamValidation,
  blockAttemptValidation,
  validate,
  controller.submitFinalQuizAttempt,
);
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
