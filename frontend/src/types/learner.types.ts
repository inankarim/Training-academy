export interface LearnerCourseSummary {
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

export interface LearnerLessonSummary {
  lessonId: string;
  title: string;
  description: string | null;
  sortOrder: number;
  moduleId: string;
  moduleTitle: string;
  progressStatus: 'not_started' | 'in_progress' | 'completed';
}

export interface LearnerCourseDetail extends LearnerCourseSummary {
  lessons: LearnerLessonSummary[];
}

export interface LearnerBlock {
  id: string;
  type: string;
  sortOrder: number;
  content: Record<string, unknown>;
  style: Record<string, unknown>;
  /** KNOWLEDGE_CHECK/QUIZ only — true once the learner has ever passed this exact block, server-verified. */
  alreadyCompleted?: boolean;
}

export interface LearnerLessonDetail {
  lessonId: string;
  courseId: string;
  title: string;
  description: string | null;
  progressStatus: 'not_started' | 'in_progress' | 'completed';
  blocks: LearnerBlock[];
}

export interface BlockAttemptInput {
  answers: Array<{ questionId: string; selectedAnswer: string }>;
}

export interface BlockAttemptResult {
  passed: boolean;
  score: number;
  maxScore: number;
  attemptNumber: number;
  perQuestion: Array<{ questionId: string; correct: boolean }>;
}

export interface LearnerDashboard {
  totalXp: number;
  level: number;
  levelTitle: string;
  xpIntoLevel: number;
  xpForNextLevel: number;
  currentStreak: number;
  lessonsCompletedCount: number;
  coursesCompletedCount: number;
}
