import { apiClient } from './apiClient';
import { ApiResponse } from '../types/auth.types';
import { Assignment, AssignmentFilters, CreateAssignmentInput, AssignableCourse } from '../types/assignments.types';

const BASE = '/hr/assignments';

function unwrap<T>(data: ApiResponse<T>, fallback: string): T {
  if (!data.success || !data.data) {
    throw new Error(data.error?.message || fallback);
  }
  return data.data;
}

export async function listAssignableCoursesApi(): Promise<AssignableCourse[]> {
  const { data } = await apiClient.get<ApiResponse<{ courses: AssignableCourse[] }>>(`${BASE}/courses`);
  return unwrap(data, 'Failed to fetch assignable courses').courses;
}

export async function listAssignmentsApi(filters: AssignmentFilters = {}): Promise<Assignment[]> {
  const { data } = await apiClient.get<ApiResponse<{ assignments: Assignment[] }>>(BASE, { params: filters });
  return unwrap(data, 'Failed to fetch assignments').assignments;
}

export async function createAssignmentApi(input: CreateAssignmentInput): Promise<Assignment> {
  const { data } = await apiClient.post<ApiResponse<{ assignment: Assignment }>>(BASE, input);
  return unwrap(data, 'Failed to create assignment').assignment;
}

export async function deleteAssignmentApi(assignmentId: string): Promise<void> {
  const { data } = await apiClient.delete<ApiResponse<{ message: string }>>(`${BASE}/${assignmentId}`);
  unwrap(data, 'Failed to remove assignment');
}
