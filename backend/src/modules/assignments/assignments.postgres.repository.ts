import { getPool } from '../../database/postgres';
import { AssignmentRecord, AssignmentStatus, AssignmentFilters, CreateAssignmentInput } from './assignments.types';

const ASSIGNMENT_SELECT = `
  SELECT id, course_id, assigned_to, assigned_by, due_date::text AS due_date, status,
         assigned_at, completed_at, created_at, updated_at
  FROM course_assignments
`;

export async function insertAssignment(
  assignedBy: string,
  input: CreateAssignmentInput,
): Promise<AssignmentRecord> {
  const { rows } = await getPool().query<AssignmentRecord>(
    `INSERT INTO course_assignments (course_id, assigned_to, assigned_by, due_date)
     VALUES ($1, $2, $3, $4)
     RETURNING id, course_id, assigned_to, assigned_by, due_date::text AS due_date, status,
               assigned_at, completed_at, created_at, updated_at`,
    [input.courseId, input.userId, assignedBy, input.dueDate],
  );
  return rows[0];
}

export async function findAssignmentById(id: string): Promise<AssignmentRecord | null> {
  const { rows } = await getPool().query<AssignmentRecord>(`${ASSIGNMENT_SELECT} WHERE id = $1`, [id]);
  return rows[0] ?? null;
}

export async function listAssignments(filters: AssignmentFilters): Promise<AssignmentRecord[]> {
  const conditions: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (filters.courseId) {
    conditions.push(`course_id = $${idx++}`);
    values.push(filters.courseId);
  }
  if (filters.userId) {
    conditions.push(`assigned_to = $${idx++}`);
    values.push(filters.userId);
  }
  if (filters.status) {
    conditions.push(`status = $${idx++}`);
    values.push(filters.status);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const { rows } = await getPool().query<AssignmentRecord>(
    `${ASSIGNMENT_SELECT} ${whereClause} ORDER BY assigned_at DESC`,
    values,
  );
  return rows;
}

/** Assignments a given learner currently holds for a specific course (any status). */
export async function findAssignmentsForLearnerAndCourse(
  userId: string,
  courseId: string,
): Promise<AssignmentRecord[]> {
  const { rows } = await getPool().query<AssignmentRecord>(
    `${ASSIGNMENT_SELECT} WHERE assigned_to = $1 AND course_id = $2 ORDER BY assigned_at DESC`,
    [userId, courseId],
  );
  return rows;
}

export async function setAssignmentStatus(
  id: string,
  status: AssignmentStatus,
  completedAt?: Date,
): Promise<void> {
  await getPool().query(
    'UPDATE course_assignments SET status = $1, completed_at = COALESCE($2, completed_at) WHERE id = $3',
    [status, completedAt ?? null, id],
  );
}

export async function deleteAssignment(id: string): Promise<void> {
  await getPool().query('DELETE FROM course_assignments WHERE id = $1', [id]);
}

/** Distinct course_ids a learner has ANY assignment for — the visibility gate. */
export async function findAssignedCourseIdsForLearner(userId: string): Promise<string[]> {
  const { rows } = await getPool().query<{ course_id: string }>(
    'SELECT DISTINCT course_id FROM course_assignments WHERE assigned_to = $1',
    [userId],
  );
  return rows.map((r) => r.course_id);
}
