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
  finalQuiz: FinalQuizSummary | null;
}

/** locked: lessons unfinished · available: can attempt · passed: course done · failed: needs HR to grant another attempt */
export type FinalQuizStatus = 'locked' | 'available' | 'passed' | 'failed';

export interface FinalQuizSummary {
  quizName: string;
  status: FinalQuizStatus;
  passingScore: number;
  allowedAttempts: number;
  attemptsUsed: number;
  questionCount: number;
  xpReward: number;
  bestScorePercent: number | null;
}

export interface LearnerFinalQuiz extends FinalQuizSummary {
  courseId: string;
  courseName: string;
  questions: Array<{ id: string; question: string; options: string[]; points: number }>;
}

export interface FinalQuizAttemptResult {
  passed: boolean;
  scorePercent: number;
  passingScore: number;
  attemptNumber: number;
  xpAwarded: number;
  status: FinalQuizStatus;
  perQuestion: Array<{ questionId: string; correct: boolean; correctAnswer?: string }>;
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

export interface LearnerProfile {
  user: {
    id: string;
    fullName: string;
    email: string;
    designation: string | null;
    employeeId: string | null;
    employeeType: string | null;
    salesRole: string | null;
    departmentName: string | null;
    territoryName: string | null;
    avatarUrl: string | null;
  };
  level: {
    level: number;
    levelTitle: string;
    totalXp: number;
    xpIntoLevel: number;
    xpForNextLevel: number;
  };
  stats: {
    coursesAssigned: number;
    coursesCompleted: number;
    lessonsCompleted: number;
    currentStreak: number;
    streakActiveToday: boolean;
  };
  activity: {
    today: string;
    days: Array<{ date: string; count: number }>;
    totalActiveDays: number;
    longestStreak: number;
  };
  currentFocus: LearnerCourseSummary[];
  history: Array<{
    assignmentId: string;
    courseId: string;
    courseName: string;
    completedAt: string;
    xpEarned: number;
    finalQuizScore: number | null;
  }>;
}
