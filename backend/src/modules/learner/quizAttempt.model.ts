import mongoose, { Schema, Document } from 'mongoose';

export interface QuizAttemptAnswer {
  questionId: string;
  selectedAnswer: string;
  correct: boolean;
}

export interface QuizAttemptDocument extends Document {
  userId: string;
  courseId: string;
  lessonId: string | null; // null for a Final Course Quiz attempt
  blockId: string; // or 'FINAL_QUIZ'
  attemptNumber: number;
  answers: QuizAttemptAnswer[];
  totalScore: number;
  maxScore: number;
  passed: boolean;
  attemptedAt: Date;
}

const QuizAttemptAnswerSchema = new Schema<QuizAttemptAnswer>(
  {
    questionId: { type: String, required: true },
    selectedAnswer: { type: String, required: true },
    correct: { type: Boolean, required: true },
  },
  { _id: false },
);

const QuizAttemptSchema = new Schema<QuizAttemptDocument>(
  {
    userId: { type: String, required: true, index: true },
    courseId: { type: String, required: true, index: true },
    lessonId: { type: String, default: null, index: true },
    blockId: { type: String, required: true },
    attemptNumber: { type: Number, required: true },
    answers: { type: [QuizAttemptAnswerSchema], default: [] },
    totalScore: { type: Number, required: true },
    maxScore: { type: Number, required: true },
    passed: { type: Boolean, required: true },
    attemptedAt: { type: Date, default: Date.now },
  },
  { collection: 'quiz_attempts', minimize: false },
);

export const QuizAttemptModel =
  (mongoose.models.QuizAttempt as mongoose.Model<QuizAttemptDocument>) ||
  mongoose.model<QuizAttemptDocument>('QuizAttempt', QuizAttemptSchema);
