import { AppError } from '../../middleware/errorHandler';
import { writeAuditLog } from '../../utils/auditLog';
import * as assignmentsRepo from './assignments.postgres.repository';
import * as coursesRepo from '../courses/courses.postgres.repository';
import * as lessonsRepo from '../lessons/lessons.postgres.repository';
import * as usersRepo from '../users/users.repository';
import * as notificationsService from '../notifications/notifications.service';
import * as notificationsRepo from '../notifications/notifications.mongo.repository';
import { getFinalQuizProgress, loadRequiredFinalQuiz } from '../learner/finalQuiz.progress';
import { AssignmentDTO, AssignmentRecord, CreateAssignmentInput, AssignmentFilters, RequesterContext, AssignableCourseDTO } from './assignments.types';
import { ClientContext } from '../auth/auth.types';

async function toDTO(record: AssignmentRecord): Promise<AssignmentDTO> {
  const [course, user, quiz] = await Promise.all([
    coursesRepo.findCourseById(record.course_id),
    usersRepo.findUserById(record.assigned_to),
    loadRequiredFinalQuiz(record.course_id),
  ]);
  const finalQuiz = quiz ? await getFinalQuizProgress(record.course_id, record) : null;

  return {
    id: record.id,
    courseId: record.course_id,
    courseName: course?.name ?? 'Unknown course',
    assignedTo: record.assigned_to,
    assignedToName: user?.full_name ?? 'Unknown user',
    assignedBy: record.assigned_by,
    dueDate: record.due_date,
    status: record.status,
    assignedAt: record.assigned_at,
    completedAt: record.completed_at,
    finalQuiz,
  };
}

/** After a failed final quiz, HR allows the learner exactly one more attempt. */
export async function grantFinalQuizAttempt(
  requester: RequesterContext,
  assignmentId: string,
  ctx: ClientContext,
): Promise<AssignmentDTO> {
  const record = await assignmentsRepo.findAssignmentById(assignmentId);
  if (!record) throw new AppError('Assignment not found.', 404);

  const quiz = await loadRequiredFinalQuiz(record.course_id);
  if (!quiz) throw new AppError('This course has no final quiz.', 400);

  const progress = await getFinalQuizProgress(record.course_id, record);
  if (progress.status !== 'failed') {
    throw new AppError('Another attempt can only be granted after the learner has failed the final quiz.', 400);
  }

  await assignmentsRepo.grantFinalQuizAttempt(assignmentId);

  const course = await coursesRepo.findCourseById(record.course_id);
  await notificationsRepo.createUserNotifications([record.assigned_to], {
    category: 'custom',
    title: 'New final quiz attempt',
    message: `HR has given you another attempt at the final quiz for "${course?.name ?? 'your course'}". You need 50% to pass.`,
    createdBy: requester.id,
  });

  await writeAuditLog({
    actorUserId: requester.id,
    action: 'assignment.final_quiz_attempt_granted',
    targetType: 'course_assignment',
    targetId: assignmentId,
    metadata: { courseId: record.course_id, userId: record.assigned_to, attemptsUsed: progress.attemptsUsed },
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
  });

  const updated = await assignmentsRepo.findAssignmentById(assignmentId);
  return toDTO(updated!);
}

export async function createAssignment(
  requester: RequesterContext,
  input: CreateAssignmentInput,
  ctx: ClientContext,
): Promise<AssignmentDTO> {
  const course = await coursesRepo.findCourseById(input.courseId);
  if (!course) throw new AppError('Course not found.', 404);
  if (course.status !== 'published') {
    throw new AppError('Only published courses can be assigned.', 400);
  }

  const learner = await usersRepo.findUserById(input.userId);
  if (!learner) throw new AppError('User not found.', 404);
  if (learner.role_name !== 'learner') {
    throw new AppError('Courses can only be assigned to learner accounts.', 400);
  }
  if (learner.status !== 'active') {
    throw new AppError('Cannot assign a course to a deactivated user.', 400);
  }

  // Intentionally NOT checking for an existing assignment of the same
  // course to the same learner — repeat assignment is an explicit,
  // supported product requirement (e.g. re-training / a retake).
  const record = await assignmentsRepo.insertAssignment(requester.id, input);

  await writeAuditLog({
    actorUserId: requester.id,
    action: 'assignment.create',
    targetType: 'course_assignment',
    targetId: record.id,
    metadata: { courseId: input.courseId, userId: input.userId, dueDate: input.dueDate },
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
  });

  return toDTO(record);
}

export async function listAssignments(filters: AssignmentFilters): Promise<AssignmentDTO[]> {
  const records = await assignmentsRepo.listAssignments(filters);
  return Promise.all(records.map(toDTO));
}

/** Every published course, any content creator — feeds the HR "Assign Course" picker. */
export async function listAssignableCourses(): Promise<AssignableCourseDTO[]> {
  const courses = await coursesRepo.findPublishedCourses();
  return Promise.all(
    courses.map(async (c) => ({
      courseId: c.id,
      name: c.name,
      difficulty: c.difficulty,
      estimatedDuration: Number(c.estimated_duration),
      totalXpReward: c.total_xp_reward,
      lessonCount: (await lessonsRepo.findPublishedLessonsByCourse(c.id)).length,
    })),
  );
}

export async function getAssignment(assignmentId: string): Promise<AssignmentDTO> {
  const record = await assignmentsRepo.findAssignmentById(assignmentId);
  if (!record) throw new AppError('Assignment not found.', 404);
  return toDTO(record);
}

export async function deleteAssignment(
  requester: RequesterContext,
  assignmentId: string,
  ctx: ClientContext,
): Promise<void> {
  const record = await assignmentsRepo.findAssignmentById(assignmentId);
  if (!record) throw new AppError('Assignment not found.', 404);

  await assignmentsRepo.deleteAssignment(assignmentId);

  await writeAuditLog({
    actorUserId: requester.id,
    action: 'assignment.delete',
    targetType: 'course_assignment',
    targetId: assignmentId,
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
  });
}

/**
 * Flips lapsed assignments to 'overdue' and notifies hr/admin/super_admin,
 * exactly once per assignment (overdue_notified_at is the idempotency
 * guard). Exported standalone so it's callable directly for verification
 * without waiting on the interval in server.ts.
 */
export async function sweepOverdueAssignments(): Promise<number> {
  const lapsed = await assignmentsRepo.findLapsedAssignments();
  for (const assignment of lapsed) {
    await assignmentsRepo.markOverdueNotified(assignment.id);
    const [course, learner] = await Promise.all([
      coursesRepo.findCourseById(assignment.course_id),
      usersRepo.findUserById(assignment.assigned_to),
    ]);
    await notificationsService.notifyAssignmentOverdue({
      learnerId: assignment.assigned_to,
      learnerName: learner?.full_name ?? 'Unknown learner',
      courseId: assignment.course_id,
      courseName: course?.name ?? 'Unknown course',
    });
  }
  return lapsed.length;
}

let sweepInterval: NodeJS.Timeout | null = null;

/** Called once from server.ts after startup. Runs immediately (covers due dates that lapsed while the server was down), then every 15 minutes. */
export function startOverdueSweepScheduler(): void {
  if (sweepInterval) return;
  void sweepOverdueAssignments();
  sweepInterval = setInterval(() => {
    void sweepOverdueAssignments();
  }, 15 * 60 * 1000);
}
