import { randomUUID } from 'crypto';
import { CourseContentModel, FinalQuizSubdoc, FinalQuizQuestionSubdoc } from './courseContent.model';
import { UpdateFinalQuizConfigInput, FinalQuizQuestionInput } from './finalQuiz.types';

const DEFAULT_FINAL_QUIZ = {
  quizName: '',
  xpReward: 0,
  totalQuestions: 0,
  passingScore: 80,
  maxAttempts: 3,
  retryPolicy: { allowRetry: true, hideCorrectAnswer: true, scoreDecayPercent: 10 },
  questions: [],
};

export async function getFinalQuiz(courseId: string): Promise<FinalQuizSubdoc | null> {
  const doc = await CourseContentModel.findOne({ courseId }).exec();
  return doc?.finalQuiz ?? null;
}

export async function updateFinalQuizConfig(
  courseId: string,
  input: UpdateFinalQuizConfigInput,
): Promise<FinalQuizSubdoc> {
  const doc = await CourseContentModel.findOne({ courseId }).exec();
  if (!doc) throw new Error('Course content not found.');

  if (!doc.finalQuiz) {
    doc.finalQuiz = DEFAULT_FINAL_QUIZ as unknown as FinalQuizSubdoc;
  }

  if (input.quizName !== undefined) doc.finalQuiz.quizName = input.quizName;
  if (input.xpReward !== undefined) doc.finalQuiz.xpReward = input.xpReward;
  if (input.totalQuestions !== undefined) doc.finalQuiz.totalQuestions = input.totalQuestions;
  if (input.passingScore !== undefined) doc.finalQuiz.passingScore = input.passingScore;
  if (input.maxAttempts !== undefined) doc.finalQuiz.maxAttempts = input.maxAttempts;
  if (input.retryPolicy?.allowRetry !== undefined) doc.finalQuiz.retryPolicy.allowRetry = input.retryPolicy.allowRetry;
  if (input.retryPolicy?.hideCorrectAnswer !== undefined) {
    doc.finalQuiz.retryPolicy.hideCorrectAnswer = input.retryPolicy.hideCorrectAnswer;
  }
  if (input.retryPolicy?.scoreDecayPercent !== undefined) {
    doc.finalQuiz.retryPolicy.scoreDecayPercent = input.retryPolicy.scoreDecayPercent;
  }

  doc.contentVersion += 1;
  await doc.save();
  return doc.finalQuiz;
}

export async function addFinalQuizQuestion(
  courseId: string,
  input: FinalQuizQuestionInput,
): Promise<FinalQuizQuestionSubdoc[]> {
  const doc = await CourseContentModel.findOne({ courseId }).exec();
  if (!doc) throw new Error('Course content not found.');
  if (!doc.finalQuiz) {
    doc.finalQuiz = DEFAULT_FINAL_QUIZ as unknown as FinalQuizSubdoc;
  }

  const sortOrder = doc.finalQuiz.questions.length + 1;
  doc.finalQuiz.questions.push({
    id: randomUUID(),
    question: input.question,
    options: input.options,
    correctAnswer: input.correctAnswer,
    points: input.points,
    explanation: input.explanation,
    sortOrder,
  });

  doc.contentVersion += 1;
  await doc.save();
  return doc.finalQuiz.questions.map((q) => q.toObject());
}

export async function updateFinalQuizQuestion(
  courseId: string,
  questionId: string,
  patch: Partial<FinalQuizQuestionInput>,
): Promise<FinalQuizQuestionSubdoc[]> {
  const doc = await CourseContentModel.findOne({ courseId }).exec();
  if (!doc?.finalQuiz) throw new Error('Final quiz not found.');

  const question = doc.finalQuiz.questions.find((q) => q.id === questionId);
  if (!question) throw new Error('Question not found.');

  if (patch.question !== undefined) question.question = patch.question;
  if (patch.options !== undefined) question.options = patch.options;
  if (patch.correctAnswer !== undefined) question.correctAnswer = patch.correctAnswer;
  if (patch.points !== undefined) question.points = patch.points;
  if (patch.explanation !== undefined) question.explanation = patch.explanation;

  doc.contentVersion += 1;
  await doc.save();
  return doc.finalQuiz.questions.map((q) => q.toObject());
}

export async function deleteFinalQuizQuestion(
  courseId: string,
  questionId: string,
): Promise<FinalQuizQuestionSubdoc[]> {
  const doc = await CourseContentModel.findOne({ courseId }).exec();
  if (!doc?.finalQuiz) throw new Error('Final quiz not found.');

  const exists = doc.finalQuiz.questions.some((q) => q.id === questionId);
  if (!exists) throw new Error('Question not found.');

  const remaining = doc.finalQuiz.questions
    .filter((q) => q.id !== questionId)
    .map((q) => q.toObject())
    .map((q, index) => ({ ...q, sortOrder: index + 1 }));

  doc.finalQuiz.questions = remaining as unknown as typeof doc.finalQuiz.questions;
  doc.contentVersion += 1;
  await doc.save();
  return doc.finalQuiz.questions.map((q) => q.toObject());
}

export async function reorderFinalQuizQuestions(
  courseId: string,
  questionIds: string[],
): Promise<FinalQuizQuestionSubdoc[]> {
  const doc = await CourseContentModel.findOne({ courseId }).exec();
  if (!doc?.finalQuiz) throw new Error('Final quiz not found.');

  if (new Set(questionIds).size !== questionIds.length) {
    throw new Error('questionIds contains duplicate entries.');
  }

  const existingIds = new Set(doc.finalQuiz.questions.map((q) => q.id));
  const requestedIds = new Set(questionIds);
  const sameSet =
    existingIds.size === requestedIds.size && [...existingIds].every((id) => requestedIds.has(id));
  if (!sameSet) {
    throw new Error("questionIds must match the quiz's existing question set exactly.");
  }

  const byId = new Map(doc.finalQuiz.questions.map((q) => [q.id, q.toObject()]));
  const reordered = questionIds.map((id, index) => ({ ...byId.get(id)!, sortOrder: index + 1 }));

  // Reordering isn't a content edit — contentVersion is intentionally NOT bumped.
  doc.finalQuiz.questions = reordered as unknown as typeof doc.finalQuiz.questions;
  await doc.save();
  return doc.finalQuiz.questions.map((q) => q.toObject());
}
