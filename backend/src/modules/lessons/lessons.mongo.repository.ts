import { randomUUID } from 'crypto';
import { LessonContentModel, LessonContentDocument, LessonBlockSubdoc } from './lessonContent.model';

export async function createLessonContent(lessonId: string, courseId: string, moduleId: string): Promise<void> {
  await LessonContentModel.create({ lessonId, courseId, moduleId, blocks: [], contentVersion: 1 });
}

export async function findLessonContentByLessonId(lessonId: string): Promise<LessonContentDocument | null> {
  return LessonContentModel.findOne({ lessonId }).exec();
}

export async function deleteLessonContent(lessonId: string): Promise<void> {
  await LessonContentModel.deleteOne({ lessonId }).exec();
}

function toPlainBlocks(doc: LessonContentDocument): LessonBlockSubdoc[] {
  return doc.blocks.map((b) => b.toObject());
}

/** Rewrites sortOrder to 1..n based on current array order — called after every mutation. */
function normalizeSortOrder(blocks: LessonBlockSubdoc[]): LessonBlockSubdoc[] {
  return blocks.map((b, index) => ({ ...b, sortOrder: index + 1 }));
}

export async function addBlock(
  lessonId: string,
  type: string,
  position: number | undefined,
  content: Record<string, unknown>,
  style: Record<string, unknown>,
): Promise<LessonBlockSubdoc[]> {
  const doc = await LessonContentModel.findOne({ lessonId }).exec();
  if (!doc) throw new Error('Lesson content not found.');

  const blocks = toPlainBlocks(doc);
  const newBlock = {
    id: randomUUID(),
    type,
    sortOrder: 0, // overwritten by normalizeSortOrder below
    content: content ?? {},
    style: style ?? {},
  } as LessonBlockSubdoc;

  const insertIndex = position !== undefined && position >= 1 && position <= blocks.length + 1
    ? position - 1
    : blocks.length;
  blocks.splice(insertIndex, 0, newBlock);

  doc.blocks = normalizeSortOrder(blocks) as unknown as typeof doc.blocks;
  doc.contentVersion += 1;
  await doc.save();
  return toPlainBlocks(doc);
}

export async function updateBlock(
  lessonId: string,
  blockId: string,
  patch: { content?: Record<string, unknown>; style?: Record<string, unknown> },
): Promise<LessonBlockSubdoc[]> {
  const doc = await LessonContentModel.findOne({ lessonId }).exec();
  if (!doc) throw new Error('Lesson content not found.');

  const block = doc.blocks.find((b) => b.id === blockId);
  if (!block) throw new Error('Block not found.');

  if (patch.content !== undefined) block.content = patch.content;
  if (patch.style !== undefined) block.style = patch.style;

  doc.contentVersion += 1;
  await doc.save();
  return toPlainBlocks(doc);
}

export async function deleteBlock(lessonId: string, blockId: string): Promise<LessonBlockSubdoc[]> {
  const doc = await LessonContentModel.findOne({ lessonId }).exec();
  if (!doc) throw new Error('Lesson content not found.');

  const exists = doc.blocks.some((b) => b.id === blockId);
  if (!exists) throw new Error('Block not found.');

  const remaining = toPlainBlocks(doc).filter((b) => b.id !== blockId);
  doc.blocks = normalizeSortOrder(remaining) as unknown as typeof doc.blocks;
  doc.contentVersion += 1;
  await doc.save();
  return toPlainBlocks(doc);
}

/**
 * Reorders to match blockIds exactly. All-or-nothing: the requested ID set
 * must equal the lesson's existing block ID set (no additions/removals here,
 * no duplicates) before anything is applied.
 */
export async function reorderBlocks(lessonId: string, blockIds: string[]): Promise<LessonBlockSubdoc[]> {
  const doc = await LessonContentModel.findOne({ lessonId }).exec();
  if (!doc) throw new Error('Lesson content not found.');

  if (new Set(blockIds).size !== blockIds.length) {
    throw new Error('blockIds contains duplicate entries.');
  }

  const existingIds = new Set(doc.blocks.map((b) => b.id));
  const requestedIds = new Set(blockIds);
  const sameSet =
    existingIds.size === requestedIds.size && [...existingIds].every((id) => requestedIds.has(id));
  if (!sameSet) {
    throw new Error("blockIds must match the lesson's existing block set exactly.");
  }

  const byId = new Map(toPlainBlocks(doc).map((b) => [b.id, b]));
  const reordered = blockIds.map((id, index) => ({ ...byId.get(id)!, sortOrder: index + 1 }));

  // Reordering isn't a content edit — contentVersion is intentionally NOT bumped here.
  doc.blocks = reordered as unknown as typeof doc.blocks;
  await doc.save();
  return toPlainBlocks(doc);
}
