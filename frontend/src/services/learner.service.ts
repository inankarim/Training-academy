import { apiClient } from './apiClient';
import { ApiResponse } from '../types/auth.types';
import {
  LearningPathSummary,
  LearnerCourseSummary,
  LearnerCourseDetail,
  LearnerLessonDetail,
  BlockAttemptInput,
  BlockAttemptResult,
  LearnerDashboard,
} from '../types/learner.types';

const BASE = '/learner';

function unwrap<T>(data: ApiResponse<T>, fallback: string): T {
  if (!data.success || !data.data) {
    throw new Error(data.error?.message || fallback);
  }
  return data.data;
}

export async function getLearnerDashboardApi(): Promise<LearnerDashboard> {
  const { data } = await apiClient.get<ApiResponse<{ dashboard: LearnerDashboard }>>(`${BASE}/dashboard`);
  return unwrap(data, 'Failed to fetch dashboard').dashboard;
}

export async function listLearningPathsApi(): Promise<LearningPathSummary[]> {
  const { data } = await apiClient.get<ApiResponse<{ learningPaths: LearningPathSummary[] }>>(
    `${BASE}/learning-paths`,
  );
  return unwrap(data, 'Failed to fetch learning paths').learningPaths;
}

export async function listCoursesInPathApi(learningPath: string): Promise<LearnerCourseSummary[]> {
  const { data } = await apiClient.get<ApiResponse<{ courses: LearnerCourseSummary[] }>>(
    `${BASE}/learning-paths/${encodeURIComponent(learningPath)}/courses`,
  );
  return unwrap(data, 'Failed to fetch courses').courses;
}

export async function getLearnerCourseApi(courseId: string): Promise<LearnerCourseDetail> {
  const { data } = await apiClient.get<ApiResponse<{ course: LearnerCourseDetail }>>(`${BASE}/courses/${courseId}`);
  return unwrap(data, 'Failed to fetch course').course;
}

export async function getLearnerLessonApi(lessonId: string): Promise<LearnerLessonDetail> {
  const { data } = await apiClient.get<ApiResponse<{ lesson: LearnerLessonDetail }>>(`${BASE}/lessons/${lessonId}`);
  return unwrap(data, 'Failed to fetch lesson').lesson;
}

export async function completeLessonApi(lessonId: string): Promise<void> {
  const { data } = await apiClient.post<ApiResponse<{ message: string }>>(`${BASE}/lessons/${lessonId}/complete`);
  unwrap(data, 'Failed to mark lesson complete');
}

export async function submitBlockAttemptApi(
  lessonId: string,
  blockId: string,
  input: BlockAttemptInput,
): Promise<BlockAttemptResult> {
  const { data } = await apiClient.post<ApiResponse<{ result: BlockAttemptResult }>>(
    `${BASE}/lessons/${lessonId}/blocks/${blockId}/attempt`,
    input,
  );
  return unwrap(data, 'Failed to submit answers').result;
}
