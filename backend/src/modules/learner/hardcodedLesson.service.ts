import { AppError } from '../../middleware/errorHandler';
import * as lessonsRepo from '../lessons/lessons.postgres.repository';
import * as learnerRepo from './learner.postgres.repository';
import * as hotspotRepo from './hotspotProgress.postgres.repository';
import { getHotspotIds } from './hardcodedLessons.registry';
import { assertAssignment, assertLessonVisibleToRole, getSalesRole, completeLesson } from './learner.service';
import { HardcodedLessonProgressDTO, RequesterContext } from './learner.types';
import { ClientContext } from '../auth/auth.types';

async function loadHardcodedLesson(requester: RequesterContext, lessonId: string) {
  const lesson = await lessonsRepo.findLessonById(lessonId);
  if (!lesson || lesson.status !== 'published' || lesson.content_type !== 'hardcoded' || !lesson.hardcoded_key) {
    throw new AppError('Lesson not found.', 404);
  }
  assertLessonVisibleToRole(lesson, await getSalesRole(requester.id));
  const assignment = await assertAssignment(requester.id, lesson.course_id);
  return { lesson, assignment };
}

export async function getHardcodedLessonProgress(
  requester: RequesterContext,
  lessonId: string,
): Promise<HardcodedLessonProgressDTO> {
  const { lesson, assignment } = await loadHardcodedLesson(requester, lessonId);
  const hardcodedKey = lesson.hardcoded_key!;
  const totalHotspots = getHotspotIds(hardcodedKey).length;
  const exploredHotspotIds = await hotspotRepo.listExploredHotspotIds(assignment.id, lessonId);

  if (assignment.status === 'assigned') {
    await learnerRepo.setAssignmentStatus(assignment.id, 'in_progress');
  }
  await learnerRepo.getOrCreateLessonProgress(assignment.id, lessonId);
  await learnerRepo.markLessonInProgress(assignment.id, lessonId);
  const progressRows = await learnerRepo.listProgressForAssignment(assignment.id);
  const lessonCompleted = progressRows.find((p) => p.lesson_id === lessonId)?.status === 'completed';

  return {
    lessonId: lesson.id,
    courseId: lesson.course_id,
    title: lesson.title,
    hardcodedKey,
    totalHotspots,
    exploredHotspotIds,
    lessonCompleted,
  };
}

/**
 * Records a tap (idempotent) and, once every hotspot on this screen has been
 * explored, completes the lesson through the exact same path every other
 * lesson type uses — course progress, XP-on-full-completion, and the final
 * quiz unlock all come along for free.
 */
export async function exploreHotspot(
  requester: RequesterContext,
  lessonId: string,
  hotspotId: string,
  ctx: ClientContext,
): Promise<HardcodedLessonProgressDTO> {
  const { lesson, assignment } = await loadHardcodedLesson(requester, lessonId);
  const hardcodedKey = lesson.hardcoded_key!;
  const validHotspotIds = getHotspotIds(hardcodedKey);
  if (!validHotspotIds.includes(hotspotId)) {
    throw new AppError('Unknown hotspot for this lesson.', 400);
  }

  await hotspotRepo.recordHotspotExplored(assignment.id, lessonId, hotspotId);
  const exploredHotspotIds = await hotspotRepo.listExploredHotspotIds(assignment.id, lessonId);
  const fullyExplored = validHotspotIds.every((id) => exploredHotspotIds.includes(id));

  const progressRows = await learnerRepo.listProgressForAssignment(assignment.id);
  const alreadyCompleted = progressRows.find((p) => p.lesson_id === lessonId)?.status === 'completed';
  if (fullyExplored && !alreadyCompleted) {
    await completeLesson(requester, lessonId, ctx);
  }

  return {
    lessonId: lesson.id,
    courseId: lesson.course_id,
    title: lesson.title,
    hardcodedKey,
    totalHotspots: validHotspotIds.length,
    exploredHotspotIds,
    // A lesson completed before a hotspot was added to its screen stays completed.
    lessonCompleted: fullyExplored || alreadyCompleted,
  };
}
