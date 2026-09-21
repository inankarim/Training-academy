// Single source of truth for the Lesson Builder's Content Library — drives
// both request validation and GET /content-creator/lesson-builder/block-types.
export const BLOCK_CATEGORIES = ['MEDIA', 'CONTENT', 'ASSESSMENT', 'LESSON_FLOW'] as const;
export type BlockCategory = (typeof BLOCK_CATEGORIES)[number];

export interface BlockTypeMeta {
  type: string;
  category: BlockCategory;
  label: string;
}

export const BLOCK_TYPE_CATALOG: BlockTypeMeta[] = [
  // MEDIA
  { type: 'HERO_BANNER', category: 'MEDIA', label: 'Hero Banner' },
  { type: 'VIDEO', category: 'MEDIA', label: 'Video' },
  { type: 'IMAGES', category: 'MEDIA', label: 'Images' },
  { type: 'BANNER_IMAGE', category: 'MEDIA', label: 'Banner Image' },
  { type: 'PDF', category: 'MEDIA', label: 'PDF' },
  // CONTENT
  { type: 'RICH_TEXT', category: 'CONTENT', label: 'Rich Text' },
  { type: 'CALLOUT', category: 'CONTENT', label: 'Callout' },
  { type: 'IMAGE_TEXT', category: 'CONTENT', label: 'Image & Text' },
  // ASSESSMENT — KNOWLEDGE_CHECK is inline reinforcement (repeatable through a
  // lesson); QUIZ is the end-of-lesson assessment block. Both are distinct
  // from the course-level Final Course Quiz, which is never a lesson block.
  { type: 'KNOWLEDGE_CHECK', category: 'ASSESSMENT', label: 'Knowledge Check' },
  { type: 'QUIZ', category: 'ASSESSMENT', label: 'Quiz' },
  // LESSON FLOW
  { type: 'NEXT_LESSON', category: 'LESSON_FLOW', label: 'Next Lesson' },
];

export const BLOCK_TYPES = BLOCK_TYPE_CATALOG.map((b) => b.type);
export type BlockType = (typeof BLOCK_TYPES)[number];
