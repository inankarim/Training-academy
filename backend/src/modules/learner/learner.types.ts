export interface RequesterContext {
  id: string;
  role: string;
}

export interface LearnerCourseSummaryDTO {
  courseId: string;
  name: string;
  description: string | null;
  difficulty: string;
  estimatedDuration: number;
  totalXpReward: number;
  bannerRef: string | null;
  lessonCount: number;
  completedLessonCount: number;
  progress: number; // 0-100
  dueDate: string;
  assignmentStatus: string;
}

export interface LearnerLessonSummaryDTO {
  lessonId: string;
  title: string;
  description: string | null;
  sortOrder: number;
  moduleId: string;
  moduleTitle: string;
  progressStatus: 'not_started' | 'in_progress' | 'completed';
}

export interface LearnerCourseDetailDTO extends LearnerCourseSummaryDTO {
  lessons: LearnerLessonSummaryDTO[];
}

export interface LearnerLessonDetailDTO {
  lessonId: string;
  courseId: string;
  title: string;
  description: string | null;
  progressStatus: 'not_started' | 'in_progress' | 'completed';
  blocks: Array<{
    id: string;
    type: string;
    sortOrder: number;
    content: Record<string, unknown>;
    style: Record<string, unknown>;
    /** KNOWLEDGE_CHECK/QUIZ only — true once the learner has ever passed this exact block, server-verified. */
    alreadyCompleted?: boolean;
  }>;
}

export interface BlockAttemptInput {
  answers: Array<{ questionId: string; selectedAnswer: string }>;
}

export interface BlockAttemptResultDTO {
  passed: boolean;
  score: number;
  maxScore: number;
  attemptNumber: number;
  perQuestion: Array<{ questionId: string; correct: boolean }>;
}

export interface LearnerDashboardDTO {
  totalXp: number;
  level: number;
  levelTitle: string;
  xpIntoLevel: number;
  xpForNextLevel: number;
  currentStreak: number;
  lessonsCompletedCount: number;
  coursesCompletedCount: number;
}
