import { getPool } from '../../database/postgres';
import { CourseModuleRecord, CreateModuleInput, UpdateModuleInput } from './lessons.types';

const MODULE_SELECT = `
  SELECT id, course_id, title, sort_order, created_by, created_at, updated_at
  FROM modules
`;

export async function insertModule(
  courseId: string,
  createdBy: string,
  input: CreateModuleInput,
  sortOrder: number,
): Promise<CourseModuleRecord> {
  const { rows } = await getPool().query<CourseModuleRecord>(
    `INSERT INTO modules (course_id, title, sort_order, created_by)
     VALUES ($1, $2, $3, $4)
     RETURNING id, course_id, title, sort_order, created_by, created_at, updated_at`,
    [courseId, input.title, sortOrder, createdBy],
  );
  return rows[0];
}

export async function findModuleById(id: string): Promise<CourseModuleRecord | null> {
  const { rows } = await getPool().query<CourseModuleRecord>(`${MODULE_SELECT} WHERE id = $1`, [id]);
  return rows[0] ?? null;
}

export async function findModulesByCourse(courseId: string): Promise<CourseModuleRecord[]> {
  const { rows } = await getPool().query<CourseModuleRecord>(
    `${MODULE_SELECT} WHERE course_id = $1 ORDER BY sort_order ASC`,
    [courseId],
  );
  return rows;
}

export async function getNextModuleSortOrder(courseId: string): Promise<number> {
  const { rows } = await getPool().query<{ max: number | null }>(
    'SELECT MAX(sort_order) AS max FROM modules WHERE course_id = $1',
    [courseId],
  );
  return (rows[0]?.max ?? 0) + 1;
}

export async function updateModule(id: string, data: UpdateModuleInput): Promise<void> {
  if (data.title === undefined) return;
  await getPool().query('UPDATE modules SET title = $1 WHERE id = $2', [data.title, id]);
}

export async function setModuleSortOrder(id: string, sortOrder: number): Promise<void> {
  await getPool().query('UPDATE modules SET sort_order = $1 WHERE id = $2', [sortOrder, id]);
}

/** Only safe to call once the caller has confirmed the module has zero lessons. */
export async function deleteModule(id: string): Promise<void> {
  await getPool().query('DELETE FROM modules WHERE id = $1', [id]);
}

export async function countLessonsForModule(moduleId: string): Promise<number> {
  const { rows } = await getPool().query<{ count: number }>(
    'SELECT COUNT(*)::int AS count FROM lessons WHERE module_id = $1',
    [moduleId],
  );
  return rows[0]?.count ?? 0;
}
