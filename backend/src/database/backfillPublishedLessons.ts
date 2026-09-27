/* eslint-disable no-console */
// One-off, idempotent: lessons already marked 'published' before draft/live
// content existed have no live copy yet, so learners would see them empty.
// This copies their current blocks into publishedBlocks. Safe to re-run —
// it only touches lessons that have never been snapshotted.
import { connectMongo, disconnectMongo } from './mongo';
import { connectPostgres, disconnectPostgres, getPool } from './postgres';
import { LessonContentModel } from '../modules/lessons/lessonContent.model';
import { publishLessonContent } from '../modules/lessons/lessons.mongo.repository';

async function main() {
  await Promise.all([connectMongo(), connectPostgres()]);

  const { rows } = await getPool().query<{ id: string; title: string }>(
    "SELECT id, title FROM lessons WHERE status = 'published'",
  );

  let backfilled = 0;
  for (const lesson of rows) {
    const doc = await LessonContentModel.findOne({ lessonId: lesson.id }).exec();
    if (!doc || doc.publishedAt) continue;
    await publishLessonContent(lesson.id);
    backfilled += 1;
    console.log(`Backfilled live content for: ${lesson.title}`);
  }

  console.log(`Done. ${backfilled} of ${rows.length} published lessons backfilled.`);
  await Promise.all([disconnectMongo(), disconnectPostgres()]);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
