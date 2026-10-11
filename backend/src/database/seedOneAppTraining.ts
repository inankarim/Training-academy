/* eslint-disable no-console */
// One-off, idempotent: creates the "One App Training" course shell and its
// hardcoded, role-specific lessons (content lives in the frontend, not the
// Lesson Builder — see hardcodedLessons.registry.ts). Safe to re-run: every
// insert is keyed by name/title and skipped if it already exists. Adding a
// new hardcoded lesson later means adding one entry to HARDCODED_LESSONS
// below (plus its frontend component and backend hotspot registry entry),
// then re-running this script — existing rows are left untouched.
import { connectPostgres, disconnectPostgres, getPool } from './postgres';
import { connectMongo, disconnectMongo } from './mongo';
import { createCourseContent, findCourseContentByCourseId } from '../modules/courses/courses.mongo.repository';

const COURSE_NAME = 'One App Training';
const MODULE_TITLE = 'App Walkthrough';

const HARDCODED_LESSONS: Array<{
  title: string;
  description: string;
  hardcodedKey: string;
  applicableRoles: string[];
}> = [
  {
    title: 'SO Dashboard',
    description: 'A guided tour of the Dashboard screen as a Sales Officer sees it.',
    hardcodedKey: 'SO_DASHBOARD',
    applicableRoles: ['SO'],
  },
  {
    title: 'TSM Dashboard',
    description: 'A guided tour of the Dashboard screen as a Territory Sales Manager sees it.',
    hardcodedKey: 'TSM_DASHBOARD',
    applicableRoles: ['TSM'],
  },
  {
    title: 'Journey Cycle Plan',
    description: 'What you can do from Journey Cycle Plan, opened from the Activity section of your Dashboard.',
    hardcodedKey: 'SO_JOURNEY_CYCLE_PLAN',
    applicableRoles: ['SO'],
  },
  {
    title: 'Journey Cycle Plan',
    description: 'What you can do from Journey Cycle Plan, opened from the Activity section of your Dashboard.',
    hardcodedKey: 'TSM_JOURNEY_CYCLE_PLAN',
    applicableRoles: ['TSM'],
  },
];

async function main() {
  await connectPostgres();
  await connectMongo();
  const pool = getPool();

  const creator = await pool.query<{ id: string }>(
    `SELECT u.id FROM users u JOIN roles r ON r.id = u.role_id
     WHERE r.name = 'content_creator' ORDER BY u.created_at LIMIT 1`,
  );
  const createdBy = creator.rows[0]?.id;
  if (!createdBy) throw new Error('No content_creator account exists to own this course.');

  let { rows: courseRows } = await pool.query<{ id: string }>('SELECT id FROM courses WHERE name = $1', [COURSE_NAME]);
  let courseId = courseRows[0]?.id;
  if (!courseId) {
    const inserted = await pool.query<{ id: string }>(
      `INSERT INTO courses (created_by, name, description, difficulty, estimated_duration, total_xp_reward, status)
       VALUES ($1, $2, $3, 'beginner', 1, 50, 'draft')
       RETURNING id`,
      [createdBy, COURSE_NAME, 'An interactive, screen-by-screen walkthrough of the One App — tap around each screen to learn what everything does.'],
    );
    courseId = inserted.rows[0].id;
    console.log(`Created course "${COURSE_NAME}" (${courseId})`);
  } else {
    console.log(`Course "${COURSE_NAME}" already exists (${courseId})`);
  }

  // Hardcoded lessons have no Mongo block content, but every course still
  // needs this companion doc — it's where the final quiz config/questions
  // live, and the Course Builder's final-quiz page 404s without it.
  const existingContent = await findCourseContentByCourseId(courseId);
  if (!existingContent) {
    await createCourseContent(courseId);
    console.log(`Created course_content doc for "${COURSE_NAME}"`);
  }

  let { rows: moduleRows } = await pool.query<{ id: string }>(
    'SELECT id FROM modules WHERE course_id = $1 AND title = $2',
    [courseId, MODULE_TITLE],
  );
  let moduleId = moduleRows[0]?.id;
  if (!moduleId) {
    const inserted = await pool.query<{ id: string }>(
      `INSERT INTO modules (course_id, title, sort_order, created_by) VALUES ($1, $2, 1, $3) RETURNING id`,
      [courseId, MODULE_TITLE, createdBy],
    );
    moduleId = inserted.rows[0].id;
    console.log(`Created module "${MODULE_TITLE}" (${moduleId})`);
  }

  let sortOrder = 1;
  for (const lesson of HARDCODED_LESSONS) {
    // Keyed on hardcoded_key, not title — SO and TSM versions of a screen share a title.
    const { rows: existing } = await pool.query(
      'SELECT id FROM lessons WHERE course_id = $1 AND hardcoded_key = $2',
      [courseId, lesson.hardcodedKey],
    );
    if (existing.length > 0) {
      console.log(`Lesson "${lesson.title}" already exists, skipping`);
      sortOrder += 1;
      continue;
    }
    await pool.query(
      `INSERT INTO lessons (course_id, module_id, title, description, sort_order, status, applicable_roles, content_type, hardcoded_key, created_by)
       VALUES ($1, $2, $3, $4, $5, 'published', $6, 'hardcoded', $7, $8)`,
      [courseId, moduleId, lesson.title, lesson.description, sortOrder, lesson.applicableRoles, lesson.hardcodedKey, createdBy],
    );
    console.log(`Created hardcoded lesson "${lesson.title}" (role: ${lesson.applicableRoles.join(', ')})`);
    sortOrder += 1;
  }

  console.log('Done. A newly created course starts in draft — publish it from the Course Builder once it has a final quiz.');
  await disconnectPostgres();
  await disconnectMongo();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
