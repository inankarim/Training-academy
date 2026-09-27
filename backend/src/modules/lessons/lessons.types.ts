export type LessonStatus = 'draft' | 'ready' | 'published';

// --- Course Modules (Postgres `modules` table) ---

export interface CourseModuleRecord {
  id: string;
  course_id: string;
  title: string;
  sort_order: number;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

export interface CourseModuleDTO {
  moduleId: string;
  courseId: string;
  title: string;
  sortOrder: number;
  lessonCount: number;
  createdAt: Date;
  updatedAt: Date;
  lessons?: LessonSummaryDTO[];
}

export interface CreateModuleInput {
  title: string;
}

export interface UpdateModuleInput {
  title?: string;
}

// --- Lessons (Postgres `lessons` table) ---

export interface LessonRecord {
  id: string;
  course_id: string;
  module_id: string;
  title: string;
  description: string | null;
  sort_order: number;
  status: LessonStatus;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

export interface LessonSummaryDTO {
  lessonId: string;
  courseId: string;
  moduleId: string;
  title: string;
  description: string | null;
  sortOrder: number;
  status: LessonStatus;
  blockCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface LessonDetailDTO extends LessonSummaryDTO {
  blocks: LessonBlockDTO[];
  contentVersion: number;
  /** Draft content differs from the live version learners see. */
  hasUnpublishedChanges: boolean;
}

export interface CreateLessonInput {
  title: string;
  description?: string | null;
}

export interface UpdateLessonInput {
  title?: string;
  description?: string | null;
  status?: LessonStatus;
}

// --- Content blocks (MongoDB, inside lesson_content.blocks[]) ---

export interface LessonBlockDTO {
  id: string;
  type: string;
  sortOrder: number;
  content: Record<string, unknown>;
  style: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface AddBlockInput {
  type: string;
  position?: number;
  content?: Record<string, unknown>;
  style?: Record<string, unknown>;
}

export interface UpdateBlockInput {
  content?: Record<string, unknown>;
  style?: Record<string, unknown>;
}

export interface RequesterContext {
  id: string;
  role: string;
}
