import { Router } from 'express';
import * as controller from './notifications.controller';
import { notificationIdParamValidation, listNotificationsValidation, sendCustomMessageValidation } from './notifications.validation';
import { validate } from '../../middleware/validate';
import { requireAuth, requireRole } from '../../middleware/auth.middleware';

export const notificationsRouter = Router();

// Every authenticated role (including learner) can read/manage their own
// notifications — the query in notifications.mongo.repository.ts already
// scopes results to "this recipient", so no role restriction belongs here.
notificationsRouter.use(requireAuth);

notificationsRouter.get('/', listNotificationsValidation, validate, controller.listNotifications);
notificationsRouter.get('/unread-count', controller.getUnreadCount);
notificationsRouter.post('/read-all', controller.markAllRead);
notificationsRouter.post('/:id/read', notificationIdParamValidation, validate, controller.markRead);
notificationsRouter.post(
  '/custom',
  requireRole('admin', 'super_admin'),
  sendCustomMessageValidation,
  validate,
  controller.sendCustomMessage,
);
