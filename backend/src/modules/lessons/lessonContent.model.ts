import mongoose, { Schema, Document, Types } from 'mongoose';

export interface LessonBlockSubdoc {
  id: string;
  type: string;
  sortOrder: number;
  content: Record<string, unknown>;
  style: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface LessonContentDocument extends Document {
  lessonId: string; // = the owning Postgres lessons.id — canonical identity, never generated here
  courseId: string; // denormalized from Postgres for query convenience; Postgres stays authoritative
  moduleId: string;
  blocks: Types.DocumentArray<LessonBlockSubdoc>;
  contentVersion: number;
  createdAt: Date;
  updatedAt: Date;
}

const LessonBlockSchema = new Schema<LessonBlockSubdoc>(
  {
    id: { type: String, required: true },
    type: { type: String, required: true },
    sortOrder: { type: Number, required: true },
    content: { type: Schema.Types.Mixed, default: {} },
    style: { type: Schema.Types.Mixed, default: {} },
  },
  // minimize: false — nested subdocuments have their own minimize setting
  // independent of the parent schema's; without it here too, an empty
  // `style: {}` (or `content: {}`) on a freshly-added block gets stripped.
  { _id: false, timestamps: true, minimize: false },
);

const LessonContentSchema = new Schema<LessonContentDocument>(
  {
    lessonId: { type: String, required: true, unique: true, index: true },
    courseId: { type: String, required: true, index: true },
    moduleId: { type: String, required: true, index: true },
    blocks: { type: [LessonBlockSchema], default: [] },
    contentVersion: { type: Number, default: 1 },
  },
  // minimize: false — see courseContent.model.ts; without it Mongoose strips
  // empty-object Mixed defaults (content/style: {}) before saving.
  { timestamps: true, collection: 'lesson_content', minimize: false },
);

export const LessonContentModel =
  (mongoose.models.LessonContent as mongoose.Model<LessonContentDocument>) ||
  mongoose.model<LessonContentDocument>('LessonContent', LessonContentSchema);
