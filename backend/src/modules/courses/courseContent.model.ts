import mongoose, { Schema, Document, Types } from 'mongoose';

// Lesson identity/structure now lives in Postgres (modules/lessons tables —
// see backend/src/modules/lessons/). This doc only holds what's still
// genuinely course-level flexible content: the banner and the Final Course
// Quiz. Stage 1 briefly kept placeholder `modules[]`/`lessons[]` fields here
// before real Postgres lessons existed; removed as part of Stage 2.
export interface FinalQuizQuestionSubdoc {
  id: string;
  question: string;
  options: string[]; // exactly 4 — enforced in finalQuiz.validation.ts / service, not at the schema level
  correctAnswer: string;
  points: number;
  explanation?: string;
  sortOrder: number;
}

export interface FinalQuizRetryPolicy {
  allowRetry: boolean;
  hideCorrectAnswer: boolean;
  scoreDecayPercent: number;
}

export interface FinalQuizSubdoc {
  quizName: string;
  xpReward: number;
  totalQuestions: number; // target/displayed count set by the content creator, independent of questions.length
  passingScore: number; // percentage, 0-100
  maxAttempts: number;
  retryPolicy: FinalQuizRetryPolicy;
  questions: Types.DocumentArray<FinalQuizQuestionSubdoc>;
}

export interface CourseContentDocument extends Document {
  courseId: string; // = the owning Postgres courses.id — the canonical identity, never generated here
  banner: Record<string, unknown>;
  finalQuiz: FinalQuizSubdoc | null;
  contentVersion: number;
  createdAt: Date;
  updatedAt: Date;
}

const FinalQuizQuestionSchema = new Schema<FinalQuizQuestionSubdoc>(
  {
    id: { type: String, required: true },
    question: { type: String, required: true },
    options: { type: [String], required: true },
    correctAnswer: { type: String, required: true },
    points: { type: Number, required: true },
    explanation: { type: String },
    sortOrder: { type: Number, required: true },
  },
  { _id: false, minimize: false },
);

const FinalQuizSchema = new Schema<FinalQuizSubdoc>(
  {
    quizName: { type: String, default: '' },
    xpReward: { type: Number, default: 0 },
    totalQuestions: { type: Number, default: 0 },
    passingScore: { type: Number, default: 80 },
    maxAttempts: { type: Number, default: 3 },
    retryPolicy: {
      allowRetry: { type: Boolean, default: true },
      hideCorrectAnswer: { type: Boolean, default: true },
      scoreDecayPercent: { type: Number, default: 10 },
    },
    questions: { type: [FinalQuizQuestionSchema], default: [] },
  },
  { _id: false, minimize: false },
);

const CourseContentSchema = new Schema<CourseContentDocument>(
  {
    courseId: { type: String, required: true, unique: true, index: true },
    banner: { type: Schema.Types.Mixed, default: {} },
    finalQuiz: { type: FinalQuizSchema, default: null },
    contentVersion: { type: Number, default: 1 },
  },
  // minimize: false — otherwise Mongoose strips the empty `banner: {}`
  // default entirely before saving, and the document silently ends up
  // without a `banner` key at all until one is actually set.
  { timestamps: true, collection: 'course_content', minimize: false },
);

// Guards against OverwriteModelError when ts-node-dev hot-reloads this module.
export const CourseContentModel =
  (mongoose.models.CourseContent as mongoose.Model<CourseContentDocument>) ||
  mongoose.model<CourseContentDocument>('CourseContent', CourseContentSchema);
