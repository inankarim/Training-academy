import mongoose, { Schema, Document } from 'mongoose';

export type NotificationAudienceType = 'role' | 'user';
export type NotificationAudienceRole = 'hr' | 'admin' | 'super_admin';
export type NotificationCategory = 'course_published' | 'assignment_overdue' | 'custom';

export interface NotificationDocument extends Document {
  audienceType: NotificationAudienceType;
  audienceRole: NotificationAudienceRole | null;
  audienceUserId: string | null;
  category: NotificationCategory;
  title: string;
  message: string;
  createdBy: string | null;
  relatedCourseId: string | null;
  relatedUserId: string | null;
  readBy: string[];
  deletedBy: string[];
  createdAt: Date;
}

const NotificationSchema = new Schema<NotificationDocument>(
  {
    audienceType: { type: String, enum: ['role', 'user'], required: true },
    audienceRole: { type: String, enum: ['hr', 'admin', 'super_admin'], default: null },
    audienceUserId: { type: String, default: null, index: true },
    category: { type: String, enum: ['course_published', 'assignment_overdue', 'custom'], required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    createdBy: { type: String, default: null },
    relatedCourseId: { type: String, default: null },
    relatedUserId: { type: String, default: null },
    readBy: { type: [String], default: [] },
    // Per-user dismissal: role notifications are one shared doc, so deleting
    // must hide it for that user only, never remove it for everyone else.
    deletedBy: { type: [String], default: [] },
    createdAt: { type: Date, default: Date.now },
  },
  { collection: 'notifications', minimize: false },
);

NotificationSchema.index({ audienceType: 1, audienceRole: 1, createdAt: -1 });
NotificationSchema.index({ audienceType: 1, audienceUserId: 1, createdAt: -1 });

export const NotificationModel =
  (mongoose.models.Notification as mongoose.Model<NotificationDocument>) ||
  mongoose.model<NotificationDocument>('Notification', NotificationSchema);
