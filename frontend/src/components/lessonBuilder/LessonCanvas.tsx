import React from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, ChevronDown, ChevronUp, Trash2, Plus } from 'lucide-react';
import clsx from 'clsx';
import { LessonBlock, BlockTypeMeta } from '../../types/courseBuilder.types';
import { BLOCK_EDITOR_MAP } from './BlockEditors';

function labelFor(type: string, blockTypes: BlockTypeMeta[]): string {
  return blockTypes.find((b) => b.type === type)?.label ?? type;
}

function SortableBlockRow({
  block,
  index,
  label,
  expanded,
  onToggleExpand,
  onDelete,
  onContentChange,
}: {
  block: LessonBlock;
  index: number;
  label: string;
  expanded: boolean;
  onToggleExpand: () => void;
  onDelete: () => void;
  onContentChange: (content: Record<string, unknown>) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });
  const Editor = BLOCK_EDITOR_MAP[block.type];

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="rounded-lg border border-surface-border bg-white shadow-card">
      <div className="flex items-center gap-2.5 px-3 py-2.5">
        <button {...attributes} {...listeners} className="cursor-grab text-ink-faint hover:text-ink-muted">
          <GripVertical className="h-4 w-4" />
        </button>
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-accent/10 text-[10px] font-bold text-accent">
          {index + 1}
        </span>
        <button onClick={onToggleExpand} className="flex flex-1 items-center justify-between text-left">
          <span className="text-xs font-semibold text-ink">{label}</span>
          {expanded ? <ChevronUp className="h-4 w-4 text-ink-faint" /> : <ChevronDown className="h-4 w-4 text-ink-faint" />}
        </button>
        <button onClick={onDelete} className="text-ink-faint hover:text-status-danger" title="Delete block">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
      {expanded && Editor && (
        <div className="border-t border-surface-border p-4">
          <Editor content={block.content} onChange={onContentChange} />
        </div>
      )}
    </div>
  );
}

interface LessonCanvasProps {
  blocks: LessonBlock[];
  blockTypes: BlockTypeMeta[];
  expandedId: string | null;
  onToggleExpand: (id: string) => void;
  onReorder: (blockIds: string[]) => void;
  onDelete: (id: string) => void;
  onContentChange: (id: string, content: Record<string, unknown>) => void;
  onOpenLibrary: () => void;
}

export const LessonCanvas: React.FC<LessonCanvasProps> = ({
  blocks,
  blockTypes,
  expandedId,
  onToggleExpand,
  onReorder,
  onDelete,
  onContentChange,
  onOpenLibrary,
}) => {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));
  const sorted = blocks.slice().sort((a, b) => a.sortOrder - b.sortOrder);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = sorted.findIndex((b) => b.id === active.id);
    const newIndex = sorted.findIndex((b) => b.id === over.id);
    onReorder(arrayMove(sorted, oldIndex, newIndex).map((b) => b.id));
  };

  if (blocks.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-surface-border p-10 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-surface text-ink-faint">
          <GripVertical className="h-6 w-6" />
        </div>
        <h3 className="text-sm font-bold text-ink">Build Lesson</h3>
        <p className="max-w-xs text-xs text-ink-muted">
          Drag learning blocks from the toolbar or click below to start building your lesson content.
        </p>
        <button
          onClick={onOpenLibrary}
          className="mt-2 flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-accent-hover"
        >
          <Plus className="h-4 w-4" /> Add Block
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2.5 pb-6">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={sorted.map((b) => b.id)} strategy={verticalListSortingStrategy}>
          {sorted.map((block, index) => (
            <SortableBlockRow
              key={block.id}
              block={block}
              index={index}
              label={labelFor(block.type, blockTypes)}
              expanded={expandedId === block.id}
              onToggleExpand={() => onToggleExpand(block.id)}
              onDelete={() => onDelete(block.id)}
              onContentChange={(content) => onContentChange(block.id, content)}
            />
          ))}
        </SortableContext>
      </DndContext>

      <button
        onClick={onOpenLibrary}
        className={clsx(
          'flex w-full items-center justify-center gap-2 rounded-md border-2 border-dashed border-accent/40 py-2.5 text-xs font-semibold text-accent transition hover:border-accent hover:bg-accent/5',
        )}
      >
        <Plus className="h-4 w-4" /> Add Block
      </button>
    </div>
  );
};
