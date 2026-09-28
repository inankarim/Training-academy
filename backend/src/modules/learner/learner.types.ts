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
  finalQuiz: FinalQuizSummaryDTO | null;
}

/**
 * locked    — lessons not all complete yet
 * available — an attempt is available now
 * passed    — passed; the course is complete
 * failed    — last attempt failed; waiting for HR to grant another
 */
export type FinalQuizStatus = 'locked' | 'available' | 'passed' | 'failed';

export interface FinalQuizSummaryDTO {
  quizName: string;
  status: FinalQuizStatus;
  passingScore: number;
  /** 1 + attempts granted by HR after fails. */
  allowedAttempts: number;
  attemptsUsed: number;
  questionCount: number;
  xpReward: number;
  bestScorePercent: number | null;
}

export interface LearnerFinalQuizDTO extends FinalQuizSummaryDTO {
  courseId: string;
  courseName: string;
  /** Only populated while status is 'available' — never includes correct answers. */
  questions: Array<{ id: string; question: string; options: string[]; points: number }>;
}

export interface FinalQuizAttemptResultDTO {
  passed: boolean;
  scorePercent: number;
  passingScore: number;
  attemptNumber: number;
  xpAwarded: number;
  status: FinalQuizStatus;
  /** correctAnswer is only included when the quiz's retry policy doesn't hide it. */
  perQuestion: Array<{ questionId: string; correct: boolean; correctAnswer?: string }>;
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

export interface LearnerProfileDTO {
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
    /** Live streak: 0 once a day has been missed, even though the stored value isn't reset until next activity. */
    currentStreak: number;
    streakActiveToday: boolean;
  };
  activity: {
    /** Today in the platform's time zone (YYYY-MM-DD) — the heatmap's right edge. */
    today: string;
    /** Days with at least one completed lesson or submitted check/quiz. */
    days: Array<{ date: string; count: number }>;
    totalActiveDays: number;
    longestStreak: number;
  };
  currentFocus: LearnerCourseSummaryDTO[];
  history: Array<{
    assignmentId: string;
    courseId: string;
    courseName: string;
    completedAt: string;
    xpEarned: number;
    finalQuizScore: number | null;
  }>;
}
