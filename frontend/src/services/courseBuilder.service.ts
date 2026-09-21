import { apiClient } from './apiClient';
import { ApiResponse } from '../types/auth.types';
import {
  Course,
  CourseCounts,
  CreateCourseInput,
  UpdateCourseInput,
  CourseModule,
  LessonSummary,
  LessonDetail,
  BlockTypeMeta,
  LessonBlock,
  FinalQuiz,
  UpdateFinalQuizConfigInput,
  FinalQuizQuestionInput,
  FinalQuizQuestion,
} from '../types/courseBuilder.types';

const BASE = '/content-creator';

export interface UploadedMedia {
  fileUrl: string;
  fileName: string;
  mimeType: string;
  size: number;
}

export async function uploadMediaApi(file: File): Promise<UploadedMedia> {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await apiClient.post<ApiResponse<UploadedMedia>>(`${BASE}/uploads/media`, formData);
  return unwrap(data, 'Failed to upload file');
}

function unwrap<T>(data: ApiResponse<T>, fallback: string): T {
  if (!data.success || !data.data) {
    throw new Error(data.error?.message || fallback);
  }
  return data.data;
}

// --- Courses ---

export async function listCoursesApi(): Promise<{ items: Course[]; counts: CourseCounts }> {
  const { data } = await apiClient.get<ApiResponse<{ items: Course[]; counts: CourseCounts }>>(`${BASE}/courses`);
  return unwrap(data, 'Failed to fetch courses');
}

export async function getCourseApi(courseId: string): Promise<Course> {
  const { data } = await apiClient.get<ApiResponse<{ course: Course }>>(`${BASE}/courses/${courseId}`);
  return unwrap(data, 'Failed to fetch course').course;
}

export async function createCourseApi(input: CreateCourseInput): Promise<Course> {
  const { data } = await apiClient.post<ApiResponse<{ course: Course }>>(`${BASE}/courses`, input);
  return unwrap(data, 'Failed to create course').course;
}

export async function updateCourseApi(courseId: string, input: UpdateCourseInput): Promise<Course> {
  const { data } = await apiClient.put<ApiResponse<{ course: Course }>>(`${BASE}/courses/${courseId}`, input);
  return unwrap(data, 'Failed to update course').course;
}

export async function archiveCourseApi(courseId: string): Promise<void> {
  const { data } = await apiClient.delete<ApiResponse<{ message: string }>>(`${BASE}/courses/${courseId}`);
  unwrap(data, 'Failed to archive course');
}

export async function changeCourseStatusApi(courseId: string, status: string): Promise<Course> {
  const { data } = await apiClient.put<ApiResponse<{ course: Course }>>(`${BASE}/courses/${courseId}/status`, {
    status,
  });
  return unwrap(data, 'Failed to change course status').course;
}

// --- Modules ---

export async function listModulesApi(courseId: string): Promise<CourseModule[]> {
  const { data } = await apiClient.get<ApiResponse<{ modules: CourseModule[] }>>(
    `${BASE}/courses/${courseId}/modules`,
  );
  return unwrap(data, 'Failed to fetch modules').modules;
}

export async function reorderModulesApi(courseId: string, moduleIds: string[]): Promise<void> {
  const { data } = await apiClient.put<ApiResponse<{ message: string }>>(
    `${BASE}/courses/${courseId}/modules/reorder`,
    { moduleIds },
  );
  unwrap(data, 'Failed to reorder modules');
}

// --- Lessons ---

export async function createLessonApi(
  courseId: string,
  moduleId: string,
  title: string,
): Promise<LessonSummary> {
  const { data } = await apiClient.post<ApiResponse<{ lesson: LessonSummary }>>(
    `${BASE}/courses/${courseId}/modules/${moduleId}/lessons`,
    { title },
  );
  return unwrap(data, 'Failed to create lesson').lesson;
}

export async function getLessonApi(lessonId: string): Promise<LessonDetail> {
  const { data } = await apiClient.get<ApiResponse<{ lesson: LessonDetail }>>(`${BASE}/lessons/${lessonId}`);
  return unwrap(data, 'Failed to fetch lesson').lesson;
}

export async function updateLessonApi(
  lessonId: string,
  input: { title?: string; description?: string; status?: string },
): Promise<LessonDetail> {
  const { data } = await apiClient.put<ApiResponse<{ lesson: LessonDetail }>>(`${BASE}/lessons/${lessonId}`, input);
  return unwrap(data, 'Failed to update lesson').lesson;
}

export async function deleteLessonApi(lessonId: string): Promise<void> {
  const { data } = await apiClient.delete<ApiResponse<{ message: string }>>(`${BASE}/lessons/${lessonId}`);
  unwrap(data, 'Failed to delete lesson');
}

