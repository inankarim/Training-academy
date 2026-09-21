import { Router } from 'express';
import * as controller from './auth.controller';
import { loginValidation, changePasswordValidation } from './auth.validation';
import { validate } from '../../middleware/validate';
import { requireAuth } from '../../middleware/auth.middleware';
import { createStrictRateLimiter } from '../../middleware/security';

export const authRouter = Router();

// Deliberately no POST /register — accounts are only created by an
// authorized Admin/HR/Super Admin through the user-management API.
authRouter.post('/login', createStrictRateLimiter(), loginValidation, validate, controller.login);
authRouter.post('/refresh', controller.refresh);
authRouter.post('/logout', controller.logout);
authRouter.get('/me', requireAuth, controller.me);
authRouter.post(
  '/change-password',
  requireAuth,
  changePasswordValidation,
  validate,
  controller.changePassword,
);
