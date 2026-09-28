import { AppError } from '../../middleware/errorHandler';
import { writeAuditLog } from '../../utils/auditLog';
import * as assignmentsRepo from '../assignments/assignments.postgres.repository';
import * as coursesRepo from '../courses/courses.postgres.repository';
import * as courseModulesRepo from '../lessons/courseModules.postgres.repository';
import * as lessonsRepo from '../lessons/lessons.postgres.repository';
import * as lessonsMongoRepo from '../lessons/lessons.mongo.repository';
import * as learnerRepo from './learner.postgres.repository';
import * as learnerMongoRepo from './learner.mongo.repository';
import { computeLevel } from './levels';
import * as usersRepo from '../users/users.repository';
import * as notificationsService from '../notifications/notifications.service';
import {
  FINAL_QUIZ_PASS_PERCENT,
  courseProgressPercent,
  getFinalQuizProgress,
  loadRequiredFinalQuiz,
  scorePercent,
} from './finalQuiz.progress';
import {
  RequesterContext,
  LearnerCourseSummaryDTO,
  LearnerCourseDetailDTO,
  LearnerLessonDetailDTO,
  BlockAttemptInput,
  BlockAttemptResultDTO,
  LearnerDashboardDTO,
  FinalQuizSummaryDTO,
  LearnerFinalQuizDTO,
  FinalQuizAttemptResultDTO,
} from './learner.types';
import { ClientContext } from '../auth/auth.types';

interface DefaultRetryPolicy {
  allowRetry: boolean;
  hideCorrectAnswer: boolean;
  scoreDecayPercent: number;
}

const DEFAULT_RETRY_POLICY: DefaultRetryPolicy = {
  allowRetry: true,
  hideCorrectAnswer: true,
  scoreDecayPercent: 10,
};

async function assertAssignment(userId: string, courseId: string) {
  const assignment = await learnerRepo.findLatestAssignmentForLearnerCourse(userId, courseId);
  if (!assignment) {
    throw new AppError('This course has not been assigned to you.', 403);
  }
  if (assignment.status === 'overdue') {
    throw new AppError('This course is locked because its due date has passed. Contact HR to extend the deadline.', 423);
  }
  return assignment;
}

async function courseProgress(userId: string, courseId: string) {
  const assignment = await learnerRepo.findLatestAssignmentForLearnerCourse(userId, courseId);
  if (!assignment) return null;
  const lessons = await lessonsRepo.findPublishedLessonsByCourse(courseId);
  const completed = await learnerRepo.countCompletedLessons(assignment.id);
  const total = lessons.length;
  const quiz = await loadRequiredFinalQuiz(courseId);
  const quizPassed = quiz ? (await getFinalQuizProgress(courseId, assignment)).status === 'passed' : false;
  return {
    assignment,
    lessonCount: total,
    completedLessonCount: completed,
    progress: courseProgressPercent(completed, total, quiz ? { passed: quizPassed } : null),
  };
}

async function toCourseSummaryDTO(requester: RequesterContext, course: Awaited<ReturnType<typeof coursesRepo.findCourseById>>): Promise<LearnerCourseSummaryDTO | null> {
  if (!course) return null;
  const progress = await courseProgress(requester.id, course.id);
  if (!progress) return null;

  return {
    courseId: course.id,
    name: course.name,
    description: course.description,
    difficulty: course.difficulty,
    estimatedDuration: Number(course.estimated_duration),
    totalXpReward: course.total_xp_reward,
    bannerRef: course.banner_ref,
    lessonCount: progress.lessonCount,
    completedLessonCount: progress.completedLessonCount,
    progress: progress.progress,
    dueDate: progress.assignment.due_date,
    assignmentStatus: progress.assignment.status,
  };
}

export async function listMyCourses(requester: RequesterContext): Promise<LearnerCourseSummaryDTO[]> {
  const courseIds = await assignmentsRepo.findAssignedCourseIdsForLearner(requester.id);
  const courses = (await coursesRepo.findCoursesByIds(courseIds)).filter((c) => c.status === 'published');
  const dtos = await Promise.all(courses.map((c) => toCourseSummaryDTO(requester, c)));
  return dtos.filter((d): d is LearnerCourseSummaryDTO => d !== null);
}

