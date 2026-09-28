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
    final_quiz_extra_attempts: number;
  }>(
    `SELECT id, status, due_date::text AS due_date, assigned_at, completed_at, final_quiz_extra_attempts
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
    // Only lessons learners can currently see count toward course completion.
    `SELECT COUNT(*)::int AS count
     FROM learner_lesson_progress p
     JOIN lessons l ON l.id = p.lesson_id AND l.status = 'published'
     WHERE p.assignment_id = $1 AND p.status = 'completed'`,
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
  // The stats row may not exist yet for a brand-new learner; without it
  // this UPDATE matches nothing and the count is silently lost.
  await getOrCreateLearnerStats(userId);
  await getPool().query(
    'UPDATE learner_stats SET lessons_completed_count = lessons_completed_count + 1 WHERE user_id = $1',
    [userId],
  );
}

export async function incrementCoursesCompleted(userId: string): Promise<void> {
  // The stats row may not exist yet for a brand-new learner; without it
  // this UPDATE matches nothing and the count is silently lost.
  await getOrCreateLearnerStats(userId);
  await getPool().query(
    'UPDATE learner_stats SET courses_completed_count = courses_completed_count + 1 WHERE user_id = $1',
    [userId],
  );
}

// --- Learner profile ---

/**
 * The stored current_streak only changes when the learner does something, so
 * after a missed day it still holds the old number. The live streak is that
 * value only while the last activity was today or yesterday; otherwise 0.
 */
export async function getStreakState(userId: string): Promise<{ currentStreak: number; activeToday: boolean; today: string }> {
  const { rows } = await getPool().query<{ current_streak: number; active_today: boolean; today: string }>(
    `SELECT CASE WHEN s.last_activity_date >= CURRENT_DATE - 1 THEN s.current_streak ELSE 0 END AS current_streak,
            COALESCE(s.last_activity_date = CURRENT_DATE, false) AS active_today,
            to_char(CURRENT_DATE, 'YYYY-MM-DD') AS today
     FROM (SELECT 1) one
     LEFT JOIN learner_stats s ON s.user_id = $1`,
    [userId],
  );
  const row = rows[0];
  return { currentStreak: row?.current_streak ?? 0, activeToday: row?.active_today ?? false, today: row.today };
}

/** Lessons completed per calendar day (database time zone). */
export async function listLessonCompletionDays(userId: string): Promise<Array<{ day: string; count: number }>> {
  const { rows } = await getPool().query<{ day: string; count: number }>(
    `SELECT to_char(p.completed_at, 'YYYY-MM-DD') AS day, COUNT(*)::int AS count
     FROM learner_lesson_progress p
     JOIN course_assignments a ON a.id = p.assignment_id
     WHERE a.assigned_to = $1 AND p.completed_at IS NOT NULL
     GROUP BY 1`,
    [userId],
  );
  return rows;
}

export async function getDatabaseTimeZone(): Promise<string> {
  const { rows } = await getPool().query<{ TimeZone: string }>('SHOW TimeZone');
  return rows[0]?.TimeZone ?? 'UTC';
}

/** Completed assignments, latest first — one row per completion. */
export async function listCompletedAssignments(userId: string) {
  const { rows } = await getPool().query<{
    assignment_id: string;
    course_id: string;
    course_name: string;
    total_xp_reward: number;
    completed_at: Date;
  }>(
    `SELECT a.id AS assignment_id, c.id AS course_id, c.name AS course_name, c.total_xp_reward, a.completed_at
     FROM course_assignments a
     JOIN courses c ON c.id = a.course_id
     WHERE a.assigned_to = $1 AND a.status = 'completed' AND a.completed_at IS NOT NULL
     ORDER BY a.completed_at DESC`,
    [userId],
  );
  return rows;
}
