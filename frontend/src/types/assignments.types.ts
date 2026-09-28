export type AssignmentStatus = 'assigned' | 'in_progress' | 'completed' | 'overdue';

export interface Assignment {
  id: string;
  courseId: string;
  courseName: string;
  assignedTo: string;
  assignedToName: string;
  assignedBy: string;
  dueDate: string;
  status: AssignmentStatus;
  assignedAt: string;
  completedAt: string | null;
  /** Null when the course has no final quiz. */
  finalQuiz: {
    status: 'locked' | 'available' | 'passed' | 'failed';
    attemptsUsed: number;
    allowedAttempts: number;
    bestScorePercent: number | null;
  } | null;
}

export interface CreateAssignmentInput {
  courseId: string;
  userId: string;
  dueDate: string;
}

export interface AssignmentFilters {
  courseId?: string;
  userId?: string;
  status?: AssignmentStatus;
}

export interface AssignableCourse {
  courseId: string;
  name: string;
  difficulty: string;
  estimatedDuration: number;
  totalXpReward: number;
  lessonCount: number;
}