export async function getCourseForLearner(
  requester: RequesterContext,
  courseId: string,
): Promise<LearnerCourseDetailDTO> {
  const assignment = await assertAssignment(requester.id, courseId);
  const course = await coursesRepo.findCourseById(courseId);
  if (!course) throw new AppError('Course not found.', 404);

  const [modules, lessons, progressRows] = await Promise.all([
    courseModulesRepo.findModulesByCourse(courseId),
    lessonsRepo.findPublishedLessonsByCourse(courseId),
    learnerRepo.listProgressForAssignment(assignment.id),
  ]);

  const moduleTitleById = new Map(modules.map((m) => [m.id, m.title]));
  const progressByLesson = new Map(progressRows.map((p) => [p.lesson_id, p.status]));
  const visibleLessonIds = new Set(lessons.map((l) => l.id));
  const completedLessonCount = progressRows.filter(
    (p) => p.status === 'completed' && visibleLessonIds.has(p.lesson_id),
  ).length;
  const finalQuiz = await finalQuizSummaryFor(courseId, assignment);

  return {
    courseId: course.id,
    name: course.name,
    description: course.description,
    difficulty: course.difficulty,
    estimatedDuration: Number(course.estimated_duration),
    totalXpReward: course.total_xp_reward,
    bannerRef: course.banner_ref,
    lessonCount: lessons.length,
    completedLessonCount,
    progress: courseProgressPercent(completedLessonCount, lessons.length, finalQuiz ? { passed: finalQuiz.status === 'passed' } : null),
    dueDate: assignment.due_date,
    assignmentStatus: assignment.status,
    lessons: lessons.map((l) => ({
      lessonId: l.id,
      title: l.title,
      description: l.description,
      sortOrder: l.sort_order,
      moduleId: l.module_id,
      moduleTitle: moduleTitleById.get(l.module_id) ?? '',
      progressStatus: progressByLesson.get(l.id) ?? 'not_started',
    })),
    finalQuiz,
  };
}

// ---------------------------------------------------------------------------
// Final course quiz
// ---------------------------------------------------------------------------

type LearnerAssignment = NonNullable<Awaited<ReturnType<typeof learnerRepo.findLatestAssignmentForLearnerCourse>>>;

async function finalQuizSummaryFor(courseId: string, assignment: LearnerAssignment): Promise<FinalQuizSummaryDTO | null> {
  const quiz = await loadRequiredFinalQuiz(courseId);
  if (!quiz) return null;
  const progress = await getFinalQuizProgress(courseId, assignment);
  return {
    quizName: quiz.quizName || 'Final Quiz',
    status: progress.status,
    passingScore: FINAL_QUIZ_PASS_PERCENT,
    allowedAttempts: progress.allowedAttempts,
    attemptsUsed: progress.attemptsUsed,
    questionCount: quiz.questions.length,
    xpReward: quiz.xpReward,
    bestScorePercent: progress.bestScorePercent,
  };
}

export async function getFinalQuizForLearner(requester: RequesterContext, courseId: string): Promise<LearnerFinalQuizDTO> {
  const assignment = await assertAssignment(requester.id, courseId);
  const course = await coursesRepo.findCourseById(courseId);
  const quiz = await loadRequiredFinalQuiz(courseId);
  if (!course || !quiz) throw new AppError('This course has no final quiz.', 404);

  const summary = (await finalQuizSummaryFor(courseId, assignment))!;
  return {
    ...summary,
    courseId,
    courseName: course.name,
    // Questions (never answers) are only handed out while an attempt is open.
    questions:
      summary.status === 'available'
        ? quiz.questions
            .slice()
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((q) => ({ id: q.id, question: q.question, options: q.options, points: q.points }))
        : [],
  };
}

