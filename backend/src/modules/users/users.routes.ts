import { Router } from 'express';
import * as controller from './users.controller';
import { createUserValidation, updateUserValidation } from './users.validation';
import { validate } from '../../middleware/validate';
import { requireAuth, requirePermission } from '../../middleware/auth.middleware';

export const usersRouter = Router();

usersRouter.use(requireAuth);

// Meta endpoint for departments, regions, areas, territories, sales roles
usersRouter.get(
  '/meta/organizational',
  requirePermission('users.view'),
  controller.getOrganizationalMetadata,
);

usersRouter.post(
  '/',
  requirePermission('users.create'),
  createUserValidation,
  validate,
  controller.createUser,
);

usersRouter.get(
  '/',
  requirePermission('users.view'),
  controller.listUsers,
);

usersRouter.get(
  '/:id',
  requirePermission('users.view'),
  controller.getUser,
);

usersRouter.put(
  '/:id',
  requirePermission('users.update'),
  updateUserValidation,
  validate,
  controller.updateUser,
);

usersRouter.post(
  '/:id/deactivate',
  requirePermission('users.deactivate'),
  controller.deactivateUser,
);

usersRouter.post(
  '/:id/reactivate',
  requirePermission('users.deactivate'),
  controller.reactivateUser,
);
