import { AppError } from '../../middleware/errorHandler';
import { writeAuditLog } from '../../utils/auditLog';
import * as assignmentsRepo from './assignments.postgres.repository';
import * as coursesRepo from '../courses/courses.postgres.repository';
import * as lessonsRepo from '../lessons/lessons.postgres.repository';
import * as usersRepo from '../users/users.repository';
import { AssignmentDTO, AssignmentRecord, CreateAssignmentInput, AssignmentFilters, RequesterContext, AssignableCourseDTO } from './assignments.types';
import { ClientContext } from '../auth/auth.types';

async function toDTO(record: AssignmentRecord): Promise<AssignmentDTO> {
  const [course, user] = await Promise.all([
    coursesRepo.findCourseById(record.course_id),
    usersRepo.findUserById(record.assigned_to),
  ]);

  return {
    id: record.id,
    courseId: record.course_id,
    courseName: course?.name ?? 'Unknown course',
    learningPath: course?.learning_path ?? '',
    assignedTo: record.assigned_to,
    assignedToName: user?.full_name ?? 'Unknown user',
    assignedBy: record.assigned_by,
    dueDate: record.due_date,
    status: record.status,
    assignedAt: record.assigned_at,
    completedAt: record.completed_at,
  };
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
      learningPath: c.learning_path,
      difficulty: c.difficulty,
      estimatedDuration: Number(c.estimated_duration),
      totalXpReward: c.total_xp_reward,
      lessonCount: (await lessonsRepo.findLessonsByCourse(c.id)).length,
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
