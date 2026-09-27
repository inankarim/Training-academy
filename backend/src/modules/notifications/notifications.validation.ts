import { body, param, query } from 'express-validator';

export const notificationIdParamValidation = [
  param('id').isString().notEmpty().withMessage('A notification id is required.'),
];

export const listNotificationsValidation = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('pageSize').optional().isInt({ min: 1, max: 100 }).toInt(),
];

export const sendCustomMessageValidation = [
  body('title').isString().trim().notEmpty().withMessage('Title is required.'),
  body('message').isString().trim().notEmpty().withMessage('Message is required.'),
  body('targetLearnerIds')
    .custom((value) => value === 'all' || (Array.isArray(value) && value.every((id) => typeof id === 'string')))
    .withMessage('targetLearnerIds must be "all" or an array of user ids.'),
];