export async function reorderLessonsApi(
  courseId: string,
  moduleId: string,
  lessonIds: string[],
): Promise<void> {
  const { data } = await apiClient.put<ApiResponse<{ message: string }>>(
    `${BASE}/courses/${courseId}/modules/${moduleId}/lessons/reorder`,
    { lessonIds },
  );
  unwrap(data, 'Failed to reorder lessons');
}

// --- Blocks ---

export async function getBlockTypesApi(): Promise<BlockTypeMeta[]> {
  const { data } = await apiClient.get<ApiResponse<{ blockTypes: BlockTypeMeta[] }>>(
    `${BASE}/lesson-builder/block-types`,
  );
  return unwrap(data, 'Failed to fetch block types').blockTypes;
}

export async function addBlockApi(
  lessonId: string,
  type: string,
  position?: number,
  content?: Record<string, unknown>,
): Promise<LessonBlock[]> {
  const { data } = await apiClient.post<ApiResponse<{ blocks: LessonBlock[] }>>(`${BASE}/lessons/${lessonId}/blocks`, {
    type,
    position,
    content: content ?? {},
  });
  return unwrap(data, 'Failed to add block').blocks;
}

export async function updateBlockApi(
  lessonId: string,
  blockId: string,
  patch: { content?: Record<string, unknown>; style?: Record<string, unknown> },
): Promise<LessonBlock[]> {
  const { data } = await apiClient.patch<ApiResponse<{ blocks: LessonBlock[] }>>(
    `${BASE}/lessons/${lessonId}/blocks/${blockId}`,
    patch,
  );
  return unwrap(data, 'Failed to update block').blocks;
}

export async function deleteBlockApi(lessonId: string, blockId: string): Promise<LessonBlock[]> {
  const { data } = await apiClient.delete<ApiResponse<{ blocks: LessonBlock[] }>>(
    `${BASE}/lessons/${lessonId}/blocks/${blockId}`,
  );
  return unwrap(data, 'Failed to delete block').blocks;
}

export async function reorderBlocksApi(lessonId: string, blockIds: string[]): Promise<LessonBlock[]> {
  const { data } = await apiClient.put<ApiResponse<{ blocks: LessonBlock[] }>>(
    `${BASE}/lessons/${lessonId}/blocks/reorder`,
    { blockIds },
  );
  return unwrap(data, 'Failed to reorder blocks').blocks;
}

// --- Final Course Quiz ---

export async function getFinalQuizApi(courseId: string): Promise<FinalQuiz> {
  const { data } = await apiClient.get<ApiResponse<{ finalQuiz: FinalQuiz }>>(`${BASE}/courses/${courseId}/final-quiz`);
  return unwrap(data, 'Failed to fetch final quiz').finalQuiz;
}

export async function updateFinalQuizConfigApi(
  courseId: string,
  input: UpdateFinalQuizConfigInput,
): Promise<FinalQuiz> {
  const { data } = await apiClient.put<ApiResponse<{ finalQuiz: FinalQuiz }>>(
    `${BASE}/courses/${courseId}/final-quiz`,
    input,
  );
  return unwrap(data, 'Failed to update final quiz').finalQuiz;
}

export async function addFinalQuizQuestionApi(
  courseId: string,
  input: FinalQuizQuestionInput,
): Promise<FinalQuizQuestion[]> {
  const { data } = await apiClient.post<ApiResponse<{ questions: FinalQuizQuestion[] }>>(
    `${BASE}/courses/${courseId}/final-quiz/questions`,
    input,
  );
  return unwrap(data, 'Failed to add question').questions;
}

export async function updateFinalQuizQuestionApi(
  courseId: string,
  questionId: string,
  input: Partial<FinalQuizQuestionInput>,
): Promise<FinalQuizQuestion[]> {
  const { data } = await apiClient.put<ApiResponse<{ questions: FinalQuizQuestion[] }>>(
    `${BASE}/courses/${courseId}/final-quiz/questions/${questionId}`,
    input,
  );
  return unwrap(data, 'Failed to update question').questions;
}

export async function deleteFinalQuizQuestionApi(
  courseId: string,
  questionId: string,
): Promise<FinalQuizQuestion[]> {
  const { data } = await apiClient.delete<ApiResponse<{ questions: FinalQuizQuestion[] }>>(
    `${BASE}/courses/${courseId}/final-quiz/questions/${questionId}`,
  );
  return unwrap(data, 'Failed to delete question').questions;
}

export async function reorderFinalQuizQuestionsApi(
  courseId: string,
  questionIds: string[],
): Promise<FinalQuizQuestion[]> {
  const { data } = await apiClient.put<ApiResponse<{ questions: FinalQuizQuestion[] }>>(
    `${BASE}/courses/${courseId}/final-quiz/questions/reorder`,
    { questionIds },
  );
  return unwrap(data, 'Failed to reorder questions').questions;
}
