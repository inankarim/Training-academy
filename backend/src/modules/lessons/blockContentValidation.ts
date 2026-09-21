import { AppError } from '../../middleware/errorHandler';

interface QuestionShapeOptions {
  requireExactOptionCount?: number;
  minOptionCount?: number;
}

function validateQuestionShape(q: unknown, index: number, blockLabel: string, opts: QuestionShapeOptions): void {
  if (typeof q !== 'object' || q === null) {
    throw new AppError(`${blockLabel} question ${index + 1} must be an object.`, 400);
  }
  const question = q as Record<string, unknown>;

  if (typeof question.question !== 'string' || question.question.trim().length === 0) {
    throw new AppError(`${blockLabel} question ${index + 1} is missing its question text.`, 400);
  }

  const options = question.options;
  if (!Array.isArray(options) || options.some((o) => typeof o !== 'string' || o.trim().length === 0)) {
    throw new AppError(`${blockLabel} question ${index + 1} must have non-empty string options.`, 400);
  }
  if (opts.requireExactOptionCount !== undefined && options.length !== opts.requireExactOptionCount) {
    throw new AppError(
      `${blockLabel} question ${index + 1} must have exactly ${opts.requireExactOptionCount} options.`,
      400,
    );
  }
  if (opts.minOptionCount !== undefined && options.length < opts.minOptionCount) {
    throw new AppError(`${blockLabel} question ${index + 1} must have at least ${opts.minOptionCount} options.`, 400);
  }

  if (typeof question.correctAnswer !== 'string' || !options.includes(question.correctAnswer)) {
    throw new AppError(`${blockLabel} question ${index + 1}'s correctAnswer must match one of its options.`, 400);
  }

  if (typeof question.points !== 'number' || question.points <= 0) {
    throw new AppError(`${blockLabel} question ${index + 1} must have a positive points value.`, 400);
  }
}

/**
 * Business-rule shape validation for block content, beyond "content is an
 * object" (already checked by express-validator). Called from both addBlock
 * and updateBlock in the service layer — PATCH requests don't carry `type`,
 * so the caller resolves it from the persisted block first.
 *
 * A block that hasn't been filled in yet (no `questions` key, or an empty
 * array) is always valid — blocks must stay saveable as an incomplete draft.
 * The moment questions are present, the type's rule applies in full.
 */
export function validateBlockContent(type: string, content: Record<string, unknown> | undefined): void {
  if (!content) return;

  if (type === 'KNOWLEDGE_CHECK') {
    const questions = content.questions;
    if (questions === undefined) return;
    if (!Array.isArray(questions) || questions.length === 0) return;

    if (questions.length !== 3) {
      throw new AppError('A Knowledge Check must have exactly 3 questions — no more, no fewer.', 400);
    }
    questions.forEach((q, i) => validateQuestionShape(q, i, 'Knowledge Check', { minOptionCount: 2 }));
    return;
  }

  if (type === 'QUIZ') {
    const questions = content.questions;
    if (questions === undefined || !Array.isArray(questions)) return;
    questions.forEach((q, i) => validateQuestionShape(q, i, 'Quiz', { minOptionCount: 2 }));
  }
}
