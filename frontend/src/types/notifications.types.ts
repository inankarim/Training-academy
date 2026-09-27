export type NotificationCategory = 'course_published' | 'assignment_overdue' | 'custom';

export interface NotificationItem {
  id: string;
  category: NotificationCategory;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  relatedCourseId: string | null;
  relatedUserId: string | null;
}

export interface PaginatedNotifications {
  items: NotificationItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface SendCustomMessageInput {
  title: string;
  message: string;
  targetLearnerIds: string[] | 'all';
}
