import { getPool } from '../../database/postgres';

/** Idempotent — tapping an already-explored hotspot again is a no-op, matching "re-tappable anytime." */
export async function recordHotspotExplored(assignmentId: string, lessonId: string, hotspotId: string): Promise<void> {
  await getPool().query(
    `INSERT INTO lesson_hotspot_progress (assignment_id, lesson_id, hotspot_id)
     VALUES ($1, $2, $3)
     ON CONFLICT (assignment_id, lesson_id, hotspot_id) DO NOTHING`,
    [assignmentId, lessonId, hotspotId],
  );
}

export async function listExploredHotspotIds(assignmentId: string, lessonId: string): Promise<string[]> {
  const { rows } = await getPool().query<{ hotspot_id: string }>(
    'SELECT hotspot_id FROM lesson_hotspot_progress WHERE assignment_id = $1 AND lesson_id = $2',
    [assignmentId, lessonId],
  );
  return rows.map((r) => r.hotspot_id);
}
