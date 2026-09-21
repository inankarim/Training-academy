import { getPool } from '../../database/postgres';

export interface LessonProgressRecord {
  id: string;
  assignment_id: string;
  lesson_id: string;
  status: 'not_started' | 'in_progress' | 'completed';
  started_at: Date | null;
  completed_at: Date | null;
}

export interface LearnerStatsRecord {
  user_id: string;
  total_xp: number;
  current_streak: number;
  last_activity_date: string | null;
  lessons_completed_count: number;
  courses_completed_count: number;
}

// --- Assignment lookups specific to the learner's own view ---

export async function findLatestAssignmentForLearnerCourse(userId: string, courseId: string) {
  const { rows } = await getPool().query<{
    id: string;
    status: string;
    due_date: string;
    assigned_at: Date;
    completed_at: Date | null;
  }>(
    `SELECT id, status, due_date::text AS due_date, assigned_at, completed_at
     FROM course_assignments
     WHERE assigned_to = $1 AND course_id = $2
     ORDER BY assigned_at DESC
     LIMIT 1`,
    [userId, courseId],
  );
  return rows[0] ?? null;
}

export async function setAssignmentStatus(id: string, status: string, completedAt?: Date): Promise<void> {
  await getPool().query(
    'UPDATE course_assignments SET status = $1, completed_at = COALESCE($2, completed_at) WHERE id = $3',
    [status, completedAt ?? null, id],
  );
}

// --- Lesson progress ---

export async function getOrCreateLessonProgress(
  assignmentId: string,
  lessonId: string,
): Promise<LessonProgressRecord> {
  const { rows } = await getPool().query<LessonProgressRecord>(
    `INSERT INTO learner_lesson_progress (assignment_id, lesson_id)
     VALUES ($1, $2)
     ON CONFLICT (assignment_id, lesson_id) DO UPDATE SET assignment_id = EXCLUDED.assignment_id
     RETURNING id, assignment_id, lesson_id, status, started_at, completed_at`,
    [assignmentId, lessonId],
  );
  return rows[0];
}

export async function markLessonInProgress(assignmentId: string, lessonId: string): Promise<void> {
  await getPool().query(
    `UPDATE learner_lesson_progress
     SET status = 'in_progress', started_at = COALESCE(started_at, now())
     WHERE assignment_id = $1 AND lesson_id = $2 AND status = 'not_started'`,
    [assignmentId, lessonId],
  );
}

export async function markLessonCompleted(assignmentId: string, lessonId: string): Promise<void> {
  await getPool().query(
    `UPDATE learner_lesson_progress
     SET status = 'completed', completed_at = now()
     WHERE assignment_id = $1 AND lesson_id = $2`,
    [assignmentId, lessonId],
  );
}

export async function listProgressForAssignment(assignmentId: string): Promise<LessonProgressRecord[]> {
  const { rows } = await getPool().query<LessonProgressRecord>(
    'SELECT id, assignment_id, lesson_id, status, started_at, completed_at FROM learner_lesson_progress WHERE assignment_id = $1',
    [assignmentId],
  );
  return rows;
}

export async function countCompletedLessons(assignmentId: string): Promise<number> {
  const { rows } = await getPool().query<{ count: number }>(
    "SELECT COUNT(*)::int AS count FROM learner_lesson_progress WHERE assignment_id = $1 AND status = 'completed'",
    [assignmentId],
  );
  return rows[0]?.count ?? 0;
}

// --- Learner stats (points/streak) ---

export async function getOrCreateLearnerStats(userId: string): Promise<LearnerStatsRecord> {
  const { rows } = await getPool().query<LearnerStatsRecord>(
    `INSERT INTO learner_stats (user_id)
     VALUES ($1)
     ON CONFLICT (user_id) DO UPDATE SET user_id = EXCLUDED.user_id
     RETURNING user_id, total_xp, current_streak, last_activity_date::text AS last_activity_date,
               lessons_completed_count, courses_completed_count`,
    [userId],
  );
  return rows[0];
}

/**
 * Adds XP and updates the daily streak in one call — every learner action
 * that awards points also counts as "activity" for streak purposes.
 * Streak: same day as last activity -> unchanged; exactly one day later ->
 * +1; anything else (including no prior activity) -> reset to 1.
 */
export async function recordActivityAndAddXp(userId: string, xpDelta: number): Promise<LearnerStatsRecord> {
  const stats = await getOrCreateLearnerStats(userId);

  const { rows } = await getPool().query<LearnerStatsRecord>(
    `UPDATE learner_stats
     SET total_xp = total_xp + $2,
         current_streak = CASE
           WHEN last_activity_date = CURRENT_DATE THEN current_streak
           WHEN last_activity_date = CURRENT_DATE - INTERVAL '1 day' THEN current_streak + 1
           ELSE 1
         END,
         last_activity_date = CURRENT_DATE
     WHERE user_id = $1
     RETURNING user_id, total_xp, current_streak, last_activity_date::text AS last_activity_date,
               lessons_completed_count, courses_completed_count`,
    [userId, xpDelta],
  );
  return rows[0] ?? stats;
}

export async function incrementLessonsCompleted(userId: string): Promise<void> {
  await getPool().query(
    'UPDATE learner_stats SET lessons_completed_count = lessons_completed_count + 1 WHERE user_id = $1',
    [userId],
  );
}

export async function incrementCoursesCompleted(userId: string): Promise<void> {
  await getPool().query(
    'UPDATE learner_stats SET courses_completed_count = courses_completed_count + 1 WHERE user_id = $1',
    [userId],
  );
}