export async function submitFinalQuizAttempt(
  requester: RequesterContext,
  courseId: string,
  input: BlockAttemptInput,
  ctx: ClientContext,
): Promise<FinalQuizAttemptResultDTO> {
  const assignment = await assertAssignment(requester.id, courseId);
  const course = await coursesRepo.findCourseById(courseId);
  const quiz = await loadRequiredFinalQuiz(courseId);
  if (!course || !quiz) throw new AppError('This course has no final quiz.', 404);

  const progress = await getFinalQuizProgress(courseId, assignment);
  if (progress.status === 'locked') throw new AppError('Complete every lesson before taking the final quiz.', 400);
  if (progress.status === 'passed') throw new AppError('You have already passed this final quiz.', 400);
  if (progress.status === 'failed') {
    throw new AppError('You have no attempts left. Please contact HR personally to get another attempt.', 400);
  }

  const answerByQuestion = new Map(input.answers.map((a) => [a.questionId, a.selectedAnswer.trim()]));
  if (quiz.questions.some((q) => !answerByQuestion.get(q.id))) {
    throw new AppError('Answer every question before submitting.', 400);
  }

  const graded = quiz.questions.map((q) => ({ q, correct: answerByQuestion.get(q.id) === q.correctAnswer.trim() }));
  const maxScore = graded.reduce((sum, g) => sum + g.q.points, 0);
  const earned = graded.reduce((sum, g) => sum + (g.correct ? g.q.points : 0), 0);
  const percent = scorePercent(earned, maxScore);
  const passed = percent >= FINAL_QUIZ_PASS_PERCENT;
  const attemptNumber = progress.attemptsUsed + 1;

  await learnerMongoRepo.recordAttempt({
    userId: requester.id,
    courseId,
    lessonId: null,
    blockId: learnerMongoRepo.FINAL_QUIZ_BLOCK_ID,
    assignmentId: assignment.id,
    attemptNumber,
    answers: graded.map((g) => ({
      questionId: g.q.id,
      selectedAnswer: answerByQuestion.get(g.q.id)!,
      correct: g.correct,
    })),
    totalScore: earned,
    maxScore,
    passed,
  });

  let xpAwarded = 0;
  if (passed) {
    // Quiz XP is proportional to the score: 55% of a 100-XP quiz earns 55.
    xpAwarded += Math.round((quiz.xpReward * percent) / 100);

    // completed_at already set means this assignment was completed (and paid
    // its course XP) before — e.g. reopened for the quiz — so don't pay twice.
    const firstCompletion = !assignment.completed_at;
    if (firstCompletion) {
      xpAwarded += course.total_xp_reward;
      await learnerRepo.incrementCoursesCompleted(requester.id);
    }
    await learnerRepo.setAssignmentStatus(assignment.id, 'completed', new Date());
    await learnerRepo.recordActivityAndAddXp(requester.id, xpAwarded);

    await writeAuditLog({
      actorUserId: requester.id,
      action: 'learner.course_completed',
      targetType: 'course',
      targetId: courseId,
      metadata: { assignmentId: assignment.id, finalQuizScore: percent, attemptNumber },
      ipAddress: ctx.ip,
      userAgent: ctx.userAgent,
    });
  } else {
    await learnerRepo.recordActivityAndAddXp(requester.id, 0);
    const learner = await usersRepo.findUserById(requester.id);
    await notificationsService.notifyFinalQuizFailed({
      learnerId: requester.id,
      learnerName: learner?.full_name ?? 'A learner',
      courseId,
      courseName: course.name,
      scorePercent: percent,
      attemptNumber,
    });
  }

  await writeAuditLog({
    actorUserId: requester.id,
    action: passed ? 'learner.final_quiz_passed' : 'learner.final_quiz_failed',
    targetType: 'course',
    targetId: courseId,
    metadata: { assignmentId: assignment.id, attemptNumber, scorePercent: percent, earned, maxScore },
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
  });

  return {
    passed,
    scorePercent: percent,
    passingScore: FINAL_QUIZ_PASS_PERCENT,
    attemptNumber,
    xpAwarded,
    status: passed ? 'passed' : 'failed',
    perQuestion: graded.map((g) => ({
      questionId: g.q.id,
      correct: g.correct,
      ...(quiz.retryPolicy?.hideCorrectAnswer === false ? { correctAnswer: g.q.correctAnswer } : {}),
    })),
  };
}

