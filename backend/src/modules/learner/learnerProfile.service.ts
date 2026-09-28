import fs from 'fs/promises';
import path from 'path';
import { AppError } from '../../middleware/errorHandler';
import { UPLOADS_DIR } from '../../middleware/upload';
import { convertImageToWebp } from '../../utils/imageConverter';
import { writeAuditLog } from '../../utils/auditLog';
import { logger } from '../../utils/logger';
import * as usersRepo from '../users/users.repository';
import * as finalQuizRepo from '../courses/finalQuiz.mongo.repository';
import * as learnerRepo from './learner.postgres.repository';
import * as learnerMongoRepo from './learner.mongo.repository';
import { computeLevel } from './levels';
import { scorePercent } from './finalQuiz.progress';
import { listMyCourses } from './learner.service';
import { LearnerProfileDTO, RequesterContext } from './learner.types';
import { ClientContext } from '../auth/auth.types';

/** YYYY-MM-DD of a timestamp in the given IANA time zone. */
function dayInZone(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
}

function longestConsecutiveRun(sortedDays: string[]): number {
  let longest = 0;
  let run = 0;
  let previous: number | null = null;
  for (const day of sortedDays) {
    const t = Date.parse(`${day}T00:00:00Z`);
    run = previous !== null && t - previous === 86_400_000 ? run + 1 : 1;
    longest = Math.max(longest, run);
    previous = t;
  }
  return longest;
}

export async function getLearnerProfile(requester: RequesterContext): Promise<LearnerProfileDTO> {
  const user = await usersRepo.findUserById(requester.id);
  if (!user) throw new AppError('User not found.', 404);

  const [stats, streak, courses, lessonDays, attemptTimes, timeZone, completed] = await Promise.all([
    learnerRepo.getOrCreateLearnerStats(requester.id),
    learnerRepo.getStreakState(requester.id),
    listMyCourses(requester),
    learnerRepo.listLessonCompletionDays(requester.id),
    learnerMongoRepo.listAttemptTimes(requester.id),
    learnerRepo.getDatabaseTimeZone(),
    learnerRepo.listCompletedAssignments(requester.id),
  ]);

  // Activity heatmap: lesson completions + check/quiz submissions, bucketed
  // by day in the same time zone the streak is counted in.
  const perDay = new Map<string, number>();
  for (const { day, count } of lessonDays) perDay.set(day, (perDay.get(day) ?? 0) + count);
  for (const t of attemptTimes) {
    const day = dayInZone(new Date(t), timeZone);
    perDay.set(day, (perDay.get(day) ?? 0) + 1);
  }
  const days = [...perDay.entries()].map(([date, count]) => ({ date, count })).sort((a, b) => a.date.localeCompare(b.date));

  // Learning history: XP per completion = course reward + final quiz XP (score-
  // proportional) + lesson-check XP. Lesson checks can only be passed once
  // ever, so their XP is counted on the learner's first completion of a course.
  const firstCompletionByCourse = new Map<string, string>();
  for (const row of [...completed].reverse()) {
    if (!firstCompletionByCourse.has(row.course_id)) firstCompletionByCourse.set(row.course_id, row.assignment_id);
  }
  const history = await Promise.all(
    completed.map(async (row) => {
      const [attempts, quiz] = await Promise.all([
        learnerMongoRepo.listPassedAttemptsForCourse(requester.id, row.course_id),
        finalQuizRepo.getFinalQuiz(row.course_id),
      ]);
      const finalPass = attempts.find((a) => a.blockId === learnerMongoRepo.FINAL_QUIZ_BLOCK_ID && a.assignmentId === row.assignment_id);
      const finalQuizScore = finalPass ? scorePercent(finalPass.totalScore, finalPass.maxScore) : null;
      const finalQuizXp = finalQuizScore !== null && quiz ? Math.round((quiz.xpReward * finalQuizScore) / 100) : 0;
      const lessonCheckXp =
        firstCompletionByCourse.get(row.course_id) === row.assignment_id
          ? attempts.filter((a) => a.lessonId !== null).reduce((sum, a) => sum + a.totalScore, 0)
          : 0;
      return {
        assignmentId: row.assignment_id,
        courseId: row.course_id,
        courseName: row.course_name,
        completedAt: row.completed_at.toISOString(),
        xpEarned: row.total_xp_reward + finalQuizXp + lessonCheckXp,
        finalQuizScore,
      };
    }),
  );

  const level = computeLevel(stats.total_xp);

  return {
    user: {
      id: user.id,
      fullName: user.full_name,
      email: user.email,
      designation: user.designation,
      employeeId: user.employee_id,
      employeeType: user.employee_type,
      salesRole: user.sales_role,
      departmentName: user.department_name,
      territoryName: user.territory_name,
      avatarUrl: user.avatar_url,
    },
    level: {
      level: level.level,
      levelTitle: level.levelTitle,
      totalXp: stats.total_xp,
      xpIntoLevel: level.xpIntoLevel,
      xpForNextLevel: level.xpForNextLevel,
    },
    stats: {
      coursesAssigned: courses.length,
      coursesCompleted: courses.filter((c) => c.assignmentStatus === 'completed').length,
      lessonsCompleted: stats.lessons_completed_count,
      currentStreak: streak.currentStreak,
      streakActiveToday: streak.activeToday,
    },
    activity: {
      today: streak.today,
      days,
      totalActiveDays: days.length,
      longestStreak: longestConsecutiveRun(days.map((d) => d.date)),
    },
    currentFocus: courses.filter((c) => c.assignmentStatus !== 'completed'),
    history,
  };
}

/** Saves an uploaded photo (normalized to WebP) as the learner's avatar and removes the previous file. */
export async function setProfilePhoto(
  requester: RequesterContext,
  file: Express.Multer.File,
  baseUrl: string,
  ctx: ClientContext,
): Promise<string> {
  let filename = file.filename;
  try {
    filename = (await convertImageToWebp(UPLOADS_DIR, file.filename)).filename;
  } catch (err) {
    await fs.unlink(path.join(UPLOADS_DIR, file.filename)).catch(() => undefined);
    logger.warn('Profile photo conversion failed', { message: err instanceof Error ? err.message : 'unknown error' });
    throw new AppError('That image could not be read. Please upload a JPG, PNG or WebP photo.', 400);
  }

  const avatarUrl = `${baseUrl}/uploads/${filename}`;
  const previous = await usersRepo.setUserAvatarUrl(requester.id, avatarUrl);

  // Only ever delete files that live directly in our uploads folder.
  if (previous) {
    const previousName = path.basename(new URL(previous, baseUrl).pathname);
    if (previousName && previousName !== filename) {
      await fs.unlink(path.join(UPLOADS_DIR, previousName)).catch(() => undefined);
    }
  }

  await writeAuditLog({
    actorUserId: requester.id,
    action: 'user.avatar_updated',
    targetType: 'user',
    targetId: requester.id,
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
  });

  return avatarUrl;
}
