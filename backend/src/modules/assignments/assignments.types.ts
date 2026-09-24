export type AssignmentStatus = 'assigned' | 'in_progress' | 'completed' | 'overdue';

export interface AssignmentRecord {
  id: string;
  course_id: string;
  assigned_to: string;
  assigned_by: string;
  due_date: string;
  status: AssignmentStatus;
  assigned_at: Date;
  completed_at: Date | null;
  overdue_notified_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface AssignmentDTO {
  id: string;
  courseId: string;
  courseName: string;
  assignedTo: string;
  assignedToName: string;
  assignedBy: string;
  dueDate: string;
  status: AssignmentStatus;
  assignedAt: Date;
  completedAt: Date | null;
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

export interface RequesterContext {
  id: string;
  role: string;
}

export interface AssignableCourseDTO {
  courseId: string;
  name: string;
  difficulty: string;
  estimatedDuration: number;
  totalXpReward: number;
  lessonCount: number;
}
