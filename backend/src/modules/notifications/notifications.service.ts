import { AppError } from '../../middleware/errorHandler';
import * as notificationsRepo from './notifications.mongo.repository';
import * as usersRepo from '../users/users.repository';
import { NotificationDocument, NotificationAudienceRole } from './notification.model';
import { RequesterContext, NotificationDTO, PaginatedNotificationsDTO, SendCustomMessageInput } from './notifications.types';

const STAFF_ROLES: NotificationAudienceRole[] = ['hr', 'admin', 'super_admin'];

function toDTO(doc: NotificationDocument, requesterId: string): NotificationDTO {
  return {
    id: doc.id,
    category: doc.category,
    title: doc.title,
    message: doc.message,
    isRead: doc.readBy.includes(requesterId),
    createdAt: doc.createdAt.toISOString(),
    relatedCourseId: doc.relatedCourseId,
    relatedUserId: doc.relatedUserId,
  };
}

export async function notifyCoursePublished(course: { id: string; name: string }, createdBy: string): Promise<void> {
  await notificationsRepo.createRoleNotificationForRoles(STAFF_ROLES, {
    category: 'course_published',
    title: 'New course published',
    message: `"${course.name}" is now live and available to assign.`,
    createdBy,
    relatedCourseId: course.id,
  });
}

export async function notifyAssignmentOverdue(input: {
  learnerId: string;
  learnerName: string;
  courseId: string;
  courseName: string;
}): Promise<void> {
  await notificationsRepo.createRoleNotificationForRoles(STAFF_ROLES, {
    category: 'assignment_overdue',
    title: 'Course assignment overdue',
    message: `${input.learnerName} did not complete "${input.courseName}" by its due date.`,
    relatedCourseId: input.courseId,
    relatedUserId: input.learnerId,
  });
}

export async function sendCustomMessage(
  requester: RequesterContext,
  input: SendCustomMessageInput,
): Promise<{ createdCount: number }> {
  if (!['admin', 'super_admin'].includes(requester.role)) {
    throw new AppError('Only Admin or Super Admin can send custom messages.', 403);
  }
  if (!input.title.trim() || !input.message.trim()) {
    throw new AppError('Title and message are required.', 400);
  }

  let targetIds: string[];
  if (input.targetLearnerIds === 'all') {
    targetIds = await usersRepo.findActiveLearnerIds();
  } else {
    const learners = await Promise.all(input.targetLearnerIds.map((id) => usersRepo.findUserById(id)));
    targetIds = learners
      .filter((u): u is NonNullable<typeof u> => u !== null && u.role_name === 'learner' && u.status === 'active')
      .map((u) => u.id);
  }

  if (targetIds.length === 0) {
    throw new AppError("No active learners matched this message's recipients.", 400);
  }

  await notificationsRepo.createUserNotifications(targetIds, {
    category: 'custom',
    title: input.title,
    message: input.message,
    createdBy: requester.id,
  });

  return { createdCount: targetIds.length };
}

export async function listForRequester(
  requester: RequesterContext,
  page: number,
  pageSize: number,
): Promise<PaginatedNotificationsDTO> {
  const { items, total } = await notificationsRepo.findForRecipient(requester, page, pageSize);
  return {
    items: items.map((doc) => toDTO(doc, requester.id)),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getUnreadCount(requester: RequesterContext): Promise<number> {
  return notificationsRepo.countUnreadForRecipient(requester);
}

export async function markRead(requester: RequesterContext, notificationId: string): Promise<void> {
  await notificationsRepo.markRead(notificationId, requester.id);
}

export async function markAllRead(requester: RequesterContext): Promise<void> {
  await notificationsRepo.markAllReadForRecipient(requester);
}