export async function getLessonForLearner(
  requester: RequesterContext,
  lessonId: string,
): Promise<LearnerLessonDetailDTO> {
  const lesson = await lessonsRepo.findLessonById(lessonId);
  if (!lesson || lesson.status !== 'published') throw new AppError('Lesson not found.', 404);

  const assignment = await assertAssignment(requester.id, lesson.course_id);

  if (assignment.status === 'assigned') {
    await learnerRepo.setAssignmentStatus(assignment.id, 'in_progress');
  }
  await learnerRepo.getOrCreateLessonProgress(assignment.id, lessonId);
  await learnerRepo.markLessonInProgress(assignment.id, lessonId);

  const content = await lessonsMongoRepo.findLessonContentByLessonId(lessonId);
  const progressRows = await learnerRepo.listProgressForAssignment(assignment.id);
  const status = progressRows.find((p) => p.lesson_id === lessonId)?.status ?? 'in_progress';

  const rawBlocks = (content?.publishedBlocks ?? [])
    .map((b) => b.toObject())
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const blocks = await Promise.all(
    rawBlocks.map(async (b) => {
      if (b.type !== 'KNOWLEDGE_CHECK' && b.type !== 'QUIZ') {
        return { id: b.id, type: b.type, sortOrder: b.sortOrder, content: b.content, style: b.style };
      }

      // Never send correctAnswer/explanation to the learner-facing API —
      // the client only needs these to grade a submission server-side.
      const blockContent = b.content as Record<string, unknown>;
      const questions = (blockContent.questions as Array<Record<string, unknown>> | undefined) ?? [];
      const sanitizedQuestions = questions.map(({ correctAnswer, explanation, ...rest }) => rest);
      const alreadyCompleted = await learnerMongoRepo.hasPassedBlock(requester.id, lessonId, b.id);

      return {
        id: b.id,
        type: b.type,
        sortOrder: b.sortOrder,
        content: { ...blockContent, questions: sanitizedQuestions },
        style: b.style,
        alreadyCompleted,
      };
    }),
  );

  return {
    lessonId: lesson.id,
    courseId: lesson.course_id,
    title: lesson.title,
    description: lesson.description,
    progressStatus: status,
    blocks,
  };
}

export async function completeLesson(
  requester: RequesterContext,
  lessonId: string,
  ctx: ClientContext,
): Promise<void> {
  const lesson = await lessonsRepo.findLessonById(lessonId);
  if (!lesson || lesson.status !== 'published') throw new AppError('Lesson not found.', 404);

  const assignment = await assertAssignment(requester.id, lesson.course_id);

  await learnerRepo.markLessonCompleted(assignment.id, lessonId);
  await learnerRepo.incrementLessonsCompleted(requester.id);
  await learnerRepo.recordActivityAndAddXp(requester.id, 0); // no per-lesson XP by design — counts as daily activity only

  await writeAuditLog({
    actorUserId: requester.id,
    action: 'learner.lesson_completed',
    targetType: 'lesson',
    targetId: lessonId,
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
  });

  const [lessons, completedCount] = await Promise.all([
    lessonsRepo.findPublishedLessonsByCourse(lesson.course_id),
    learnerRepo.countCompletedLessons(assignment.id),
  ]);

  // A course with a final quiz only completes when the quiz is passed
  // (submitFinalQuizAttempt); finishing the lessons just unlocks the quiz.
  const requiresFinalQuiz = (await loadRequiredFinalQuiz(lesson.course_id)) !== null;

  if (!requiresFinalQuiz && lessons.length > 0 && completedCount >= lessons.length && assignment.status !== 'completed') {
    await learnerRepo.setAssignmentStatus(assignment.id, 'completed', new Date());
    await learnerRepo.incrementCoursesCompleted(requester.id);

    const course = await coursesRepo.findCourseById(lesson.course_id);
    if (course) {
      await learnerRepo.recordActivityAndAddXp(requester.id, course.total_xp_reward);
    }

    await writeAuditLog({
      actorUserId: requester.id,
      action: 'learner.course_completed',
      targetType: 'course',
      targetId: lesson.course_id,
      metadata: { assignmentId: assignment.id },
      ipAddress: ctx.ip,
      userAgent: ctx.userAgent,
    });
  }
}

