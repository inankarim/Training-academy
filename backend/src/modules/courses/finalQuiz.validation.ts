import { body, param } from 'express-validator';

export const courseIdParamValidation = [param('courseId').isUUID().withMessage('A valid course ID is required.')];
export const questionIdParamValidation = [
  param('questionId').isString().trim().notEmpty().withMessage('A valid question ID is required.'),
];

export const updateFinalQuizConfigValidation = [
  body('quizName').optional().trim().isLength({ min: 2, max: 200 }).withMessage('Quiz name must be between 2 and 200 characters.'),
  body('xpReward').optional().isInt({ min: 0, max: 1000000 }).withMessage('XP reward must be a non-negative integer.').toInt(),
  body('totalQuestions').optional().isInt({ min: 0, max: 500 }).withMessage('Total questions must be a non-negative integer.').toInt(),
  body('passingScore').optional().isInt({ min: 0, max: 100 }).withMessage('Passing score must be between 0 and 100.').toInt(),
  body('maxAttempts').optional().isInt({ min: 1, max: 20 }).withMessage('Max attempts must be between 1 and 20.').toInt(),
  body('retryPolicy.allowRetry').optional().isBoolean().withMessage('allowRetry must be a boolean.').toBoolean(),
  body('retryPolicy.hideCorrectAnswer').optional().isBoolean().withMessage('hideCorrectAnswer must be a boolean.').toBoolean(),
  body('retryPolicy.scoreDecayPercent')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('scoreDecayPercent must be between 0 and 100.')
    .toInt(),
];

// The Final Course Quiz requires exactly 4 options per question (per the
// product spec), unlike the in-lesson Knowledge Check's flexible option count.
export const addFinalQuizQuestionValidation = [
  body('question').trim().isLength({ min: 2, max: 1000 }).withMessage('Question text is required.'),
  body('options').isArray({ min: 4, max: 4 }).withMessage('A final quiz question must have exactly 4 options.'),
  body('options.*').isString().trim().notEmpty().withMessage('Each option must be a non-empty string.'),
  body('correctAnswer').isString().trim().notEmpty().withMessage('correctAnswer is required.'),
  body('points').isInt({ min: 1, max: 1000 }).withMessage('points must be a positive integer.').toInt(),
  body('explanation').optional({ nullable: true }).trim().isLength({ max: 1000 }),
];

export const updateFinalQuizQuestionValidation = [
  body('question').optional().trim().isLength({ min: 2, max: 1000 }),
  body('options').optional().isArray({ min: 4, max: 4 }).withMessage('A final quiz question must have exactly 4 options.'),
  body('options.*').optional().isString().trim().notEmpty(),
  body('correctAnswer').optional().isString().trim().notEmpty(),
  body('points').optional().isInt({ min: 1, max: 1000 }).toInt(),
  body('explanation').optional({ nullable: true }).trim().isLength({ max: 1000 }),
];

export const reorderFinalQuizQuestionsValidation = [
  body('questionIds').isArray({ min: 1 }).withMessage('questionIds must be a non-empty array.'),
  body('questionIds.*').isString().trim().notEmpty().withMessage('Each question ID must be a non-empty string.'),
];
