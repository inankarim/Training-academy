export type AssignmentStatus = 'assigned' | 'in_progress' | 'completed';

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