export async function submitBlockAttempt(
  requester: RequesterContext,
  lessonId: string,
  blockId: string,
  input: BlockAttemptInput,
  ctx: ClientContext,
): Promise<BlockAttemptResultDTO> {
  const lesson = await lessonsRepo.findLessonById(lessonId);
  if (!lesson || lesson.status !== 'published') throw new AppError('Lesson not found.', 404);
  await assertAssignment(requester.id, lesson.course_id);

  const content = await lessonsMongoRepo.findLessonContentByLessonId(lessonId);
  const block = content?.publishedBlocks.find((b) => b.id === blockId);
  if (!block) throw new AppError('Block not found.', 404);
  if (block.type !== 'KNOWLEDGE_CHECK' && block.type !== 'QUIZ') {
    throw new AppError('This block does not accept answer submissions.', 400);
  }

  if (await learnerMongoRepo.hasPassedBlock(requester.id, lessonId, blockId)) {
    throw new AppError('You have already completed this check.', 400);
  }

  const blockContent = block.content as Record<string, unknown>;
  const questions = (blockContent.questions as Array<{ id: string; correctAnswer: string; points: number }>) ?? [];
  if (questions.length === 0) {
    throw new AppError('This check has no questions yet.', 400);
  }

  const retryPolicy = (blockContent.retryPolicy as DefaultRetryPolicy | undefined) ?? DEFAULT_RETRY_POLICY;

  // Compared with both sides trimmed: the selectedAnswer validator already
  // trims what the learner submits, but authored option/correctAnswer text
  // (pasted from elsewhere) can carry incidental leading/trailing whitespace
  // — without normalizing both sides, the objectively correct choice can
  // fail an exact-equality check on whitespace alone.
  const answerByQuestion = new Map(input.answers.map((a) => [a.questionId, a.selectedAnswer.trim()]));
  const perQuestion = questions.map((q) => ({
    questionId: q.id,
    correct: answerByQuestion.get(q.id) === q.correctAnswer.trim(),
  }));
  const passed = perQuestion.length === questions.length && perQuestion.every((p) => p.correct);
  const maxScore = questions.reduce((sum, q) => sum + q.points, 0);

  const priorAttempts = await learnerMongoRepo.countPriorAttempts(requester.id, lessonId, blockId);
  const attemptNumber = priorAttempts + 1;
  const decayMultiplier = Math.pow(1 - retryPolicy.scoreDecayPercent / 100, attemptNumber - 1);
  const totalScore = passed ? Math.round(maxScore * decayMultiplier) : 0;

  await learnerMongoRepo.recordAttempt({
    userId: requester.id,
    courseId: lesson.course_id,
    lessonId,
    blockId,
    attemptNumber,
    answers: questions.map((q) => ({
      questionId: q.id,
      selectedAnswer: answerByQuestion.get(q.id) ?? '',
      correct: answerByQuestion.get(q.id) === q.correctAnswer.trim(),
    })),
    totalScore,
    maxScore,
    passed,
  });

  if (passed && totalScore > 0) {
    await learnerRepo.recordActivityAndAddXp(requester.id, totalScore);
  }

  await writeAuditLog({
    actorUserId: requester.id,
    action: passed ? 'learner.block_passed' : 'learner.block_failed',
    targetType: 'lesson',
    targetId: lessonId,
    metadata: { blockId, attemptNumber, totalScore, maxScore },
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
  });

  return { passed, score: totalScore, maxScore, attemptNumber, perQuestion };
}

export async function getDashboard(requester: RequesterContext): Promise<LearnerDashboardDTO> {
  const [stats, streak] = await Promise.all([
    learnerRepo.getOrCreateLearnerStats(requester.id),
    learnerRepo.getStreakState(requester.id),
  ]);
  const level = computeLevel(stats.total_xp);

  return {
    totalXp: stats.total_xp,
    level: level.level,
    levelTitle: level.levelTitle,
    xpIntoLevel: level.xpIntoLevel,
    xpForNextLevel: level.xpForNextLevel,
    currentStreak: streak.currentStreak,
    lessonsCompletedCount: stats.lessons_completed_count,
    coursesCompletedCount: stats.courses_completed_count,
  };
}
