import { NotificationModel, NotificationDocument, NotificationAudienceRole, NotificationCategory } from './notification.model';
import { RequesterContext } from './notifications.types';

function recipientFilter(recipient: RequesterContext) {
  return {
    $or: [
      { audienceType: 'role', audienceRole: recipient.role },
      { audienceType: 'user', audienceUserId: recipient.id },
    ],
    deletedBy: { $ne: recipient.id },
  };
}

export async function createRoleNotification(input: {
  audienceRole: NotificationAudienceRole;
  category: NotificationCategory;
  title: string;
  message: string;
  createdBy?: string;
  relatedCourseId?: string;
  relatedUserId?: string;
}): Promise<void> {
  await NotificationModel.create({
    audienceType: 'role',
    audienceRole: input.audienceRole,
    category: input.category,
    title: input.title,
    message: input.message,
    createdBy: input.createdBy ?? null,
    relatedCourseId: input.relatedCourseId ?? null,
    relatedUserId: input.relatedUserId ?? null,
  });
}

export async function createRoleNotificationForRoles(
  roles: NotificationAudienceRole[],
  input: {
    category: NotificationCategory;
    title: string;
    message: string;
    createdBy?: string;
    relatedCourseId?: string;
    relatedUserId?: string;
  },
): Promise<void> {
  await Promise.all(roles.map((audienceRole) => createRoleNotification({ ...input, audienceRole })));
}

/** One document per targeted learner — keeps the unread/read-state query identical for every notification kind. */
export async function createUserNotifications(
  userIds: string[],
  input: { category: NotificationCategory; title: string; message: string; createdBy?: string },
): Promise<void> {
  if (userIds.length === 0) return;
  await NotificationModel.insertMany(
    userIds.map((audienceUserId) => ({
      audienceType: 'user',
      audienceUserId,
      category: input.category,
      title: input.title,
      message: input.message,
      createdBy: input.createdBy ?? null,
      relatedCourseId: null,
      relatedUserId: null,
    })),
  );
}

export async function findForRecipient(
  recipient: RequesterContext,
  page: number,
  pageSize: number,
): Promise<{ items: NotificationDocument[]; total: number }> {
  const filter = recipientFilter(recipient);
  const [items, total] = await Promise.all([
    NotificationModel.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .exec(),
    NotificationModel.countDocuments(filter).exec(),
  ]);
  return { items, total };
}

export async function countUnreadForRecipient(recipient: RequesterContext): Promise<number> {
  return NotificationModel.countDocuments({
    ...recipientFilter(recipient),
    readBy: { $ne: recipient.id },
  }).exec();
}

export async function markRead(notificationId: string, userId: string): Promise<void> {
  await NotificationModel.updateOne({ _id: notificationId }, { $addToSet: { readBy: userId } }).exec();
}

/** Hides a notification for this recipient only; returns false if it isn't one of theirs. */
export async function deleteForRecipient(notificationId: string, recipient: RequesterContext): Promise<boolean> {
  const result = await NotificationModel.updateOne(
    { _id: notificationId, ...recipientFilter(recipient) },
    { $addToSet: { deletedBy: recipient.id } },
  ).exec();
  return result.matchedCount > 0;
}

export async function markAllReadForRecipient(recipient: RequesterContext): Promise<void> {
  await NotificationModel.updateMany(recipientFilter(recipient), { $addToSet: { readBy: recipient.id } }).exec();
}
