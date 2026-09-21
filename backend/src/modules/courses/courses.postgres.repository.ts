import { getPool } from '../../database/postgres';
import { CourseRecord, CreateCourseInput, UpdateCourseInput, CourseCounts, CourseStatus } from './courses.types';

const COURSE_SELECT = `
  SELECT id, created_by, learning_path, name, description, difficulty,
         estimated_duration, total_xp_reward, status, banner_ref, created_at, updated_at
  FROM courses
`;

export async function insertCourse(createdBy: string, input: CreateCourseInput): Promise<CourseRecord> {
  const { rows } = await getPool().query<CourseRecord>(
    `INSERT INTO courses (
      created_by, learning_path, name, description, difficulty,
      estimated_duration, total_xp_reward, banner_ref, status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'draft')
    RETURNING id, created_by, learning_path, name, description, difficulty,
              estimated_duration, total_xp_reward, status, banner_ref, created_at, updated_at`,
    [
      createdBy,
      input.learningPath,
      input.name,
      input.description ?? null,
      input.difficulty,
      input.estimatedDuration,
      input.totalXpReward,
      input.bannerRef ?? null,
    ],
  );
  return rows[0];
}

export async function findCourseById(id: string): Promise<CourseRecord | null> {
  const { rows } = await getPool().query<CourseRecord>(`${COURSE_SELECT} WHERE id = $1`, [id]);
  return rows[0] ?? null;
}

export async function findCoursesByCreator(createdBy: string): Promise<CourseRecord[]> {
  const { rows } = await getPool().query<CourseRecord>(
    `${COURSE_SELECT} WHERE created_by = $1 ORDER BY created_at DESC`,
    [createdBy],
  );
  return rows;
}

/** Read-only cross-module helper for the learner side (any creator, any status the caller already filtered for). */
export async function findCoursesByIds(ids: string[]): Promise<CourseRecord[]> {
  if (ids.length === 0) return [];
  const { rows } = await getPool().query<CourseRecord>(`${COURSE_SELECT} WHERE id = ANY($1)`, [ids]);
  return rows;
}

/** Read-only cross-module helper for HR: every published course, any creator, for the Assign Course picker. */
export async function findPublishedCourses(): Promise<CourseRecord[]> {
  const { rows } = await getPool().query<CourseRecord>(
    `${COURSE_SELECT} WHERE status = 'published' ORDER BY name ASC`,
  );
  return rows;
}

export async function updateCourse(id: string, data: UpdateCourseInput): Promise<void> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (data.name !== undefined) {
    fields.push(`name = $${idx++}`);
    values.push(data.name);
  }
  if (data.learningPath !== undefined) {
    fields.push(`learning_path = $${idx++}`);
    values.push(data.learningPath);
  }
  if (data.description !== undefined) {
    fields.push(`description = $${idx++}`);
    values.push(data.description);
  }
  if (data.difficulty !== undefined) {
    fields.push(`difficulty = $${idx++}`);
    values.push(data.difficulty);
  }
  if (data.estimatedDuration !== undefined) {
    fields.push(`estimated_duration = $${idx++}`);
    values.push(data.estimatedDuration);
  }
  if (data.totalXpReward !== undefined) {
    fields.push(`total_xp_reward = $${idx++}`);
    values.push(data.totalXpReward);
  }
  if (data.bannerRef !== undefined) {
    fields.push(`banner_ref = $${idx++}`);
    values.push(data.bannerRef);
  }

  if (fields.length === 0) return;

  values.push(id);
  await getPool().query(`UPDATE courses SET ${fields.join(', ')} WHERE id = $${idx}`, values);
}

export async function setCourseStatus(id: string, status: CourseStatus): Promise<void> {
  await getPool().query('UPDATE courses SET status = $1 WHERE id = $2', [status, id]);
}

/**
 * Hard delete — used ONLY as the compensating action when the paired MongoDB
 * course_content document fails to create right after this row is inserted.
 * Never exposed via the API; the public "delete" endpoint archives instead.
 */
export async function deleteCourseHard(id: string): Promise<void> {
  await getPool().query('DELETE FROM courses WHERE id = $1', [id]);
}

export async function getCourseCounts(createdBy: string): Promise<CourseCounts> {
  const { rows } = await getPool().query<{ status: CourseStatus; count: number }>(
    'SELECT status, COUNT(*)::int AS count FROM courses WHERE created_by = $1 GROUP BY status',
    [createdBy],
  );

  const counts: CourseCounts = { total: 0, draft: 0, published: 0, archived: 0 };
  for (const row of rows) {
    counts.total += row.count;
    counts[row.status] = row.count;
  }
  return counts;
}
