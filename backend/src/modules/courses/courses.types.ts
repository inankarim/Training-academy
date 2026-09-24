export type CourseDifficulty = 'beginner' | 'intermediate' | 'advanced';
export type CourseStatus = 'draft' | 'published' | 'archived';

export interface CourseRecord {
  id: string;
  created_by: string;
  name: string;
  description: string | null;
  difficulty: CourseDifficulty;
  estimated_duration: string | number; // numeric columns come back as strings from pg
  total_xp_reward: number;
  status: CourseStatus;
  banner_ref: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateCourseInput {
  name: string;
  description?: string | null;
  difficulty: CourseDifficulty;
  estimatedDuration: number;
  totalXpReward: number;
  bannerRef?: string | null;
}

export interface UpdateCourseInput {
  name?: string;
  description?: string | null;
  difficulty?: CourseDifficulty;
  estimatedDuration?: number;
  totalXpReward?: number;
  bannerRef?: string | null;
}

export interface CourseCounts {
  total: number;
  draft: number;
  published: number;
  archived: number;
}

export interface CourseDTO {
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
  createdAt: Date;
  updatedAt: Date;
}

export interface RequesterContext {
  id: string;
  role: string;
}
