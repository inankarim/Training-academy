import { NotificationCategory } from './notification.model';

export interface RequesterContext {
  id: string;
  role: string;
}

export interface NotificationDTO {
  id: string;
  category: NotificationCategory;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  relatedCourseId: string | null;
  relatedUserId: string | null;
}

export interface PaginatedNotificationsDTO {
  items: NotificationDTO[];
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
