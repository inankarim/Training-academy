import { getPool } from '../../database/postgres';
import { LessonRecord, CreateLessonInput, UpdateLessonInput, LessonStatus } from './lessons.types';

const LESSON_SELECT = `
  SELECT id, course_id, module_id, title, description, sort_order, status, created_by, created_at, updated_at
  FROM lessons
`;

export async function insertLesson(
  courseId: string,
  moduleId: string,
  createdBy: string,
  input: CreateLessonInput,
  sortOrder: number,
): Promise<LessonRecord> {
  const { rows } = await getPool().query<LessonRecord>(
    `INSERT INTO lessons (course_id, module_id, title, description, sort_order, created_by, status)
     VALUES ($1, $2, $3, $4, $5, $6, 'draft')
     RETURNING id, course_id, module_id, title, description, sort_order, status, created_by, created_at, updated_at`,
    [courseId, moduleId, input.title, input.description ?? null, sortOrder, createdBy],
  );
  return rows[0];
}

export async function findLessonById(id: string): Promise<LessonRecord | null> {
  const { rows } = await getPool().query<LessonRecord>(`${LESSON_SELECT} WHERE id = $1`, [id]);
  return rows[0] ?? null;
}

export async function findLessonsByModule(moduleId: string): Promise<LessonRecord[]> {
  const { rows } = await getPool().query<LessonRecord>(
    `${LESSON_SELECT} WHERE module_id = $1 ORDER BY sort_order ASC`,
    [moduleId],
  );
  return rows;
}

/** Read-only cross-module helper for the learner side — all lessons across all of a course's modules. */
export async function findLessonsByCourse(courseId: string): Promise<LessonRecord[]> {
  const { rows } = await getPool().query<LessonRecord>(
    `${LESSON_SELECT} WHERE course_id = $1 ORDER BY sort_order ASC`,
    [courseId],
  );
  return rows;
}

/** Learner-visible lessons only — draft lessons stay hidden until the content creator publishes them. */
export async function findPublishedLessonsByCourse(courseId: string): Promise<LessonRecord[]> {
  const { rows } = await getPool().query<LessonRecord>(
    `${LESSON_SELECT} WHERE course_id = $1 AND status = 'published' ORDER BY sort_order ASC`,
    [courseId],
  );
  return rows;
}

export async function getNextLessonSortOrder(moduleId: string): Promise<number> {
  const { rows } = await getPool().query<{ max: number | null }>(
    'SELECT MAX(sort_order) AS max FROM lessons WHERE module_id = $1',
    [moduleId],
  );
  return (rows[0]?.max ?? 0) + 1;
}

export async function updateLesson(id: string, data: UpdateLessonInput): Promise<void> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (data.title !== undefined) {
    fields.push(`title = $${idx++}`);
    values.push(data.title);
  }
  if (data.description !== undefined) {
    fields.push(`description = $${idx++}`);
    values.push(data.description);
  }
  if (data.status !== undefined) {
    fields.push(`status = $${idx++}`);
    values.push(data.status);
  }

  if (fields.length === 0) return;

  values.push(id);
  await getPool().query(`UPDATE lessons SET ${fields.join(', ')} WHERE id = $${idx}`, values);
}

export async function setLessonSortOrder(id: string, sortOrder: number): Promise<void> {
  await getPool().query('UPDATE lessons SET sort_order = $1 WHERE id = $2', [sortOrder, id]);
}

/**
 * Hard delete — the Course Lessons screen shows a trash icon per lesson
 * (unlike Course Builder's archive-only delete), and Stage 2's spec asks for
 * an actual "Delete Lesson" CRUD verb, so this removes the row for real.
 */
export async function deleteLessonHard(id: string): Promise<void> {
  await getPool().query('DELETE FROM lessons WHERE id = $1', [id]);
}

export async function countLessonsForCourse(courseId: string): Promise<number> {
  const { rows } = await getPool().query<{ count: number }>(
    'SELECT COUNT(*)::int AS count FROM lessons WHERE course_id = $1',
    [courseId],
  );
  return rows[0]?.count ?? 0;
}

export type { LessonStatus };
