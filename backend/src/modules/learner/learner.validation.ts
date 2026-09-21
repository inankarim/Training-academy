import { param, body } from 'express-validator';

export const learningPathParamValidation = [
  param('learningPath').isString().trim().notEmpty().withMessage('A learning path is required.'),
];

export const courseIdParamValidation = [param('courseId').isUUID().withMessage('A valid course ID is required.')];
export const lessonIdParamValidation = [param('lessonId').isUUID().withMessage('A valid lesson ID is required.')];
export const blockIdParamValidation = [
  param('blockId').isString().trim().notEmpty().withMessage('A valid block ID is required.'),
];

export const blockAttemptValidation = [
  body('answers').isArray({ min: 1 }).withMessage('answers must be a non-empty array.'),
  body('answers.*.questionId').isString().trim().notEmpty().withMessage('Each answer needs a questionId.'),
  body('answers.*.selectedAnswer').isString().trim().notEmpty().withMessage('Each answer needs a selectedAnswer.'),
];
