import { Router } from 'express';
import { healthRouter } from './health.routes';
import { authRouter } from '../modules/auth/auth.routes';
import { usersRouter } from '../modules/users/users.routes';
import { coursesRouter } from '../modules/courses/courses.routes';
import { finalQuizRouter } from '../modules/courses/finalQuiz.routes';
import { courseModulesRouter, lessonsRouter, lessonBuilderRouter } from '../modules/lessons/lessons.routes';
import { uploadsRouter } from '../modules/uploads/uploads.routes';
import { assignmentsRouter } from '../modules/assignments/assignments.routes';
import { learnerRouter } from '../modules/learner/learner.routes';
import { notificationsRouter } from '../modules/notifications/notifications.routes';

// Every module's router gets mounted here, and only here. app.ts mounts
// this single router under /api/{version} — it never talks to individual
// module routers directly. Adding a new module (courses, quizzes, ...) means
// one import + one line below, and this file alone tells you the full API
// surface without opening every module folder.
export const apiRouter = Router();

apiRouter.use('/health', healthRouter);
apiRouter.use('/auth', authRouter);
apiRouter.use('/users', usersRouter);
// courseModulesRouter is mounted BEFORE coursesRouter deliberately: both
// prefixes overlap ('/content-creator/courses/...'), and coursesRouter's own
// unscoped requireContentCreatorRole middleware would otherwise intercept
// every nested /modules request first (Express runs a mounted router's
// path-less `.use()` middleware for any sub-path that reaches it, even one
// none of its own routes match) — wrong error message and audit action for
// module/lesson requests. Registering the more specific router first means
// it only reaches coursesRouter at all for paths modules/lessons don't own.
apiRouter.use('/content-creator/courses/:courseId/modules', courseModulesRouter);
apiRouter.use('/content-creator/courses/:courseId/final-quiz', finalQuizRouter);
apiRouter.use('/content-creator/courses', coursesRouter);
apiRouter.use('/content-creator/lessons', lessonsRouter);
apiRouter.use('/content-creator/lesson-builder', lessonBuilderRouter);
apiRouter.use('/content-creator/uploads', uploadsRouter);
apiRouter.use('/hr/assignments', assignmentsRouter);
apiRouter.use('/learner', learnerRouter);
apiRouter.use('/notifications', notificationsRouter);

// Future modules mount here, e.g.:
// apiRouter.use('/hr', hrRouter);
