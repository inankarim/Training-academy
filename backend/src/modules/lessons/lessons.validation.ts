import { body, param } from 'express-validator';
import { BLOCK_TYPES } from './blockTypes';

const LESSON_STATUSES = ['draft', 'ready', 'published'];

export const courseIdParamValidation = [param('courseId').isUUID().withMessage('A valid course ID is required.')];
export const moduleIdParamValidation = [param('moduleId').isUUID().withMessage('A valid module ID is required.')];
export const lessonIdParamValidation = [param('lessonId').isUUID().withMessage('A valid lesson ID is required.')];
export const blockIdParamValidation = [param('blockId').isString().trim().notEmpty().withMessage('A valid block ID is required.')];

export const createModuleValidation = [
  body('title').trim().isLength({ min: 2, max: 200 }).withMessage('Module title must be between 2 and 200 characters.'),
];

export const updateModuleValidation = [
  body('title').optional().trim().isLength({ min: 2, max: 200 }).withMessage('Module title must be between 2 and 200 characters.'),
];

export const moduleReorderValidation = [
  body('moduleIds').isArray({ min: 1 }).withMessage('moduleIds must be a non-empty array.'),
  body('moduleIds.*').isUUID().withMessage('Each module ID must be a valid UUID.'),
];

export const createLessonValidation = [
  body('title').trim().isLength({ min: 2, max: 200 }).withMessage('Lesson title must be between 2 and 200 characters.'),
  body('description').optional({ nullable: true }).trim().isLength({ max: 5000 }).withMessage('Description cannot exceed 5000 characters.'),
];

export const updateLessonValidation = [
  body('title').optional().trim().isLength({ min: 2, max: 200 }).withMessage('Lesson title must be between 2 and 200 characters.'),
  body('description').optional({ nullable: true }).trim().isLength({ max: 5000 }).withMessage('Description cannot exceed 5000 characters.'),
  body('status')
    .optional()
    .trim()
    .toLowerCase()
    .isIn(LESSON_STATUSES)
    .withMessage(`Status must be one of: ${LESSON_STATUSES.join(', ')}.`),
];

export const lessonReorderValidation = [
  body('lessonIds').isArray({ min: 1 }).withMessage('lessonIds must be a non-empty array.'),
  body('lessonIds.*').isUUID().withMessage('Each lesson ID must be a valid UUID.'),
];

export const addBlockValidation = [
  body('type')
    .trim()
    .toUpperCase()
    .isIn(BLOCK_TYPES)
    .withMessage(`type must be one of: ${BLOCK_TYPES.join(', ')}.`),
  body('position').optional().isInt({ min: 1 }).withMessage('position must be a positive integer.').toInt(),
  body('content').optional().isObject().withMessage('content must be an object.'),
  body('style').optional().isObject().withMessage('style must be an object.'),
];

export const updateBlockValidation = [
  body('content').optional().isObject().withMessage('content must be an object.'),
  body('style').optional().isObject().withMessage('style must be an object.'),
];

export const blockReorderValidation = [
  body('blockIds').isArray({ min: 1 }).withMessage('blockIds must be a non-empty array.'),
  body('blockIds.*').isString().trim().notEmpty().withMessage('Each block ID must be a non-empty string.'),
];
