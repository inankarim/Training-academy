import { body, param } from 'express-validator';

const DIFFICULTIES = ['beginner', 'intermediate', 'advanced'];
const STATUSES = ['draft', 'published', 'archived'];

export const courseIdParamValidation = [
  param('courseId').isUUID().withMessage('A valid course ID is required.'),
];

export const createCourseValidation = [
  body('name').trim().isLength({ min: 2, max: 200 }).withMessage('Course name must be between 2 and 200 characters.'),
  body('learningPath').trim().isLength({ min: 2, max: 150 }).withMessage('Learning path is required (max 150 characters).'),
  body('description').optional({ nullable: true }).trim().isLength({ max: 2000 }).withMessage('Description cannot exceed 2000 characters.'),
  body('difficulty')
    .trim()
    .toLowerCase()
    .isIn(DIFFICULTIES)
    .withMessage(`Difficulty must be one of: ${DIFFICULTIES.join(', ')}.`),
  body('estimatedDuration').isFloat({ min: 0, max: 1000 }).withMessage('Estimated duration must be a positive number of hours.').toFloat(),
  body('totalXpReward').isInt({ min: 0, max: 1000000 }).withMessage('Total XP reward must be a non-negative integer.').toInt(),
  body('bannerRef').optional({ nullable: true }).trim().isLength({ max: 500 }).withMessage('Banner reference cannot exceed 500 characters.'),
];

export const updateCourseValidation = [
  body('name').optional().trim().isLength({ min: 2, max: 200 }).withMessage('Course name must be between 2 and 200 characters.'),
  body('learningPath').optional().trim().isLength({ min: 2, max: 150 }).withMessage('Learning path cannot exceed 150 characters.'),
  body('description').optional({ nullable: true }).trim().isLength({ max: 2000 }).withMessage('Description cannot exceed 2000 characters.'),
  body('difficulty')
    .optional()
    .trim()
    .toLowerCase()
    .isIn(DIFFICULTIES)
    .withMessage(`Difficulty must be one of: ${DIFFICULTIES.join(', ')}.`),
  body('estimatedDuration').optional().isFloat({ min: 0, max: 1000 }).withMessage('Estimated duration must be a positive number of hours.').toFloat(),
  body('totalXpReward').optional().isInt({ min: 0, max: 1000000 }).withMessage('Total XP reward must be a non-negative integer.').toInt(),
  body('bannerRef').optional({ nullable: true }).trim().isLength({ max: 500 }).withMessage('Banner reference cannot exceed 500 characters.'),
];

export const statusValidation = [
  body('status')
    .trim()
    .toLowerCase()
    .isIn(STATUSES)
    .withMessage(`Status must be one of: ${STATUSES.join(', ')}.`),
];
