import { body } from 'express-validator';

export const loginValidation = [
  body('email').isEmail().withMessage('A valid email is required.').normalizeEmail(),
  body('password').isString().isLength({ min: 1 }).withMessage('Password is required.'),
];

export const changePasswordValidation = [
  body('currentPassword').isString().notEmpty().withMessage('Current password is required.'),
  body('newPassword')
    .isString()
    .isLength({ min: 10 })
    .withMessage('New password must be at least 10 characters.')
    .matches(/[A-Z]/)
    .withMessage('New password must contain an uppercase letter.')
    .matches(/[a-z]/)
    .withMessage('New password must contain a lowercase letter.')
    .matches(/[0-9]/)
    .withMessage('New password must contain a number.'),
];
