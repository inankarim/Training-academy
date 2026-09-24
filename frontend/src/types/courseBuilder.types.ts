export type CourseDifficulty = 'beginner' | 'intermediate' | 'advanced';
export type CourseStatus = 'draft' | 'published' | 'archived';
export type LessonStatus = 'draft' | 'ready' | 'published';

export interface Course {
  courseId: string;
  name: string;
  description: string | null;
  difficulty: CourseDifficulty;
  estimatedDuration: number;
  totalXpReward: number;
  status: CourseStatus;
  bannerRef: string | null;
  lessonCount: number;
  quizCount: number;
  setupProgress: number;
  createdAt: string;
  updatedAt: string;
}

export interface CourseCounts {
  total: number;
  draft: number;
  published: number;
  archived: number;
}

export interface CreateCourseInput {
  name: string;
  description?: string;
  difficulty: CourseDifficulty;
  estimatedDuration: number;
  totalXpReward: number;
  bannerRef?: string | null;
}

export type UpdateCourseInput = Partial<CreateCourseInput>;

export interface CourseModule {
  moduleId: string;
  courseId: string;
  title: string;
  sortOrder: number;
  lessonCount: number;
  createdAt: string;
  updatedAt: string;
  lessons?: LessonSummary[];
}

export interface LessonSummary {
  lessonId: string;
  courseId: string;
  moduleId: string;
  title: string;
  description: string | null;
  sortOrder: number;
  status: LessonStatus;
  blockCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface LessonDetail extends LessonSummary {
  blocks: LessonBlock[];
  contentVersion: number;
}

export type BlockCategory = 'MEDIA' | 'CONTENT' | 'ASSESSMENT' | 'LESSON_FLOW';

export interface BlockTypeMeta {
  type: string;
  category: BlockCategory;
  label: string;
}

export interface LessonBlock {
  id: string;
  type: string;
  sortOrder: number;
  content: Record<string, unknown>;
  style: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// --- Block content shapes (frontend-side convenience, backend stores these as Mixed) ---

export interface HeroBannerContent {
  bannerImage?: { url?: string };
  moduleTitle?: string;
  lessonTitle?: string;
}

export interface VideoContent {
  sourceType?: 'UPLOAD' | 'URL';
  videoUrl?: string;
  thumbnailUrl?: string;
  transcript?: string;
  duration?: string;
}

export interface ImagesContent {
  images?: { url: string; caption?: string }[];
}

export interface BannerImageContent {
  imageUrl?: string;
  caption?: string;
}

export interface PdfContent {
  fileName?: string;
  fileUrl?: string;
  mimeType?: string;
  size?: number;
}

export interface RichTextContent {
  html?: string;
}

export interface CalloutContent {
  title?: string;
  message?: string;
  type?: 'info' | 'warning' | 'important';
}

export interface ImageTextContent {
  image?: { url?: string };
  title?: string;
  description?: string;
  imagePosition?: 'left' | 'right';
}

export interface KnowledgeCheckQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  points: number;
  explanation?: string;
}

export interface KnowledgeCheckContent {
  questions?: KnowledgeCheckQuestion[];
}

export interface NextLessonContent {
  nextLessonId?: string;
  unlockCondition?: string;
  label?: string;
}

// --- Final Course Quiz ---

export interface FinalQuizRetryPolicy {
  allowRetry: boolean;
  hideCorrectAnswer: boolean;
  scoreDecayPercent: number;
}

export interface FinalQuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  points: number;
  explanation?: string;
  sortOrder: number;
}

export interface FinalQuiz {
  quizName: string;
  xpReward: number;
  totalQuestions: number;
  passingScore: number;
  maxAttempts: number;
  retryPolicy: FinalQuizRetryPolicy;
  questions: FinalQuizQuestion[];
}

export interface UpdateFinalQuizConfigInput {
  quizName?: string;
  xpReward?: number;
  totalQuestions?: number;
  passingScore?: number;
  maxAttempts?: number;
  retryPolicy?: Partial<FinalQuizRetryPolicy>;
}

export interface FinalQuizQuestionInput {
  question: string;
  options: string[];
  correctAnswer: string;
  points: number;
  explanation?: string;
}
