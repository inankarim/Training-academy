import { body, param, query } from 'express-validator';

export const assignmentIdParamValidation = [
  param('assignmentId').isUUID().withMessage('A valid assignment ID is required.'),
];

export const createAssignmentValidation = [
  body('courseId').isUUID().withMessage('A valid course ID is required.'),
  body('userId').isUUID().withMessage('A valid user ID is required.'),
  body('dueDate').isISO8601().withMessage('A valid due date is required.'),
];

export const listAssignmentsValidation = [
  query('courseId').optional().isUUID(),
  query('userId').optional().isUUID(),
  query('status').optional().isIn(['assigned', 'in_progress', 'completed']),
];
